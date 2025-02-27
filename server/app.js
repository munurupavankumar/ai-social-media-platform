// app.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
console.log('TWITTER_APP_KEY:', process.env.TWITTER_APP_KEY ? 'set' : 'not set');

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve video files statically for Instagram
app.use('/videos', express.static(path.join(__dirname, '..', 'flask_service', 'downloads')));

// Define a Post schema and model for tracking posts
const postSchema = new mongoose.Schema({
  videoPath: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  keywords: [String],
  platform: { type: String, required: true },
  datePosted: { type: Date, default: Date.now },
  tweetId: { type: String }, // For Twitter posts
  instagramPostId: { type: String } // For Instagram posts
});

const Post = mongoose.model('Post', postSchema);

// Initialize Twitter client if credentials are provided
let twitterClient;

if (
  process.env.TWITTER_APP_KEY &&
  process.env.TWITTER_APP_SECRET &&
  process.env.TWITTER_ACCESS_TOKEN &&
  process.env.TWITTER_ACCESS_SECRET
) {
  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  console.log("Twitter client initialized.");
} else {
  console.log("Twitter API credentials not set. Twitter integration disabled.");
}

// A simple test route
app.get('/', (req, res) => {
  res.send('Hello from the Express server!');
});

/**
 * POST /api/post
 * Post content to a social media platform (Twitter or Instagram), or simulate posting.
 * Expected JSON payload:
 * {
 *   "videoPath": "path/to/spinoff_video.mp4",
 *   "title": "My Awesome Post",
 *   "description": "This is a description of my post",
 *   "keywords": ["keyword1", "keyword2"],
 *   "platform": "Instagram" // or "Twitter", etc.
 * }
 */
