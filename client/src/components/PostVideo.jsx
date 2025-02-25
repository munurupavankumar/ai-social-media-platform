// src/components/PostVideo.jsx
import React, { useState } from 'react';
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

  // Function to generate metadata via the streaming endpoint
  const generateMetadata = async () => {
    try {
      setMetadataError('');
      setMetadataGenerated(false);
      
      const contentPrompt = `For the ${platform} platform, generate the following metadata for a social media post:
1. A creative title,
2. A concise description,
3. A list of relevant hashtags (comma-separated).

The post is about: ${contentDescription || 'No description provided.'}

Please output the title on the first line, the description on the second line, and the hashtags on the third line.`;

      const response = await axios.post(
        'http://localhost:5000/api/metadata_stream',
        { content: contentPrompt },
        { responseType: 'text' }
      );

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
    } catch (error) {
      console.error("Error generating metadata:", error);
      setMetadataError(error.message || "Error generating metadata");
    }
  };

  // Handle form submission to post the video
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setResult(null);

    if (!metadataGenerated) {
      setPostError("Please generate metadata before posting.");
      return;
    }

    // Format keywords into an array, removing any '#' symbols and empty strings
    const keywordsArray = autoKeywords
      .split(',')
      .map(keyword => keyword.trim().replace('#', ''))
      .filter(keyword => keyword.length > 0);

    // Prepare the post data
    const postData = {
      videoPath,
      title: autoTitle,
      description: autoDescription,
      keywords: keywordsArray,
      platform
    };

    console.log("Sending post data:", postData);

    try {
      const response = await axios.post('http://localhost:3000/api/post', postData);
      console.log("Post response:", response.data);
      setResult(response.data);
    } catch (error) {
      console.error("Error posting video:", error.response?.data || error.message);
      setPostError(error.response?.data?.error || "Failed to post video");
      setResult({ error: error.response?.data || "Failed to post video" });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Post Video to Social Media</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Video Path Input */}
        <div className="space-y-2">
          <label className="block">Video Path:</label>
          <input 
            type="text"
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            placeholder="Enter video path"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Platform Dropdown */}
        <div className="space-y-2">
          <label className="block">Platform:</label>
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
          <label className="block">Content Description (for metadata generation):</label>
          <textarea 
            value={contentDescription}
            onChange={(e) => setContentDescription(e.target.value)}
            placeholder="Describe the video content here..."
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        {/* Generate Metadata Button */}
        <div>
          <button 
            type="button"
            onClick={generateMetadata}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Generate Metadata for {platform}
          </button>
          {metadataError && (
            <p className="text-red-500 mt-2">{metadataError}</p>
          )}
        </div>

        {/* Auto-generated metadata fields */}
        {metadataGenerated && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block">Auto-Generated Title (editable):</label>
              <input 
                type="text"
                value={autoTitle}
                onChange={(e) => setAutoTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="space-y-2">
              <label className="block">Auto-Generated Description (editable):</label>
              <textarea 
                value={autoDescription}
                onChange={(e) => setAutoDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
              />
            </div>
            <div className="space-y-2">
              <label className="block">Auto-Generated Hashtags/Keywords (comma separated, editable):</label>
              <input 
                type="text"
                value={autoKeywords}
                onChange={(e) => setAutoKeywords(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        <button 
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Post Video
        </button>
      </form>

      {postError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {postError}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PostVideo;