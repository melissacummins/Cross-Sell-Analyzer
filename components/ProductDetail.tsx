import React from 'react';
import { ProductAnalysis } from '../types';
import { ArrowLeft, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProductDetailProps {
  product: ProductAnalysis;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  // Prepare data for chart (Top 10)
  const chartData = product.relatedProducts.slice(0, 10);
  const totalCrossSells = product.relatedProducts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium mb-2"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <ShoppingBag size={16} />
                        Analyzed {product.totalTransactions} Orders
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{product.relatedProducts.length} Unique Cross-Sell Items</span>
                </div>
            </div>
             {product.topUpsell && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-4 max-w-md">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Top Recommendation</p>
                        <p className="font-semibold text-green-900 line-clamp-1" title={product.topUpsell.name}>
                            {product.topUpsell.name}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Bought together {product.topUpsell.count} times ({Math.round((product.topUpsell.count / product.totalTransactions) * 100)}% of orders)
                        </p>
                    </div>
                </div>
            )}
        </div>

        {product.relatedProducts.length > 0 ? (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Cross-Purchase Distribution</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={180} 
                                        tick={{fontSize: 11}} 
                                        tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + '...' : val}
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#93C5FD'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                            <h4 className="font-semibold text-blue-900 mb-2">Engagement Rate</h4>
                            <div className="text-3xl font-bold text-blue-700">
                                {totalCrossSells > 0 ? (totalCrossSells / product.totalTransactions).toFixed(1) : 0}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Avg. extra items per order containing this product</p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-800 mb-4">Quick Insights</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    Most frequently paired with "{product.topUpsell?.name}"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    {product.relatedProducts.length} different products have been bought alongside this item.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Breakdown</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Co-Purchased Item</th>
                                    <th className="px-6 py-3 text-right">Frequency</th>
                                    <th className="px-6 py-3 text-right">% of Orders</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {product.relatedProducts.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-3 text-right">{item.count}</td>
                                        <td className="px-6 py-3 text-right text-gray-500">
                                            {((item.count / product.totalTransactions) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Cross-Purchase Data</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                    This product appears in {product.totalTransactions} orders, but it was always purchased alone or the data provided didn't contain other identifiable items.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;