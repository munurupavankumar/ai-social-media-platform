// src/components/Trending.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, ExternalLink, Loader, Search, Play, Clock } from 'lucide-react';
import ReactPlayer from 'react-player';

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtag, setHashtag] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [playingVideos, setPlayingVideos] = useState({});
  const [postType, setPostType] = useState('top'); // 'top' or 'recent'
  const [thumbnails, setThumbnails] = useState({}); // Store video thumbnails

  useEffect(() => {
    // Extract hashtag and type from URL query parameters on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const hashtagParam = urlParams.get('hashtag');
    const typeParam = urlParams.get('type');
    
    if (hashtagParam) {
      setHashtag(hashtagParam);
      setSearchInput(hashtagParam);
      
      if (typeParam && ['top', 'recent'].includes(typeParam)) {
        setPostType(typeParam);
      }
      
      fetchTrendingVideos(hashtagParam, typeParam || postType);
    } else {
      // Default hashtag if none provided
      const defaultHashtag = 'reels';
      setHashtag(defaultHashtag);
      setSearchInput(defaultHashtag);
      fetchTrendingVideos(defaultHashtag, postType);
    }
  }, []);

  const fetchTrendingVideos = (tag, type = postType) => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/trending?hashtag=${tag}&type=${type}`)
      .then(response => {
        setTrending(response.data.trending);
        setLoading(false);
        // After loading videos, capture thumbnails
        response.data.trending.forEach(video => {
          captureVideoThumbnail(video);
        });
      })
      .catch(error => {
        console.error("Error fetching trending data", error);
        setLoading(false);
      });
  };

  // Function to capture video thumbnails
  const captureVideoThumbnail = (video) => {
    // Create a hidden video element to extract thumbnail
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = "anonymous";
    videoElement.src = video.video_url || video.media_url;
    videoElement.muted = true;
    videoElement.preload = "metadata";
    
    videoElement.onloadedmetadata = () => {
      // Set time to 0.5 seconds to capture a frame from the beginning
      videoElement.currentTime = 0.5;
    };
    
    videoElement.onloadeddata = () => {
      try {
        // Create canvas and draw video frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Get data URL and store in thumbnails state
        const thumbnailUrl = canvas.toDataURL('image/jpeg');
        setThumbnails(prev => ({ ...prev, [video.id]: thumbnailUrl }));
        
        // Clean up
        videoElement.remove();
      } catch (error) {
        console.error("Error capturing thumbnail:", error);
      }
    };
    
    videoElement.onerror = () => {
      console.error("Error loading video for thumbnail");
      videoElement.remove();
    };
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Update URL with the hashtag and type query parameters
      const url = new URL(window.location);
      url.searchParams.set('hashtag', searchInput);
      url.searchParams.set('type', postType);
      window.history.pushState({}, '', url);
      
      setHashtag(searchInput);
      fetchTrendingVideos(searchInput, postType);
    }
  };

  const togglePlayVideo = (videoId) => {
    setPlayingVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const handleTypeChange = (type) => {
    setPostType(type);
    
    // Update URL with the new type
    const url = new URL(window.location);
    url.searchParams.set('type', type);
    window.history.pushState({}, '', url);
    
    fetchTrendingVideos(hashtag, type);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 text-[#4361ee] animate-spin" />
        <p className="mt-4 text-[#64748b] dark:text-[#94a3b8] font-medium">Loading {postType === 'top' ? 'trending' : 'latest'} videos for #{hashtag}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search bar section */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#0f172a] py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#64748b]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#334155] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
              placeholder="Search hashtag..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#4361ee] text-white rounded-lg hover:bg-[#2c46cc] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>

      {/* Hashtag info and type toggle section */}
      <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-4 border border-[#e2e8f0] dark:border-[#334155]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#4361ee]" />
            <h2 className="text-lg font-semibold text-[#334155] dark:text-white">
              #{hashtag}
            </h2>
          </div>
          
          {/* Post type toggle */}
          <div className="flex items-center bg-white dark:bg-[#0f172a] rounded-lg p-1 border border-[#e2e8f0] dark:border-[#334155]">
            <button
              onClick={() => handleTypeChange('top')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                postType === 'top'
                  ? 'bg-[#4361ee] text-white'
                  : 'text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
              }`}
            >
              <TrendingUp size={16} />
              Trending
            </button>
            <button
              onClick={() => handleTypeChange('recent')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                postType === 'recent'
                  ? 'bg-[#4361ee] text-white'
                  : 'text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
              }`}
            >
              <Clock size={16} />
              Latest
            </button>
          </div>
        </div>
      </div>

      {/* Videos section */}
      {trending.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
          <p className="text-[#64748b] dark:text-[#94a3b8]">No {postType === 'top' ? 'trending' : 'latest'} videos found for #{hashtag}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending.map((video, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#334155] overflow-hidden transition-all hover:shadow-md flex flex-col"
            >
              {/* Video display - Using ReactPlayer */}
              <div className="relative bg-black w-full pt-4 pb-4">
                <div className="mx-auto w-4/6 aspect-[9/16]"> {/* 9:16 aspect ratio for vertical videos */}
                  {playingVideos[video.id] ? (
                    <ReactPlayer
                      url={video.video_url || video.media_url || video.permalink}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={true}
                      config={{
                        file: {
                          attributes: {
                            controlsList: 'nodownload',
                            disablePictureInPicture: true,
                          }
                        }
                      }}
                      onError={(e) => {
                        console.error("Video playback error:", e);
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gray-900 cursor-pointer group relative overflow-hidden"
                      onClick={() => togglePlayVideo(video.id)}
                    >
                      {/* Thumbnail or placeholder */}
                      {thumbnails[video.id] ? (
                        <div className="absolute inset-0">
                          <img 
                            src={thumbnails[video.id]} 
                            alt="Video thumbnail" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900"></div>
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white bg-opacity-25 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                          <Play size={32} className="text-white ml-1" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <p className="text-white text-sm font-medium drop-shadow-md">Click to play</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#4361ee]" />
                    <h3 className="font-semibold text-[#334155] dark:text-white">
                      {video.platform}
                    </h3>
                  </div>
                  <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                    {new Date(video.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {/* Description - with character limit */}
                <div className="mb-4 flex-grow">
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                    {video.description 
                      ? (video.description.length > 120 
                          ? `${video.description.substring(0, 120)}...` 
                          : video.description)
                      : "No description available"}
                  </p>
                </div>
                
                {/* Additional info and actions */}
                <div className="flex flex-col space-y-3 mt-auto">
                  <div className="flex justify-between text-xs text-[#64748b] dark:text-[#94a3b8]">
                    <span><span className="font-medium">ID:</span> {video.id.substring(0, 10)}...</span>
                    <span><span className="font-medium">Type:</span> {video.media_type}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <a 
                      href={video.permalink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-[#f1f5f9] dark:bg-[#334155] text-[#334155] dark:text-white hover:bg-[#e2e8f0] dark:hover:bg-[#475569] transition-colors"
                    >
                      View Original
                      <ExternalLink size={14} />
                    </a>
                    
                    <a 
                      href={video.video_url || video.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-[#4361ee] text-white hover:bg-[#2c46cc] transition-colors"
                    >
                      Download
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Trending;