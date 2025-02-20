// src/App.jsx
import React, { useState } from 'react';
import Trending from './components/Trending';
import SpinOff from './components/SpinOff';
import PostVideo from './components/PostVideo';
import Analytics from './components/Analytics';
import SchedulePost from './components/SchedulePost';
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
        </nav>
      </header>
      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
