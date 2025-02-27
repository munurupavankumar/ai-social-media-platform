// src/components/PostVideo.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Post Video to Social Media</h2>
      
      {platformGuidelines && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">
          <strong>Platform Tip:</strong> {platformGuidelines}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Video Path Input */}
        <div className="space-y-2">
          <label className="block font-medium">Video Path:</label>
          <input 
            type="text"
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            placeholder="Enter video path (e.g., spinoff_video.mp4)"
            className={`w-full p-2 border rounded ${!isValidFileForPlatform() ? 'border-red-500' : ''}`}
          />
          {!isValidFileForPlatform() && (
            <p className="text-red-500 text-sm">
              Instagram requires MP4 or MOV format. Please check your file.
            </p>
          )}
          <p className="text-gray-500 text-xs">
            Relative to the downloads folder (just the filename is usually sufficient)
          </p>
        </div>

        {/* Platform Dropdown */}
        <div className="space-y-2">
          <label className="block font-medium">Platform:</label>
          <select 
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="Twitter">Twitter</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="Pinterest">Pinterest</option>
            <option value="Facebook">Facebook</option>
          </select>
        </div>

        {/* Content Description */}
        <div className="space-y-2">
          <label className="block font-medium">Content Description (for metadata generation):</label>
          <textarea 
            value={contentDescription}
            onChange={(e) => setContentDescription(e.target.value)}
            placeholder="Describe the video content here for AI to generate appropriate metadata..."
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        {/* Generate Metadata Button */}
        <div>
          <button 
            type="button"
            onClick={generateMetadata}
            disabled={!contentDescription || uploadProgress > 0}
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${!contentDescription ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploadProgress > 0 && uploadProgress < 100 ? 'Generating...' : `Generate Metadata for ${platform}`}
          </button>
          
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          {metadataError && (
            <p className="text-red-500 mt-2">{metadataError}</p>
          )}
        </div>

        {/* Auto-generated metadata fields */}
        {metadataGenerated && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-bold">AI-Generated Content for {platform}</h3>
            
            <div className="space-y-2">
              <label className="block font-medium">Title (editable):</label>
              <input 
                type="text"
                value={autoTitle}
                onChange={(e) => setAutoTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-medium">Description (editable):</label>
              <textarea 
                value={autoDescription}
                onChange={(e) => setAutoDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-medium">Hashtags/Keywords (comma separated, editable):</label>
              <input 
                type="text"
                value={autoKeywords}
                onChange={(e) => setAutoKeywords(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {autoKeywords.split(',').map((tag, index) => (
                  tag.trim() && (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      #{tag.trim().replace(/^#/, '')}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={isPosting || !metadataGenerated || !videoPath}
          className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${(isPosting || !metadataGenerated || !videoPath) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPosting ? `Posting to ${platform}...` : `Post to ${platform}`}
        </button>
      </form>

      {postError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded border border-red-200">
          <strong>Error:</strong> {postError}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded border">
          <h3 className="font-bold mb-2">Response from server:</h3>
          <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
          
          {result.message && result.message.includes("successfully") && (
            <div className="mt-3 p-3 bg-green-100 text-green-700 rounded">
              <strong>Success!</strong> Your content has been posted to {platform}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostVideo;