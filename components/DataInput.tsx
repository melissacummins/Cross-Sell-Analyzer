import React, { useState } from 'react';
import { Upload, FileText, Play } from 'lucide-react';
import { SAMPLE_CSV_DATA } from '../constants';

interface DataInputProps {
  onDataLoaded: (csvText: string, year: string) => void;
}

const DataInput: React.FC<DataInputProps> = ({ onDataLoaded }) => {
  const [inputText, setInputText] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onDataLoaded(event.target.result as string, year);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSampleLoad = () => {
    onDataLoaded(SAMPLE_CSV_DATA, "Sample Data");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Cross-Purchase Data</h2>
          <p className="text-gray-500">Upload your Shopify export or paste the CSV content below to analyze bundle opportunities.</p>
        </div>

        <div className="mb-6 max-w-xs mx-auto">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Data Year / Label</label>
            <input
                type="text"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                placeholder="e.g. 2024"
            />
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-6 cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Drag and drop your CSV file here</p>
          <p className="text-sm text-gray-500 mt-2">or paste the text below</p>
        </div>

        <div className="mb-6">
            <textarea 
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste CSV content here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
        </div>

        <div className="flex gap-4 justify-center">
             <button 
                onClick={() => onDataLoaded(inputText, year)}
                disabled={!inputText.trim() || !year.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                    ${inputText.trim() && year.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
                <FileText size={20} />
                Analyze Text
            </button>
            <button 
                onClick={handleSampleLoad}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
                <Play size={20} />
                Load Sample Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataInput;