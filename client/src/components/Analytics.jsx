// src/components/Analytics.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Analytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/analytics')
      .then(response => {
        setAnalytics(response.data.analytics);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching analytics", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading analytics data...</div>;
  }

  return (
    <div>
      <h2>Analytics & Suggestions</h2>
      {analytics.map((item, index) => (
        <div key={index} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <h3>{item.title} ({item.platform})</h3>
          <p><strong>Video Path:</strong> {item.videoPath}</p>
          <p><strong>Date Posted:</strong> {new Date(item.datePosted).toLocaleString()}</p>
          <div>
            <h4>Analytics:</h4>
            <p>Views: {item.analytics.views}</p>
            <p>Likes: {item.analytics.likes}</p>
            <p>Shares: {item.analytics.shares}</p>
            <p><strong>Suggestion:</strong> {item.analytics.suggestion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Analytics;
