// src/components/ExportAnalytics.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Download, AlertTriangle, Info } from 'lucide-react';

const ExportAnalytics = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError('');
      setExportSuccess(false);
      
      // Call the export endpoint and expect a blob response
      const response = await axios.get('http://localhost:3000/api/export-analytics', {
        responseType: 'blob',
      });

      // Create a blob URL from the response data
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      // Set the desired file name
      link.setAttribute('download', 'analytics_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportSuccess(true);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      setExportError('Failed to export analytics data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart className="text-[#4361ee]" size={20} />
        <h2 className="text-xl font-semibold text-[#334155] dark:text-white">Export Analytics Data</h2>
      </div>
      
      <div className="p-3 bg-[#f1f5f9] dark:bg-[#334155] rounded-lg border border-[#e2e8f0] dark:border-[#475569] flex items-start gap-2">
        <Info size={18} className="text-[#4361ee] mt-0.5 shrink-0" />
        <span className="text-sm text-[#334155] dark:text-[#e2e8f0]">
          Download your social media analytics data as a CSV file for detailed analysis in spreadsheet software.
        </span>
      </div>
      
      <div className="pt-2">
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${isExporting ? 'bg-[#94a3b8] dark:bg-[#475569] text-[#f1f5f9] cursor-not-allowed' : 'bg-[#4361ee] hover:bg-[#2c46cc] text-white shadow-sm'}`}
        >
          <Download size={16} className="mr-2" />
          {isExporting ? 'Generating Report...' : 'Download CSV Report'}
        </button>
      </div>
      
      {exportError && (
        <div className="p-4 bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fecaca] dark:border-[#ef4444]/20 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-[#ef4444] mt-0.5 shrink-0" />
          <div>
            <p className="text-[#b91c1c] dark:text-[#fca5a5] font-medium">Export Failed</p>
            <p className="text-[#ef4444]/80 dark:text-[#fca5a5]/80 text-sm">{exportError}</p>
          </div>
        </div>
      )}
      
      {exportSuccess && (
        <div className="p-3 bg-[#f0fdf4] dark:bg-[#14532d]/20 border border-[#bbf7d0] dark:border-[#10b981]/20 rounded-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-[#10b981]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-[#047857] dark:text-[#4ade80] text-sm">Analytics report successfully downloaded!</span>
        </div>
      )}
    </div>
  );
};

export default ExportAnalytics;