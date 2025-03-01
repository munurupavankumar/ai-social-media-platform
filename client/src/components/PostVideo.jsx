// src/components/PostVideo.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VideoIcon, Sparkles, Tag, Send, Info, AlertTriangle } from 'lucide-react';

function PostVideo() {
  // State for input values
  const [videoPath, setVideoPath] = useState('');
  const [platform, setPlatform] = useState('Twitter'); // default platform
  const [contentDescription, setContentDescription] = useState('');
  
  // State for auto-generated metadata
  const [autoTitle, setAutoTitle] = useState('');
  const [autoDescription, setAutoDescription] = useState('');
  const [autoKeywords, setAutoKeywords] = useState('');
  const [metadataGenerated, setMetadataGenerated] = useState(false);
  const [metadataError, setMetadataError] = useState('');

  // State for result and submission errors
  const [result, setResult] = useState(null);
  const [postError, setPostError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Platform-specific guidance
  const [platformGuidelines, setPlatformGuidelines] = useState('');

  // Update platform guidelines when platform changes
  useEffect(() => {
    switch(platform) {
      case 'Instagram':
        setPlatformGuidelines('Instagram Reels requires MP4 or MOV format under 100MB. Make sure your ngrok URL is active for external access.');
        break;
      case 'Twitter':
        setPlatformGuidelines('Twitter videos should be under 140 seconds for best engagement.');
        break;
      case 'Threads':
        setPlatformGuidelines('Threads works best with short, vertical videos optimized for mobile viewing.');
        break;
      case 'Pinterest':
        setPlatformGuidelines('Pinterest performs best with instructional or inspirational content.');
        break;
      case 'Facebook':
        setPlatformGuidelines('Facebook supports longer content, ideal for storytelling videos.');
        break;
      default:
        setPlatformGuidelines('');
    }
  }, [platform]);

  // Function to generate metadata via the streaming endpoint
  const generateMetadata = async () => {
    try {
      setMetadataError('');
      setMetadataGenerated(false);
      setUploadProgress(0);
      
      // Customize prompt based on platform
      let promptPrefix = '';
      let promptGuidelines = '';
      
      if (platform === 'Instagram') {
        promptPrefix = `For Instagram Reels, generate engaging and trending-focused`;
        promptGuidelines = `Include trendy hashtags that will help with discoverability. Keep the description concise but engaging.`;
      } else if (platform === 'Twitter') {
        promptPrefix = `For Twitter, generate short and impactful`;
        promptGuidelines = `Ensure the title and description combined are under 280 characters. Include trending hashtags.`;
      } else {
        promptPrefix = `For ${platform}, generate`;
        promptGuidelines = `Optimize for engagement on ${platform}.`;
      }
      
      const contentPrompt = `${promptPrefix} metadata for a social media post:
1. A creative, attention-grabbing title,
2. A concise, engaging description,
3. A list of relevant hashtags (comma-separated).

${promptGuidelines}

The post is about: ${contentDescription || 'No description provided.'}

Please output the title on the first line, the description on the second line, and the hashtags on the third line.`;

      setUploadProgress(10);
      
      const response = await axios.post(
        'http://localhost:5000/api/metadata_stream',
        { content: contentPrompt },
        { responseType: 'text' }
      );

      setUploadProgress(50);
      
      const generatedText = response.data;
      console.log("Generated metadata text:", generatedText);

      if (!generatedText || generatedText.trim() === "") {
        throw new Error("No metadata generated. Please check your input or try again.");
      }
      
      const parts = generatedText.split('\n').map(str => str.trim()).filter(str => str.length > 0);
      if (parts.length < 3) {
        throw new Error("Incomplete metadata generated. Expected title, description, and hashtags.");
      }
      
      setAutoTitle(parts[0]);
      setAutoDescription(parts[1]);
      setAutoKeywords(parts[2]);
      setMetadataGenerated(true);
      setUploadProgress(100);
      
      // After a delay, reset progress bar
      setTimeout(() => setUploadProgress(0), 1500);
    } catch (error) {
      console.error("Error generating metadata:", error);
      setMetadataError(error.message || "Error generating metadata");
      setUploadProgress(0);
    }
  };

  // Handle form submission to post the video
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setResult(null);
    setIsPosting(true);
    setUploadProgress(0);

    if (!metadataGenerated) {
      setPostError("Please generate metadata before posting.");
      setIsPosting(false);
      return;
    }

    if (!videoPath) {
      setPostError("Please enter a video path.");
      setIsPosting(false);
      return;
    }

    // Format keywords into an array, removing any '#' symbols and empty strings
    const keywordsArray = autoKeywords
      .split(',')
      .map(keyword => keyword.trim().replace(/^#/, ''))
      .filter(keyword => keyword.length > 0);

    // Prepare the post data
    const postData = {
      videoPath: videoPath.startsWith('downloads/') ? videoPath : `downloads/${videoPath}`,
      title: autoTitle,
      description: autoDescription,
      keywords: keywordsArray,
      platform: platform
    };

    console.log(`Sending ${platform} post data:`, postData);
    setUploadProgress(25);

    console.log('Sending post data:', {
      url: 'http://localhost:3000/api/post',
      data: postData,
    });

    try {
      const response = await axios.post('http://localhost:3000/api/post', postData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`${platform} post response:`, response.data);
      setResult(response.data);
      setUploadProgress(100);
      
      // After successful post, clear form or keep as needed
      if (response.data.message && response.data.message.includes("successfully")) {
        // Optional: Reset form after successful post
        // setVideoPath('');
        // setContentDescription('');
        // setMetadataGenerated(false);
      }
    } catch (error) {
      console.error('Post request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.details || 
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown error occurred';
                          
      setPostError(`${platform} posting failed: ${errorMessage}`);
      setResult(error.response?.data || { error: errorMessage });
    } finally {
      setIsPosting(false);
    }
  };

  const fileExtensionFromPath = (path) => {
    if (!path) return '';
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const isValidFileForPlatform = () => {
    if (!videoPath) return true; // Don't show error when empty
    
    const ext = fileExtensionFromPath(videoPath);
    
    if (platform === 'Instagram') {
      return ['mp4', 'mov'].includes(ext);
    }
    
    return true; // Default to true for other platforms
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
          <VideoIcon className="text-[#4361ee]" size={20} />
          <h2 className="text-xl font-semibold text-[#334155] dark:text-white">Post Video to Social Media</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor()}`}>
          {platform}
        </div>
      </div>
      
      {platformGuidelines && (
        <div className="p-3 bg-[#f1f5f9] dark:bg-[#334155] rounded-lg border border-[#e2e8f0] dark:border-[#475569] flex items-start gap-2">
          <Info size={18} className="text-[#4361ee] mt-0.5 shrink-0" />
          <span className="text-sm text-[#334155] dark:text-[#e2e8f0]">{platformGuidelines}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Video Path Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Video Path</label>
            <div className={`relative rounded-lg border ${!isValidFileForPlatform() ? 'border-[#ef4444]' : 'border-[#cbd5e1] dark:border-[#475569]'} focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all`}>
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
            {!isValidFileForPlatform() && (
              <p className="text-[#ef4444] text-xs flex items-center gap-1">
                <AlertTriangle size={12} />
                Instagram requires MP4 or MOV format. Please check your file.
              </p>
            )}
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

        {/* Content Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Content Description</label>
          <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
            <textarea 
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              placeholder="Describe the video content here for AI to generate appropriate metadata..."
              className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none resize-none"
              rows="4"
            />
          </div>
          <p className="text-[#64748b] dark:text-[#94a3b8] text-xs">
            Provide detailed context to help the AI generate better metadata
          </p>
        </div>

        {/* Generate Metadata Button */}
        <div className="flex flex-col space-y-2">
          <button 
            type="button"
            onClick={generateMetadata}
            disabled={!contentDescription || uploadProgress > 0}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!contentDescription || uploadProgress > 0 ? 'bg-[#94a3b8] dark:bg-[#475569] text-[#f1f5f9] cursor-not-allowed' : 'bg-[#4361ee] hover:bg-[#2c46cc] text-white shadow-sm'}`}
          >
            <Sparkles size={16} className="mr-2" />
            {uploadProgress > 0 && uploadProgress < 100 ? 'Generating...' : `Generate Metadata for ${platform}`}
          </button>
          
          {uploadProgress > 0 && (
            <div className="w-full h-1.5 bg-[#e2e8f0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4361ee] rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          {metadataError && (
            <p className="text-[#ef4444] text-sm flex items-center gap-1 mt-1">
              <AlertTriangle size={14} />
              {metadataError}
            </p>
          )}
        </div>

        {/* Auto-generated metadata fields */}
        {metadataGenerated && (
          <div className="p-5 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#0f172a] dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#4361ee]" />
                AI-Generated Content for {platform}
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[#dbeafe] dark:bg-[#1e3a8a] text-[#2563eb] dark:text-[#93c5fd]">
                Editable
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Title</label>
                <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
                  <input 
                    type="text"
                    value={autoTitle}
                    onChange={(e) => setAutoTitle(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Description</label>
                <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
                  <textarea 
                    value={autoDescription}
                    onChange={(e) => setAutoDescription(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white focus:outline-none resize-none"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-1">
                  <Tag size={14} />
                  Hashtags/Keywords
                </label>
                <div className="relative rounded-lg border border-[#cbd5e1] dark:border-[#475569] focus-within:border-[#4361ee] focus-within:ring-1 focus-within:ring-[#4361ee] overflow-hidden transition-all">
                  <input 
                    type="text"
                    value={autoKeywords}
                    onChange={(e) => setAutoKeywords(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-transparent text-[#0f172a] dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {autoKeywords.split(',').map((tag, index) => (
                    tag.trim() && (
                      <span key={index} className="bg-[#e0f2fe] dark:bg-[#0c4a6e] text-[#0284c7] dark:text-[#7dd3fc] text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>#</span>{tag.trim().replace(/^#/, '')}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit"
            disabled={isPosting || !metadataGenerated || !videoPath}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${(isPosting || !metadataGenerated || !videoPath) ? 'bg-[#94a3b8] dark:bg-[#475569] text-[#f1f5f9] cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-sm'}`}
          >
            <Send size={16} className="mr-2" />
            {isPosting ? `Posting to ${platform}...` : `Post to ${platform}`}
          </button>
        </div>
      </form>

      {postError && (
        <div className="p-4 bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fecaca] dark:border-[#ef4444]/20 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-[#ef4444] mt-0.5 shrink-0" />
          <div>
            <p className="text-[#b91c1c] dark:text-[#fca5a5] font-medium">Error</p>
            <p className="text-[#ef4444]/80 dark:text-[#fca5a5]/80 text-sm">{postError}</p>
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
          
          {result.message && result.message.includes("successfully") && (
            <div className="p-3 bg-[#f0fdf4] dark:bg-[#14532d]/20 border border-[#bbf7d0] dark:border-[#10b981]/20 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-[#10b981]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[#047857] dark:text-[#4ade80] text-sm">Your content has been successfully posted to {platform}!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostVideo;