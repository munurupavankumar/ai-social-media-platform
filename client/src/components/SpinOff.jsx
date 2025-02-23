// src/components/SpinOff.jsx
import React, { useState } from 'react';
import axios from 'axios';

function SpinOff() {
  const [videoPath, setVideoPath] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send only video_path and platform to the endpoint
    axios.post('http://localhost:5000/api/spinoff', {
      video_path: videoPath,
      platform: platform
    })
    .then(response => {
      setResult(response.data);
    })
    .catch(error => {
      console.error("Error creating spin-off video", error);
      setResult({ error: "Failed to create spin-off video" });
    });
  };

  return (
    <div>
      <h2>Create Spin-Off Video</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Video Path:</label>
          <input 
            type="text" 
            value={videoPath} 
            onChange={(e) => setVideoPath(e.target.value)} 
            placeholder="Enter video path (e.g., downloads/video.mp4)" 
          />
        </div>
        <div>
          <label>Platform:</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="twitter">Twitter</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="pinterest">Pinterest</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <button type="submit">Create Spin-Off</button>
      </form>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SpinOff;
