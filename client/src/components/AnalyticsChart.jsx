// src/components/AnalyticsChart.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/analytics')
      .then(response => {
        const analytics = response.data.analytics;
        // Prepare data for the chart.
        const labels = analytics.map(item => item.title.slice(0, 15) + '...');
        const likesData = analytics.map(item => {
          // For Twitter posts, use tweet metrics if available, otherwise simulated likes.
          if (item.analytics.like_count !== undefined) {
            return item.analytics.like_count;
          }
          return item.analytics.likes;
        });

        setChartData({
          labels,
          datasets: [
            {
              label: 'Likes per Post',
              data: likesData,
              backgroundColor: 'rgba(75,192,192,0.6)',
            },
          ],
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching analytics for chart:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <div>
      <h2>Engagement Overview</h2>
      {chartData && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: 'Likes per Post',
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsChart;
