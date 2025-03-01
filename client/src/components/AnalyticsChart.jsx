// src/components/AnalyticsChart.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { LineChart, Loader, BarChart } from 'lucide-react';
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
              backgroundColor: '#4361ee',
              borderColor: '#2c46cc',
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: '#5e7aff',
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            weight: 'medium',
          },
          color: '#64748b',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(249, 250, 251, 0.95)',
        titleColor: '#334155',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          labelTextColor: () => '#334155'
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        }
      },
      y: {
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 10,
        },
        border: {
          dash: [5, 5],
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 text-[#4361ee] animate-spin" />
        <p className="mt-4 text-[#64748b] dark:text-[#94a3b8] font-medium">Loading analytics chart...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart className="text-[#4361ee]" size={22} />
        <h2 className="text-lg font-semibold text-[#334155] dark:text-white">
          Engagement Overview
        </h2>
      </div>
      
      {chartData ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-sm p-4 h-80">
          <Bar
            data={chartData}
            options={chartOptions}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-6 text-center">
          <p className="text-[#64748b] dark:text-[#94a3b8]">No analytics data available</p>
        </div>
      )}
      
      <div className="flex gap-3 flex-wrap">
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-sm p-4 flex-1 min-w-40">
          <p className="text-[#64748b] dark:text-[#94a3b8] text-sm mb-1">Total Posts</p>
          <p className="text-2xl font-bold text-[#334155] dark:text-white">
            {chartData?.labels.length || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-sm p-4 flex-1 min-w-40">
          <p className="text-[#64748b] dark:text-[#94a3b8] text-sm mb-1">Total Likes</p>
          <p className="text-2xl font-bold text-[#334155] dark:text-white">
            {chartData?.datasets[0].data.reduce((sum, current) => sum + current, 0) || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-sm p-4 flex-1 min-w-40">
          <p className="text-[#64748b] dark:text-[#94a3b8] text-sm mb-1">Avg. Likes</p>
          <p className="text-2xl font-bold text-[#334155] dark:text-white">
            {chartData?.datasets[0].data.length ? 
              Math.round(chartData.datasets[0].data.reduce((sum, current) => sum + current, 0) / chartData.datasets[0].data.length) : 
              0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;