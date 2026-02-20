import { RawCsvRow, ProductAnalysis, RelatedProduct } from '../types';

/**
 * Robustly parses a single CSV line handling quotes and escaped quotes.
 */
const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseCSV = (csvText: string): RawCsvRow[] => {
  const lines = csvText.split('\n');
  const rows: RawCsvRow[] = [];
  
  // Detect if there's a header and skip it
  const startIndex = lines[0].toLowerCase().startsWith('product title') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Use robust CSV parsing
    const columns = parseCsvLine(line);
    
    // We expect: Title, Count, Variants
    // If the split resulted in > 3 columns, it implies the variants column was unquoted 
    // but contained commas (invalid CSV, but we can try to recover).
    // However, our parseCsvLine handles quoted commas correctly.
    
    if (columns.length < 2) continue; // Need at least Title and Count
    
    let title = columns[0];
    const countRaw = columns[1];
    let variantsRaw = columns.slice(2).join(','); // Rejoin purely as a fallback

    // Clean up potential artifacts
    title = title.replace(/^"|"$/g, '').replace(/""/g, '"');
    
    const count = parseInt(countRaw, 10);
    
    // Skip garbage rows where title looks like a list or object
    if (title.startsWith("['") || title.startsWith('{"')) continue;

    if (isNaN(count)) continue;

    rows.push({
      productTitle: title,
      count,
      variantsRaw: variantsRaw || "[]"
    });
  }

  return rows;
};

/**
 * Extracts individual items from the Python-style list string.
 * Handles escaped quotes e.g. 'Alpha\'s'
 */
const parseVariantString = (raw: string): string[] => {
  if (!raw || raw === '""') return [];
  
  let content = raw.trim();
  
  // Clean up wrapping quotes and brackets
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  // Handle double wrapping if parser didn't strip outer quotes of the column
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  
  if (content.startsWith('[') && content.endsWith(']')) {
    content = content.slice(1, -1);
  }

  // Regex to capture single or double quoted strings, respecting backslash escapes
  const regex = /('((?:[^'\\]|\\.)*)')|("((?:[^"\\]|\\.)*)")/g;
  const items: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
      let item = match[2] || match[4] || "";
      // Unescape: Replace \' with ' and \" with "
      item = item.replace(/\\(['"])/g, '$1').replace(/\\\\/g, '\\');
      items.push(item.trim());
  }
  
  return items;
};

/**
 * Normalizes product names to merge SEO-stuffed titles with clean titles.
 * Strategy: "Title - SEO Junk Format" -> "Title Format"
 */
const normalizeName = (name: string): string => {
  if (!name) return "";
  let cleaned = name.trim();

  // 1. Remove [PRE-ORDER], (PRE-ORDER) tags
  cleaned = cleaned.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
  
  return cleaned.trim();
};

export const processData = (rawData: RawCsvRow[]): ProductAnalysis[] => {
  const explicitMainProducts = new Set<string>();
  
  // First pass: Collect all normalized main product names
  rawData.forEach(r => {
      // Skip if title looks like a list (parsing artifact)
      if (r.productTitle.trim().startsWith("['")) return;
      
      const norm = normalizeName(r.productTitle);
      if (norm) explicitMainProducts.add(norm);
  });

  const analysisMap = new Map<string, { 
    totalTransactions: number;
    relatedCounts: Map<string, number>;
  }>();

  const getOrCreateEntry = (name: string) => {
    if (!analysisMap.has(name)) {
      analysisMap.set(name, { totalTransactions: 0, relatedCounts: new Map() });
    }
    return analysisMap.get(name)!;
  };

  rawData.forEach(row => {
    let mainProduct = normalizeName(row.productTitle);
    
    // Safety check: if normalization emptied it or it's garbage
    if (!mainProduct || mainProduct.startsWith("['")) return;
    
    const weight = row.count > 0 ? row.count : 1;
    const variants = parseVariantString(row.variantsRaw).map(normalizeName).filter(n => n.length > 0);

    // --- Pass 1: Update Explicit Main Product ---
    // If the row has a valid main product title
    if (mainProduct) {
        const mainEntry = getOrCreateEntry(mainProduct);
        mainEntry.totalTransactions += weight;
        
        variants.forEach(variant => {
            if (variant !== mainProduct) {
                const current = mainEntry.relatedCounts.get(variant) || 0;
                mainEntry.relatedCounts.set(variant, current + weight);
            }
        });
    }

    // --- Pass 2: Implicit Products (Reverse Lookup) ---
    variants.forEach(variant => {
        if (variant === mainProduct) return;

        // If this variant is already an explicit main product, it has its own rows, so we rely on those.
        // However, if the current row represents a bundle where the "Main Product" is "Bundle X",
        // and "Book A" is inside it, "Book A" might NOT have a row where IT is the main product 
        // IF it was never bought solo.
        // BUT, if "Book A" DOES have solo rows, we don't want to double count this bundle row 
        // unless we are sure this specific transaction isn't already accounted for.
        // Simplified Logic: If a product exists in explicitMainProducts, we assume the CSV contains
        // rows for it (either solo or as the lead item). 
        // If it DOES NOT exist in explicitMainProducts, it's an "Implicit Product" (never bought as primary).
        // We need to create an entry for it.
        
        if (!explicitMainProducts.has(variant)) {
            const implicitEntry = getOrCreateEntry(variant);
            implicitEntry.totalTransactions += weight;

            // Cross sells for this implicit product are the other items in the cart
            // (including the main product of this row)
            if (mainProduct) {
                const currentMain = implicitEntry.relatedCounts.get(mainProduct) || 0;
                implicitEntry.relatedCounts.set(mainProduct, currentMain + weight);
            }
            
            variants.forEach(other => {
                if (other !== variant) {
                    const current = implicitEntry.relatedCounts.get(other) || 0;
                    implicitEntry.relatedCounts.set(other, current + weight);
                }
            });
        }
    });
  });

  // Convert map to array
  const results: ProductAnalysis[] = [];

  analysisMap.forEach((data, productName) => {
    const relatedProducts: RelatedProduct[] = [];
    data.relatedCounts.forEach((count, name) => {
      relatedProducts.push({ name, count });
    });

    relatedProducts.sort((a, b) => b.count - a.count);

    const topUpsell = relatedProducts.length > 0 ? relatedProducts[0] : null;

    results.push({
      id: productName, 
      name: productName,
      totalTransactions: data.totalTransactions,
      relatedProducts,
      topUpsell
    });
  });

  return results.sort((a, b) => a.name.localeCompare(b.name));
};