app.post('/api/post', async (req, res) => {
  const { videoPath, title, description, keywords, platform } = req.body;

  // Validate required fields
  if (!videoPath || !title || !platform) {
    return res.status(400).json({ error: "videoPath, title, and platform are required" });
  }

  // Twitter posting (unchanged)
  if (platform.toLowerCase() === 'twitter' && twitterClient) {
    try {
      const tweetText = `${title}\n\n${description}\n\nKeywords: ${keywords.join(', ')}`;
      console.log("Tweet text being sent:", tweetText);

      let mediaIds = [];
      const fullPath = path.join(__dirname, '..', 'flask_service', 'downloads', path.basename(videoPath));
      if (fs.existsSync(fullPath)) {
        console.log("Video file found. Uploading media...");
        const mediaId = await twitterClient.v1.uploadMedia(fullPath);
        mediaIds.push(mediaId);
        console.log("Media uploaded. Media ID:", mediaId);
      } else {
        console.log("Video file not found. Proceeding without media.");
      }

      const tweetPayload = {
        text: tweetText,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
      };

      const tweetResponse = await twitterClient.v2.tweet(tweetPayload);
      return res.json({ message: "Tweet posted successfully", tweet: tweetResponse });
    } catch (error) {
      console.error("Error posting tweet:", error);
      return res.status(500).json({ error: "Twitter post failed", details: error.toString() });
    }
  } 

// Instagram posting with ngrok URL
else if (platform.toLowerCase() === 'instagram' && process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
  try {
    // Construct the public video URL using ngrok URL
    const videoFileName = path.basename(videoPath);
    
    // Use ngrok URL for local development
    const ngrokUrl = process.env.NGROK_URL || `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${ngrokUrl}/videos/${videoFileName}`;
    
    console.log(`Instagram post attempt with video URL: ${videoUrl}`);
    
    // Verify the file exists
    const fullPath = path.join(__dirname, '..', 'flask_service', 'downloads', videoFileName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Video file not found at path", path: fullPath });
    }
    
    // Check file size and extension
    const stats = fs.statSync(fullPath);
    const fileSize = stats.size / (1024 * 1024); // Convert to MB
    const fileExt = path.extname(fullPath).toLowerCase();
    
    console.log(`File size: ${fileSize.toFixed(2)}MB, Extension: ${fileExt}`);
    
    // Validate file format and size
    const validExtensions = ['.mp4', '.mov'];
    if (!validExtensions.includes(fileExt)) {
      return res.status(400).json({ 
        error: "Invalid file format", 
        details: `Instagram Reels requires MP4 or MOV format. Found: ${fileExt}` 
      });
    }
    
    if (fileSize > 100) { // Instagram has limits around 100MB for videos
      return res.status(400).json({ 
        error: "File too large", 
        details: `Instagram Reels has a file size limit. Your file is ${fileSize.toFixed(2)}MB` 
      });
    }
    
    // Instagram Graph API endpoints and credentials
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const mediaEndpoint = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const publishEndpoint = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;
    
    // Step 1: Create a media container for the reel
    console.log("Creating Instagram media container...");
    let mediaResponse;
    try {
      mediaResponse = await axios.post(mediaEndpoint, {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: `${title}\n\n${description || ""}${keywords && keywords.length ? '\n\n#' + keywords.join(' #') : ''}`,
        access_token: accessToken
      });
    } catch (containerError) {
      console.error("Error creating media container:", containerError.response?.data || containerError.message);
      return res.status(500).json({
        error: "Failed to create Instagram media container",
        details: containerError.response?.data?.error?.message || containerError.message,
        rawError: containerError.response?.data || null
      });
    }
    
    const containerId = mediaResponse.data.id;
    console.log(`Media container created with ID: ${containerId}`);
    
    // Step 2: Check the media container status with exponential backoff
    const statusEndpoint = `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
    let status = '';
    let statusDetail = '';
    const maxAttempts = 30; // Increased from 20 to 30 for more patience
    let attempt = 0;
    let waitTime = 5000; // Start with 5 seconds
    
    console.log("Checking media processing status...");
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        const statusResponse = await axios.get(statusEndpoint);
        status = statusResponse.data.status_code;
        statusDetail = statusResponse.data.status || 'No detailed status available';
        
        console.log(`Attempt ${attempt}/${maxAttempts}: Media status: ${status}. Detail: ${statusDetail}`);
        
        if (status === 'FINISHED') {
          console.log("Media processing completed successfully!");
          break; // Exit the loop when the media is ready
        }
        
        if (status === 'ERROR' || status === 'EXPIRED') {
          if (statusDetail.includes('2207026')) {
            // This specific error means Instagram cannot access the video
            return res.status(400).json({
              error: "Instagram cannot access video",
              details: "Instagram's servers cannot access your video file. This may be because ngrok connection is not stable or has changed.",
              suggestions: [
                "1. Check if your ngrok URL is still active",
                "2. Make sure the video file is accessible through your browser at " + videoUrl,
                "3. Try restarting ngrok to get a new URL"
              ]
            });
          } else {
            throw new Error(`Media processing failed with status: ${status}. Detail: ${statusDetail}`);
          }
        }
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime = Math.min(waitTime * 1.5, 30000); // Increase wait time, max 30 seconds
      } catch (statusError) {
        console.error(`Error checking media status (attempt ${attempt}/${maxAttempts}):`, 
          statusError.response?.data || statusError.message
        );
        
        // If we've hit the max attempts, throw the error
        if (attempt >= maxAttempts) {
          return res.status(500).json({
            error: "Media processing timeout",
            details: `Failed to check media status after ${maxAttempts} attempts`,
            lastError: statusError.response?.data?.error?.message || statusError.message
          });
        }
        
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime = Math.min(waitTime * 1.5, 30000);
      }
    }
    
    // Step 3: Check if the media is ready, otherwise return an error
    if (status !== 'FINISHED') {
      return res.status(500).json({
        error: "Media processing failed",
        details: `Final status: ${status}. Detail: ${statusDetail}`
      });
    }
    
    // Step 4: Publish the media container
    console.log("Publishing media to Instagram...");
    let publishResponse;
    try {
      publishResponse = await axios.post(publishEndpoint, {
        creation_id: containerId,
        access_token: accessToken
      });
      
      console.log("Instagram publish response:", publishResponse.data);
    } catch (publishError) {
      console.error("Error publishing to Instagram:", 
        publishError.response?.data || publishError.message
      );
      return res.status(500).json({
        error: "Failed to publish to Instagram",
        details: publishError.response?.data?.error?.message || publishError.message,
        rawError: publishError.response?.data || null
      });
    }
    
    // Step 5: Save the post to MongoDB with the Instagram post ID
    try {
      const newPost = new Post({
        videoPath,
        title,
        description,
        keywords,
        platform,
        instagramPostId: publishResponse.data.id
      });
      const savedPost = await newPost.save();
      
      return res.json({ 
        message: "Instagram reel posted successfully", 
        post: savedPost,
        instagramPostId: publishResponse.data.id
      });
    } catch (dbError) {
      console.error("Error saving post to database:", dbError);
      // Still return success since the post was published, just not saved
      return res.json({ 
        message: "Instagram reel posted successfully, but failed to save to database", 
        instagramPostId: publishResponse.data.id,
        dbError: dbError.message
      });
    }
  } catch (error) {
    console.error("Error posting to Instagram:", 
      error.response ? {
        data: error.response.data,
        status: error.response.status
      } : error
    );
    
    return res.status(500).json({ 
      error: "Instagram post failed", 
      details: error.message || error.toString(),
      response: error.response?.data || null
    });
  }
}
  // Simulate posting for other platforms
  else {
    try {
      const newPost = new Post({
        videoPath,
        title,
        description,
        keywords,
        platform,
      });
      const savedPost = await newPost.save();
      return res.json({ message: "Post simulated and saved successfully", post: savedPost });
    } catch (error) {
      console.error("Error saving post:", error);
      return res.status(500).json({ error: "Error saving post" });
    }
  }
});

// Express endpoint to get details of a specific post by ID
app.get('/api/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.json({ post });
  } catch (error) {
    console.error("Error retrieving post:", error);
    return res.status(500).json({ error: "Error retrieving post" });
  }
});

/**
 * GET /api/analytics
 * Retrieve all posts and simulate analytics data (views, likes, shares).
 * Also provide a suggestion based on the engagement.
 */
app.get('/api/analytics', async (req, res) => {
  try {
    // Retrieve all posts from MongoDB
    const posts = await Post.find({});

    // For each post, fetch real Twitter metrics if applicable; otherwise, simulate data.
    const analytics = await Promise.all(posts.map(async (post) => {
      let metrics = {};

      if (post.platform.toLowerCase() === 'twitter' && post.tweetId && twitterClient) {
        try {
          // Fetch tweet data including public metrics from Twitter API v2
          const tweetData = await twitterClient.v2.singleTweet(post.tweetId, { 'tweet.fields': 'public_metrics' });
          metrics = tweetData.data.public_metrics;
        } catch (err) {
          console.error(`Error fetching metrics for tweet ${post.tweetId}:`, err);
          // Fallback to simulated metrics if Twitter call fails
          metrics = {
            retweet_count: Math.floor(Math.random() * 100),
            reply_count: Math.floor(Math.random() * 50),
            like_count: Math.floor(Math.random() * 500),
            quote_count: Math.floor(Math.random() * 20)
          };
        }
      } else {
        // For non-Twitter posts or simulated posts, generate random engagement numbers
        metrics = {
          views: Math.floor(Math.random() * 900) + 100,
          likes: Math.floor(Math.random() * 300),
          shares: Math.floor(Math.random() * 100)
        };
      }

      // Generate a simple suggestion based on the metrics
      let suggestion = '';
      if (metrics.like_count !== undefined) {
        // If using Twitter metrics
        const likeRatio = metrics.like_count / (metrics.retweet_count + metrics.reply_count + 1);
        suggestion = likeRatio < 0.5 ? 'Improve engagement by refining your tweet content.' : 'Good performance! Keep up the creative work.';
      } else {
        // For simulated metrics
        const likeRatio = metrics.likes / (metrics.views + 1);
        suggestion = likeRatio < 0.1 ? 'Consider enhancing post interactivity.' : 'Strong engagement, maintain your strategy!';
      }

      return {
        postId: post._id,
        videoPath: post.videoPath,
        title: post.title,
        description: post.description,
        platform: post.platform,
        tweetId: post.tweetId || null,
        datePosted: post.datePosted,
        analytics: metrics,
        suggestion
      };
    }));

    return res.json({ analytics });
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    return res.status(500).json({ error: "Error retrieving analytics" });
  }
});

// Add this endpoint to your Express server file (e.g., server/app.js)
app.get('/api/export-analytics', async (req, res) => {
  try {
    // Retrieve all posts from MongoDB
    const posts = await Post.find({});

    // Start building the CSV content
    // Define the CSV header
    let csvData = "postId,videoPath,title,description,platform,datePosted,views,likes,shares,suggestion\n";

    // Loop through each post to generate CSV rows
    posts.forEach(post => {
      // For demonstration purposes, we'll simulate engagement metrics.
      const views = Math.floor(Math.random() * 900) + 100;
      const likes = Math.floor(Math.random() * 300);
      const shares = Math.floor(Math.random() * 100);
      const likeRatio = likes / (views + 1);
      const suggestion = likeRatio < 0.1 ? "Consider enhancing post interactivity." : "Strong engagement, maintain your strategy!";

      // Clean fields to avoid CSV formatting issues (e.g., commas in text)
      const clean = (text) => `"${String(text).replace(/"/g, '""')}"`;

      csvData += [
        clean(post._id),
        clean(post.videoPath),
        clean(post.title),
        clean(post.description),
        clean(post.platform),
        clean(post.datePosted),
        views,
        likes,
        shares,
        clean(suggestion)
      ].join(",") + "\n";
    });

    // Set headers to force download of the CSV file
    res.header("Content-Type", "text/csv");
    res.attachment("analytics_report.csv");
    return res.send(csvData);

  } catch (error) {
    console.error("Error exporting analytics:", error);
    return res.status(500).json({ error: "Error exporting analytics" });
  }
});

app.post('/api/schedulePost', (req, res) => {
  const { videoPath, title, description, keywords, platform, delay } = req.body;

  if (!videoPath || !title || !platform || typeof delay !== 'number') {
    return res.status(400).json({ error: "videoPath, title, platform, and delay (in seconds) are required" });
  }

  // Immediately respond to the client
  res.json({ message: `Post scheduled in ${delay} seconds` });

  // Use setTimeout to simulate scheduling a post
  setTimeout(async () => {
    try {
      const newPost = new Post({
        videoPath,
        title,
        description,
        keywords,
        platform
      });
      const savedPost = await newPost.save();
      console.log("Scheduled post published:", savedPost);
    } catch (error) {
      console.error("Error publishing scheduled post:", error);
    }
  }, delay * 1000);
});

// Start the server
app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
});