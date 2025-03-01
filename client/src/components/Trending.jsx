// src/components/Trending.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, ExternalLink, Loader } from 'lucide-react';

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/trending')
      .then(response => {
        setTrending(response.data.trending);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching trending data", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 text-[#4361ee] animate-spin" />
        <p className="mt-4 text-[#64748b] dark:text-[#94a3b8] font-medium">Loading trending videos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trending.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#64748b] dark:text-[#94a3b8]">No trending videos available at the moment.</p>
        </div>
      ) : (
        trending.map((video, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#334155] overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-[#4361ee]" />
                <h3 className="font-semibold text-[#334155] dark:text-white">
                  {video.platform}
                </h3>
              </div>
              
              <p className="text-[#64748b] dark:text-[#94a3b8] mb-4">
                {video.description}
              </p>
              
              <a 
                href={video.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#4361ee] text-white hover:bg-[#2c46cc] transition-colors"
              >
                Watch Video
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Trending;