import React, { useState, useMemo, useEffect } from 'react';
import { parseCSV, processData } from './utils/dataProcessing';
import { ProductAnalysis } from './types';
import DataInput from './components/DataInput';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import { BarChart3, Trash2, Calendar } from 'lucide-react';

const STORAGE_KEY = 'cross_sell_data_v1';

const App: React.FC = () => {
  const [yearlyData, setYearlyData] = useState<Record<string, ProductAnalysis[]>>({});
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setYearlyData(parsed);
        // Select the most recent year (lexicographically last) by default if available
        const years = Object.keys(parsed).sort();
        if (years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        }
      } catch (e) {
        console.error("Failed to load stored data", e);
      }
    }
  }, []);

  // Save data to local storage whenever it changes
  useEffect(() => {
    if (Object.keys(yearlyData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(yearlyData));
    }
  }, [yearlyData]);

  const handleDataLoaded = (csvText: string, year: string) => {
    try {
      setError(null);
      const rawRows = parseCSV(csvText);
      const analyzedData = processData(rawRows);
      
      if (analyzedData.length === 0) {
        setError("No valid product data found in the input.");
        return;
      }

      setYearlyData(prev => ({
        ...prev,
        [year]: analyzedData
      }));
      setSelectedYear(year);
      setSelectedProductId(null);
    } catch (e) {
      console.error(e);
      setError("Failed to parse data. Please check the format.");
    }
  };

  const handleDeleteYear = (year: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete data for ${year}?`)) {
      setYearlyData(prev => {
        const next = { ...prev };
        delete next[year];
        if (Object.keys(next).length === 0) {
            localStorage.removeItem(STORAGE_KEY);
        }
        return next;
      });
      if (selectedYear === year) {
        setSelectedYear(null);
        setSelectedProductId(null);
      }
    }
  };

  const currentData = useMemo(() => {
    if (!selectedYear) return [];
    return yearlyData[selectedYear] || [];
  }, [yearlyData, selectedYear]);

  const selectedProduct = useMemo(() => 
    currentData.find(p => p.id === selectedProductId), 
  [currentData, selectedProductId]);

  const years = useMemo(() => Object.keys(yearlyData).sort().reverse(), [yearlyData]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 cursor-pointer" onClick={() => { setSelectedProductId(null); setSelectedYear(null); }}>
            <BarChart3 size={28} />
            <span className="text-xl font-bold tracking-tight text-gray-900">Cross-Sell<span className="text-blue-600">Analyzer</span></span>
          </div>
          
          <div className="flex items-center gap-4">
             {years.length > 0 && (
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Year:</span>
                    <select 
                        value={selectedYear || ''} 
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedProductId(null);
                        }}
                        className="bg-gray-100 border-none text-sm font-medium rounded-md py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-blue-500"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                        <option value="">+ Add New</option>
                    </select>
                 </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {!selectedYear || currentData.length === 0 ? (
          <div>
            {years.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Saved Reports</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {years.map(year => (
                            <div 
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{year}</div>
                                        <div className="text-xs text-gray-500">{yearlyData[year]?.length || 0} Products</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteYear(year, e)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                    title="Delete Report"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <DataInput onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-gray-400 font-normal">Report:</span> {selectedYear}
                </h1>
                <button 
                    onClick={() => { setSelectedYear(null); setSelectedProductId(null); }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Switch Year / Upload New
                </button>
            </div>

            {selectedProduct ? (
              <ProductDetail 
                product={selectedProduct} 
                onBack={() => setSelectedProductId(null)} 
              />
            ) : (
              <ProductList 
                products={currentData} 
                onSelectProduct={setSelectedProductId} 
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;