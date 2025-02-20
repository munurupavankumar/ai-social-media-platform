// app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai_social_media')
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

  try {
    // Create a new post document
    const newPost = new Post({
      videoPath,
      title,
      description,
      keywords,
      platform
    });

    // Save the post to MongoDB
    const savedPost = await newPost.save();

    // Return a success response with the stored post data
    return res.json({ message: "Post successful", post: savedPost });
  } catch (error) {
    console.error("Error saving post:", error);
    return res.status(500).json({ error: "Error saving post" });
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

    // Simulate analytics for each post
    const analytics = posts.map(post => {
      // Generate simulated analytics data
      const views = Math.floor(Math.random() * 900) + 100;  // Random number between 100 and 1000
      const likes = Math.floor(views * (Math.random() * 0.3));  // Up to 30% of views
      const shares = Math.floor(likes * (Math.random() * 0.5)); // Up to 50% of likes

      // Generate a suggestion based on the likes ratio
      let suggestion = '';
      const likeRatio = views > 0 ? likes / views : 0;
      if (likeRatio < 0.1) {
        suggestion = 'Increase engagement by optimizing your title and description.';
      } else {
        suggestion = 'Good performance! Consider experimenting with posting times.';
      }

      return {
        postId: post._id,
        videoPath: post.videoPath,
        title: post.title,
        description: post.description,
        platform: post.platform,
        datePosted: post.datePosted,
        analytics: {
          views,
          likes,
          shares,
          suggestion
        }
      };
    });

    res.json({ analytics });
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    res.status(500).json({ error: "Error retrieving analytics" });
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
