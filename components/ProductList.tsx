import React, { useState } from 'react';
import { ProductAnalysis } from '../types';
import { Search, ChevronRight, TrendingUp } from 'lucide-react';

interface ProductListProps {
  products: ProductAnalysis[];
  onSelectProduct: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Product Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">Found {products.length} unique products with transaction history</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 w-1/3">Product Name</th>
              <th className="px-6 py-4 text-center">Transactions</th>
              <th className="px-6 py-4 w-1/3">Top Upsell Opportunity</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <tr 
                key={product.id} 
                onClick={() => onSelectProduct(product.id)}
                className="hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 line-clamp-2" title={product.name}>{product.name}</div>
                </td>
                <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.totalTransactions}
                    </span>
                </td>
                <td className="px-6 py-4">
                  {product.topUpsell ? (
                    <div className="flex items-center text-green-700">
                        <TrendingUp size={16} className="mr-2 flex-shrink-0" />
                        <span className="font-medium text-sm truncate max-w-[200px] block" title={product.topUpsell.name}>
                            {product.topUpsell.name}
                        </span>
                        <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            {product.topUpsell.count}x
                        </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No significant cross-sells</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-gray-400 group-hover:text-blue-500">
                  <ChevronRight size={20} className="ml-auto" />
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No products found matching "{searchTerm}"
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;