export interface RawCsvRow {
  productTitle: string;
  count: number;
  variantsRaw: string;
}

export interface RelatedProduct {
  name: string;
  count: number;
}

export interface ProductAnalysis {
  id: string;
  name: string;
  totalTransactions: number;
  relatedProducts: RelatedProduct[];
  topUpsell: RelatedProduct | null;
}

export interface AppState {
  data: ProductAnalysis[];
  selectedProductId: string | null;
  hasData: boolean;
}