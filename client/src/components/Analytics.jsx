// src/components/Analytics.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Eye, ThumbsUp, Share2, Lightbulb } from 'lucide-react';

function Analytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/analytics')
      .then(response => {
        setAnalytics(response.data.analytics);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching analytics", error);
        setLoading(false);
      });
  }, []);

  // Platform badge color mapping
  const getPlatformColor = (platform) => {
    const platformColors = {
      'YouTube': 'bg-red-500',
      'Instagram': 'bg-purple-500',
      'TikTok': 'bg-black',
      'Twitter': 'bg-blue-400',
      'Facebook': 'bg-blue-600',
      'LinkedIn': 'bg-blue-700',
    };
    
    return platformColors[platform] || 'bg-[#4361ee]';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-[#4361ee] animate-spin mb-4" />
        <p className="text-[#64748b] dark:text-[#94a3b8]">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#334155] dark:text-white">Analytics & Suggestions</h2>
        <div className="text-sm text-[#64748b] dark:text-[#94a3b8]">
          {analytics.length} posts analyzed
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.map((item, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-[#e2e8f0] dark:border-[#334155] overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-[#334155] dark:text-white">{item.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${getPlatformColor(item.platform)}`}>
                  {item.platform}
                </span>
              </div>
              
              <div className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-4">
                <p className="truncate">{item.videoPath}</p>
                <p className="mt-1">Posted: {new Date(item.datePosted).toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-3 rounded-lg flex flex-col items-center">
                  <Eye className="h-5 w-5 text-[#4361ee] mb-1" />
                  <span className="text-lg font-semibold text-[#334155] dark:text-white">{item.analytics.views}</span>
                  <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Views</span>
                </div>
                
                <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-3 rounded-lg flex flex-col items-center">
                  <ThumbsUp className="h-5 w-5 text-[#4361ee] mb-1" />
                  <span className="text-lg font-semibold text-[#334155] dark:text-white">{item.analytics.likes}</span>
                  <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Likes</span>
                </div>
                
                <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-3 rounded-lg flex flex-col items-center">
                  <Share2 className="h-5 w-5 text-[#4361ee] mb-1" />
                  <span className="text-lg font-semibold text-[#334155] dark:text-white">{item.analytics.shares}</span>
                  <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Shares</span>
                </div>
              </div>
              
              <div className="bg-[#eef2ff] dark:bg-[#3a0ca3]/10 p-4 rounded-lg flex gap-3">
                <Lightbulb className="h-5 w-5 text-[#4cc9f0] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[#334155] dark:text-white mb-1">Suggestion</h4>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{item.analytics.suggestion}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {analytics.length === 0 && (
        <div className="text-center py-12 text-[#64748b] dark:text-[#94a3b8]">
          No analytics data available
        </div>
      )}
    </div>
  );
}

export default Analytics;