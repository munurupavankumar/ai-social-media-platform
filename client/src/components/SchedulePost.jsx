// src/components/SchedulePost.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, VideoIcon, AlertTriangle, Info, Send, Tag } from 'lucide-react';

function SchedulePost() {
  const [videoPath, setVideoPath] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [platform, setPlatform] = useState('Twitter');
  const [delay, setDelay] = useState(0);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setResult(null);
    
    const keywordsArray = keywords.split(',').map(keyword => keyword.trim());
    
    axios.post('http://localhost:3000/api/schedulePost', {
      videoPath,
      title,
      description,
      keywords: keywordsArray,
      platform,
      delay: parseInt(delay, 10)
    })
      .then(response => {
        setResult(response.data);
        setIsSubmitting(false);
      })
      .catch(error => {
        console.error("Error scheduling post", error);
        setSubmitError(error.response?.data?.error || "Failed to schedule post");
        setIsSubmitting(false);
      });
  };

  const getPlatformColor = () => {
    switch(platform) {
      case 'Twitter': return 'bg-[#1DA1F2] text-white';
      case 'Instagram': return 'bg-gradient-to-r from-[#405DE6] via-[#E1306C] to-[#FFDC80] text-white';
      case 'Threads': return 'bg-black text-white';
      case 'Pinterest': return 'bg-[#E60023] text-white';
      case 'Facebook': return 'bg-[#1877F2] text-white';
      default: return 'bg-[#4361ee] text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-[#4361ee]" size={20} />
          <h2 className="text-xl font-semibold text-[#334155] dark:text-white">Schedule Post to Social Media</h2>
        </div>
        {platform && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor()}`}>
            {platform}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-[#f1f5f9] dark:bg-[#334155] rounded-lg border border-[#e2e8f0] dark:border-[#475569] flex items-start gap-2">
        <Info size={18} className="text-[#4361ee] mt-0.5 shrink-0" />
        <span className="text-sm text-[#334155] dark:text-[#e2e8f0]">
          Schedule your social media posts to be published after a specified delay. Enter the details below and specify the delay in seconds.
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Video Path Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Video Path</label>
            <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <VideoIcon size={16} className="text-[#64748b] dark:text-[#94a3b8]" />
              </div>
              <input 
                type="text"
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
                placeholder="Enter video path (e.g., spinoff_video.mp4)"
                className="block w-full pl-10 pr-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none"
              />
            </div>
            <p className="text-[#64748b] dark:text-[#94a3b8] text-xs">
              Relative to the downloads folder (just the filename is usually sufficient)
            </p>
          </div>

          {/* Platform Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Platform</label>
            <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white appearance-none focus:outline-none"
              >
                <option value="Twitter">Twitter</option>
                <option value="Instagram">Instagram</option>
                <option value="Threads">Threads</option>
                <option value="Pinterest">Pinterest</option>
                <option value="Facebook">Facebook</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-[#64748b] dark:text-[#94a3b8]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Title</label>
          <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a catchy title for your post"
              className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none"
            />
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Description</label>
          <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a compelling description for your post"
              className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none resize-none"
              rows="3"
            />
          </div>
        </div>

        {/* Keywords Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-1">
            <Tag size={14} />
            Keywords (comma separated)
          </label>
          <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
            <input 
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas (e.g., viral, trending, funny)"
              className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none"
            />
          </div>
          {keywords && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {keywords.split(',').map((tag, index) => (
                tag.trim() && (
                  <span key={index} className="bg-[#e0f2fe] dark:bg-[#0c4a6e] text-[#0284c7] dark:text-[#7dd3fc] text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>#</span>{tag.trim().replace(/^#/, '')}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        {/* Delay Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-1">
            <Clock size={14} />
            Delay (in seconds)
          </label>
          <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
            <input 
              type="number"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              placeholder="Enter delay in seconds"
              min="0"
              className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none"
            />
          </div>
          <p className="text-[#64748b] dark:text-[#94a3b8] text-xs">
            Number of seconds to wait before posting (0 for immediate scheduling)
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${isSubmitting ? 'bg-[#94a3b8] dark:bg-[#475569] text-[#f1f5f9] cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-sm'}`}
          >
            <Send size={16} className="mr-2" />
            {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
          </button>
        </div>
      </form>

      {submitError && (
        <div className="p-4 bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fecaca] dark:border-[#ef4444]/20 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-[#ef4444] mt-0.5 shrink-0" />
          <div>
            <p className="text-[#b91c1c] dark:text-[#fca5a5] font-medium">Error</p>
            <p className="text-[#ef4444]/80 dark:text-[#fca5a5]/80 text-sm">{submitError}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-2">
            <Info size={16} className="text-[#4361ee]" />
            Response from server
          </h3>
          
          <div className="bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-lg overflow-hidden">
            <pre className="whitespace-pre-wrap text-xs p-4 overflow-auto max-h-60 text-[#334155] dark:text-[#e2e8f0]">{JSON.stringify(result, null, 2)}</pre>
          </div>
          
          {result.success && (
            <div className="p-3 bg-[#f0fdf4] dark:bg-[#14532d]/20 border border-[#bbf7d0] dark:border-[#10b981]/20 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-[#10b981]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[#047857] dark:text-[#4ade80] text-sm">
                Post successfully scheduled for {platform}! {delay > 0 ? `Will be published in ${delay} seconds.` : 'Scheduled for immediate posting.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SchedulePost;