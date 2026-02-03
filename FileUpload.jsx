import React, { useCallback } from 'react';
import Papa from 'papaparse';
import { UploadCloud } from 'lucide-react';
import { processData } from '../utils/dataProcessing';

const FileUpload = ({ onDataLoaded }) => {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const processed = processData(results.data);
                onDataLoaded(processed);
            },
            error: (error) => {
                console.error('CSV Error:', error);
                alert('Error parsing CSV file');
            }
        });
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload QA CSV</h3>
            <p className="text-gray-500 mb-6">Drag and drop or click to select file</p>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
            />
            <label
                htmlFor="csv-upload"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer font-medium"
            >
                Select File
            </label>
        </div>
    );
};

export default FileUpload;
