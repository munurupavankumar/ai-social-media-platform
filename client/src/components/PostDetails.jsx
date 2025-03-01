// src/components/PostDetails.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle, Video, Twitter } from 'lucide-react';

const PostDetails = () => {
  const [postId, setPostId] = useState('');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchPost = async () => {
    if (!postId.trim()) {
      setError('Please enter a post ID');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:3000/api/post/${postId}`);
      setPost(response.data.post);
    } catch (err) {
      console.error(err);
      setError('Error fetching post details');
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg p-4 shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
        <h3 className="text-lg font-medium text-[#334155] dark:text-white mb-4">Find Post</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#64748b] dark:text-[#94a3b8]" />
            </div>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="Enter post ID"
              className="block w-full pl-10 pr-3 py-2 border border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] text-[#334155] dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
            />
          </div>
          <button 
            onClick={handleFetchPost}
            disabled={loading}
            className="px-4 py-2 bg-[#4361ee] hover:bg-[#2c46cc] text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? 'Loading...' : 'Fetch Post'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-[#fee2e2] dark:bg-[#7f1d1d]/20 text-[#ef4444] dark:text-[#fca5a5] rounded-lg flex items-start gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Post Details Section */}
      {post && (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg overflow-hidden shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#334155] dark:text-white">{post.title}</h2>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide mb-1">Description</h4>
                  <p className="text-[#334155] dark:text-white">{post.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide mb-1">Platform</h4>
                  <div className="flex items-center gap-2">
                    {post.platform.toLowerCase() === 'twitter' && <Twitter size={18} className="text-[#1DA1F2]" />}
                    <span className="text-[#334155] dark:text-white">{post.platform}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide mb-1">Date Posted</h4>
                  <p className="text-[#334155] dark:text-white">
                    {new Date(post.datePosted).toLocaleString()}
                  </p>
                </div>
                
                {post.platform.toLowerCase() === 'twitter' && post.tweetId && (
                  <div>
                    <h4 className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide mb-1">Tweet</h4>
                    <a
                      href={`https://twitter.com/i/web/status/${post.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#4361ee] hover:text-[#2c46cc] dark:text-[#5e7aff] dark:hover:text-[#4361ee] font-medium"
                    >
                      View Tweet
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              
              {post.videoPath && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide">Video Preview</h4>
                  <div className="rounded-lg overflow-hidden bg-[#0f172a] border border-[#334155]">
                    <div className="aspect-w-16 aspect-h-9 bg-[#0f172a] flex items-center justify-center">
                      <video 
                        className="w-full h-auto rounded-lg" 
                        controls
                      >
                        <source src={`http://localhost:3000/${post.videoPath}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="p-3 flex items-center gap-2 bg-[#0f172a]">
                      <Video size={16} className="text-[#4cc9f0]" />
                      <span className="text-sm text-[#94a3b8]">Video Content</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;