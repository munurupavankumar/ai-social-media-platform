// src/App.jsx
import React, { useState } from 'react';
import Trending from './components/Trending';
import PostVideo from './components/PostVideo';
import Analytics from './components/Analytics';
import SchedulePost from './components/SchedulePost';
import AnalyticsChart from './components/AnalyticsChart';
import ExportAnalytics from './components/ExportAnalytics';
import PostDetails from './components/PostDetails';
import Download from './components/Download'; // Import the new Download component

// Import icons from popular libraries
import { 
  TrendingUp, 
  Video, 
  BarChart2, 
  Calendar, 
  LineChart, 
  Download as DownloadIcon, 
  FileText, 
  Menu, 
  X, 
  Activity,
  ArrowDown // Added for the Download section
} from 'lucide-react';

function App() {
  const [view, setView] = useState('trending');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modern color palette with cool tones
  const colors = {
    // Primary colors
    primary: {
      main: '#4361ee',     // Vibrant blue - primary brand color
      light: '#5e7aff',    // Lighter variation
      dark: '#2c46cc',     // Darker variation
      contrast: '#ffffff'  // Text color on primary
    },
    // Secondary colors
    secondary: {
      main: '#3a0ca3',     // Deep purple - accent color
      light: '#4b24b5',    // Lighter variation
      dark: '#2c0682',     // Darker variation
      contrast: '#ffffff'  // Text color on secondary
    },
    // Accent
    accent: {
      main: '#4cc9f0',     // Bright sky blue - highlights
      light: '#72d6f5',    // Lighter variation
      dark: '#25b6e6',     // Darker variation
    },
    // Neutral colors
    neutral: {
      100: '#ffffff',      // White
      200: '#f8f9fa',      // Off-white
      300: '#e9ecef',      // Light gray
      400: '#dee2e6',      // Light gray
      500: '#adb5bd',      // Medium gray
      600: '#6c757d',      // Dark gray
      700: '#495057',      // Darker gray
      800: '#343a40',      // Near black
      900: '#212529',      // Almost black
    },
    // Semantic colors
    success: '#10b981',    // Green
    warning: '#f59e0b',    // Amber
    error: '#ef4444',      // Red
    info: '#3b82f6'        // Blue
  };

  // Modern navigation items with proper icons (added download option)
  const navItems = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp size={18} /> },
    { id: 'post', label: 'Post Video', icon: <Video size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'schedule', label: 'Schedule Post', icon: <Calendar size={18} /> },
    { id: 'download', label: 'Download Media', icon: <ArrowDown size={18} /> }, // New download nav item
    { id: 'chart', label: 'Analytics Chart', icon: <LineChart size={18} /> },
    { id: 'export', label: 'Export CSV', icon: <DownloadIcon size={18} /> },
    { id: 'details', label: 'Post Details', icon: <FileText size={18} /> },
  ];

  const renderView = () => {
    switch (view) {
      case 'trending':
        return <Trending />;
      case 'post':
        return <PostVideo />;
      case 'analytics':
        return <Analytics />;
      case 'schedule':
        return <SchedulePost />;
      case 'download': // Added case for the Download component
        return <Download />;
      case 'chart':
        return <AnalyticsChart />;
      case 'export':
        return <ExportAnalytics />;
      case 'details':
        return <PostDetails />;
      default:
        return <Trending />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/90 dark:bg-[#1e293b]/90 border-b border-[#e2e8f0] dark:border-[#334155]">
        <div className="container mx-auto px-4 py-3">
          {/* Modern header with simplified layout */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#334155] dark:text-white flex items-center gap-2">
              <Activity className="text-[#4361ee]" size={24} />
              <span className="font-bold">AI Social</span>
            </h1>

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Modern navigation with pill-style tabs */}
          <nav className={`${mobileMenuOpen ? 'flex' : 'hidden md:flex'} mt-4 gap-2 flex-wrap`}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  view === item.id
                    ? 'bg-[#4361ee] text-white shadow-md'
                    : 'hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#64748b] dark:text-[#94a3b8]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Modern content area */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-[#334155] dark:text-white flex items-center gap-2">
                {navItems.find(item => item.id === view)?.icon}
                {navItems.find(item => item.id === view)?.label}
              </h2>
            </div>
            
            <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-6">
              {renderView()}
            </div>
          </div>
        </div>
        
        {/* Modern mobile navigation */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white dark:bg-[#1e293b] rounded-full shadow-lg border border-[#e2e8f0] dark:border-[#334155] p-2 flex justify-around">
          {navItems.slice(0, 5).map((item) => ( // Updated to show first 5 nav items including download
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`p-3 rounded-full ${
                view === item.id 
                  ? 'bg-[#4361ee] text-white' 
                  : 'text-[#64748b] dark:text-[#94a3b8]'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;