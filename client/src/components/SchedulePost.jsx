// src/components/SchedulePost.jsx
import React, { useState } from 'react';
import axios from 'axios';

function SchedulePost() {
  const [videoPath, setVideoPath] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [platform, setPlatform] = useState('');
  const [delay, setDelay] = useState(0);
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
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
      })
      .catch(error => {
        console.error("Error scheduling post", error);
        setResult({ error: "Failed to schedule post" });
      });
  };

  return (
    <div>
      <h2>Schedule Post to Social Media</h2>
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
        <div>
          <label>Delay (in seconds):</label>
          <input 
            type="number" 
            value={delay} 
            onChange={(e) => setDelay(e.target.value)} 
            placeholder="Enter delay in seconds" 
          />
        </div>
        <button type="submit">Schedule Post</button>
      </form>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SchedulePost;
