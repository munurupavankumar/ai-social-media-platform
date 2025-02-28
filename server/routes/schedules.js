// routes/schedules.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Schedule post endpoint
router.post('/schedulePost', (req, res) => {
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
        platform: platform.toLowerCase()
      });
      const savedPost = await newPost.save();
      console.log("Scheduled post published:", savedPost);
    } catch (error) {
      console.error("Error publishing scheduled post:", error);
    }
  }, delay * 1000);
});

module.exports = router;