// src/App.jsx
import React, { useState } from 'react';
import Trending from './components/Trending';
import SpinOff from './components/SpinOff';
import PostVideo from './components/PostVideo';
import Analytics from './components/Analytics';
import SchedulePost from './components/SchedulePost';
import AnalyticsChart from './components/AnalyticsChart';
import ExportAnalytics from './components/ExportAnalytics';
//import './App.css';

function App() {
  const [view, setView] = useState('trending');

  const renderView = () => {
    switch (view) {
      case 'trending':
        return <Trending />;
      case 'spinoff':
        return <SpinOff />;
      case 'post':
        return <PostVideo />;
      case 'analytics':
        return <Analytics />;
      case 'schedule':
        return <SchedulePost />;
      case 'chart':
        return <AnalyticsChart />;
      case 'export':
        return <ExportAnalytics />;
      default:
        return <Trending />;
    }
  };

  return (
    <div className="App">
      <header>
        <h1>AI Social Media Marketing Platform</h1>
        <nav>
          <button onClick={() => setView('trending')}>Trending</button>
          <button onClick={() => setView('spinoff')}>Create Spin-Off</button>
          <button onClick={() => setView('post')}>Post Video</button>
          <button onClick={() => setView('analytics')}>Analytics</button>
          <button onClick={() => setView('schedule')}>Schedule Post</button>
          <button onClick={() => setView('chart')}>Analytics Chart</button>
          <button onClick={() => setView('export')}>Export CSV</button>
        </nav>
      </header>
      <main>{renderView()}</main>
    </div>
  );
}

export default App;
