import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { Sheet } from 'lucide-react';

function App() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [outliers, setOutliers] = useState(null);

  const handleDataLoaded = (processed) => {
    setData(processed.data);
    setStats(processed.stats);
    setOutliers(processed.outliers);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sheet className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Receiving QA Analysis
              </h1>
            </div>
            {data && (
              <button
                onClick={() => { setData(null); setStats(null); }}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Upload New File
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="max-w-xl mx-auto mt-20">
            <FileUpload onDataLoaded={handleDataLoaded} />
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>Supported Format: CSV export from Inspection Tool</p>
              <p>Columns: Lot Number, Sheet Number, Sensor Position, Comment, ...</p>
            </div>
          </div>
        ) : (
          <Dashboard data={data} stats={stats} outliers={outliers} />
        )}
      </main>
    </div>
  );
}

export default App;
