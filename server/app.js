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

// Define a Post schema and model for tracking posts
const postSchema = new mongoose.Schema({
  videoPath: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  keywords: [String],
  platform: { type: String, required: true },
  datePosted: { type: Date, default: Date.now }
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
 * Simulate posting content to a social media platform.
 * Expected JSON payload:
 * {
 *   "videoPath": "path/to/spinoff_video.mp4",
 *   "title": "My Awesome Post",
 *   "description": "This is a description of my post",
 *   "keywords": ["keyword1", "keyword2"],
 *   "platform": "Instagram" // or "Facebook", etc.
 * }
 */
app.post('/api/post', async (req, res) => {
  const { videoPath, title, description, keywords, platform } = req.body;

  // Validate required fields
  if (!videoPath || !title || !platform) {
    return res.status(400).json({ error: "videoPath, title, and platform are required" });
  }

  // If platform is Twitter and Twitter client is initialized, post to Twitter
  if (platform.toLowerCase() === 'twitter' && twitterClient) {
    try {
      // Construct tweet content using title, description, and keywords
      const tweetText = `${title}\n\n${description}\n\nKeywords: ${keywords.join(', ')}`;
      console.log("Tweet text being sent:", tweetText);

      let mediaIds = [];
      // Check if the video file exists; if so, upload it
      const fullPath = path.join(__dirname, '..', 'flask_service', 'downloads', path.basename(videoPath));
      if (fs.existsSync(fullPath)) {
        console.log("Video file found. Uploading media...");
        const mediaId = await twitterClient.v1.uploadMedia(fullPath);
        mediaIds.push(mediaId);
        console.log("Media uploaded. Media ID:", mediaId);
      } else {
        console.log("Video file not found. Proceeding without media.");
      }

      // Prepare the tweet payload for API V2
      const tweetPayload = {
        text: tweetText,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }), // Attach media IDs if available
      };

      // Post the tweet using API V2
      const tweetResponse = await twitterClient.v2.tweet(tweetPayload);
      return res.json({ message: "Tweet posted successfully", tweet: tweetResponse });
    } catch (error) {
      console.error("Error posting tweet:", error);
      return res.status(500).json({ error: "Twitter post failed", details: error.toString() });
    }
  } else {
    // Otherwise, simulate posting by storing the post in MongoDB
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
