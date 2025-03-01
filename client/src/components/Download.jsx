// src/components/Download.jsx
import React, { useState } from 'react';
import { Download as DownloadIcon, Check, AlertCircle } from 'lucide-react';

const Download = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaType, setMediaType] = useState('video');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!videoUrl) {
      setError('Please enter a video URL');
      return;
    }
    
    setLoading(true);
    setStatus(null);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl,
          media_type: mediaType
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('Download successful!');
        setError(null);
      } else {
        setError(data.error || 'Download failed');
        setStatus(null);
      }
    } catch (err) {
      setError('Failed to connect to the server');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e293b] p-6 rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
        <h3 className="text-lg font-medium mb-4 text-[#334155] dark:text-white">
          Download Media
        </h3>
        
        <form onSubmit={handleDownload} className="space-y-4">
          <div>
            <label 
              htmlFor="videoUrl" 
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-1"
            >
              Video URL
            </label>
            <input
              id="videoUrl"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter URL (YouTube, Instagram, etc.)"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#334155] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-1">
              Media Type
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="video"
                  checked={mediaType === 'video'}
                  onChange={() => setMediaType('video')}
                  className="h-4 w-4 text-[#4361ee]"
                />
                <span className="ml-2 text-[#334155] dark:text-white">Video</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="audio"
                  checked={mediaType === 'audio'}
                  onChange={() => setMediaType('audio')}
                  className="h-4 w-4 text-[#4361ee]"
                />
                <span className="ml-2 text-[#334155] dark:text-white">Audio Only</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${
              loading 
                ? 'bg-[#4361ee]/70 cursor-not-allowed' 
                : 'bg-[#4361ee] hover:bg-[#2c46cc]'
            }`}
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <DownloadIcon size={18} />
                <span>Download</span>
              </>
            )}
          </button>
        </form>
      </div>
      
      {(status || error) && (
        <div className={`p-4 rounded-lg ${
          status ? 'bg-[#10b981]/10 border border-[#10b981]/30' : 'bg-[#ef4444]/10 border border-[#ef4444]/30'
        }`}>
          <div className="flex items-start gap-3">
            {status ? (
              <Check size={20} className="text-[#10b981] mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-[#ef4444] mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${
                status ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}>
                {status ? 'Success' : 'Error'}
              </p>
              <p className="text-[#64748b] dark:text-[#94a3b8]">
                {status || error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-4 rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
          <strong>Note:</strong> You can download videos from platforms like YouTube, Instagram, Facebook, Twitter, and many other sources. Downloaded files will be saved to the server's 'downloads' folder.
        </p>
      </div>
    </div>
  );
};

export default Download;