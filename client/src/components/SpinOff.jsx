// src/components/SpinOff.jsx
import React, { useState } from 'react';
import axios from 'axios';

function SpinOff() {
  const [videoPath, setVideoPath] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/spinoff', {
      video_path: videoPath,
      template: { overlay_text: overlayText }
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
            placeholder="Enter video path (e.g., downloads/sample_video.mp4)" 
          />
        </div>
        <div>
          <label>Overlay Text:</label>
          <input 
            type="text" 
            value={overlayText} 
            onChange={(e) => setOverlayText(e.target.value)} 
            placeholder="Enter overlay text" 
          />
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
