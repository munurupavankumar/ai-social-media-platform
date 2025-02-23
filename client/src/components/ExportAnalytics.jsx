// src/components/ExportAnalytics.jsx
import React from 'react';
import axios from 'axios';

const ExportAnalytics = () => {
  const handleExport = async () => {
    try {
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
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  return (
    <div>
      <h2>Export Analytics Data</h2>
      <button onClick={handleExport}>Download CSV Report</button>
    </div>
  );
};

export default ExportAnalytics;
