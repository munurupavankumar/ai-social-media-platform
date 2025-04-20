# AI Social Media Platform

A comprehensive platform for analyzing social media trends, downloading media, and generating content metadata using AI.

## Project Structure

The project consists of three main components:

### 1. Client (Frontend)
- React-based web application built with Vite
- Visualizes data with Chart.js
- Allows users to search trending content, view analytics, and process media

### 2. Server (Backend)
- Node.js/Express backend API
- Handles user authentication and main business logic
- Communicates with external social media APIs
- Provides data endpoints for the frontend

### 3. Flask Service
- Python/Flask microservice for specialized tasks
- Handles social media data scraping (Instagram hashtag data)
- Media downloading functionality
- AI-powered content metadata generation

## Features

- Search and display trending social media content
- Download videos and audio from various platforms
- Generate metadata using AI for content optimization
- Visualize analytics and insights
- Cross-platform media management

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- MongoDB

### Installation & Setup

#### Client
```bash
cd client
npm install
npm run dev
```

#### Server
```bash
cd server
npm install
# Set up .env file with required credentials
node app.js
```

#### Flask Service
```bash
cd flask_service
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
# Set up .env file with API keys
python app.py
```

## Environment Variables

The application requires various API keys and configuration values. Example .env templates:

### Server (.env)
```
# API Credentials
INSTAGRAM_USER_ID=your_instagram_user_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/social_media_platform
# Other Configuration
PORT=3000
```

### Flask Service (.env)
```
INSTAGRAM_USER_ID=your_instagram_user_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
OPENAI_API_KEY=your_openai_api_key
```

## API Endpoints

### Main Server
- `GET /api/auth` - Authentication endpoints
- `GET /api/trends` - Get trending data
- Various other endpoints for business logic

### Flask Service
- `GET /api/trending` - Get trending videos by hashtag
- `POST /api/download` - Download media from URL
- `POST /api/metadata_stream` - Generate metadata using AI

## Technologies Used

- **Frontend**: React, Vite, Chart.js, Axios
- **Backend**: Node.js, Express, MongoDB
- **Microservice**: Flask, OpenAI API
- **Tools**: yt-dlp (for media downloads)

## License

[MIT License](LICENSE) 