// src/components/Trending.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/trending')
      .then(response => {
        setTrending(response.data.trending);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching trending data", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading trending videos...</div>;
  }

  return (
    <div>
      <h2>Trending Videos</h2>
      {trending.map((video, index) => (
        <div key={index} style={{ marginBottom: '20px' }}>
          <h3>{video.platform}</h3>
          <p>{video.description}</p>
          <a href={video.video_url} target="_blank" rel="noopener noreferrer">Watch Video</a>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default Trending;
