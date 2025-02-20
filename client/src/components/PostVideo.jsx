// src/components/PostVideo.jsx
import React, { useState } from 'react';
import axios from 'axios';

function PostVideo() {
  const [videoPath, setVideoPath] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [platform, setPlatform] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const keywordsArray = keywords.split(',').map(keyword => keyword.trim());
    axios.post('http://localhost:3000/api/post', {
      videoPath,
      title,
      description,
      keywords: keywordsArray,
      platform
    })
      .then(response => {
        setResult(response.data);
      })
      .catch(error => {
        console.error("Error posting video", error);
        setResult({ error: "Failed to post video" });
      });
  };

  return (
    <div>
      <h2>Post Video to Social Media</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Video Path:</label>
          <input 
            type="text" 
            value={videoPath} 
            onChange={(e) => setVideoPath(e.target.value)} 
            placeholder="Enter spin-off video path" 
          />
        </div>
        <div>
          <label>Title:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter title" 
          />
        </div>
        <div>
          <label>Description:</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Enter description" 
          />
        </div>
        <div>
          <label>Keywords (comma separated):</label>
          <input 
            type="text" 
            value={keywords} 
            onChange={(e) => setKeywords(e.target.value)} 
            placeholder="Enter keywords" 
          />
        </div>
        <div>
          <label>Platform:</label>
          <input 
            type="text" 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)} 
            placeholder="Enter platform (e.g., Instagram)" 
          />
        </div>
        <button type="submit">Post Video</button>
      </form>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PostVideo;
