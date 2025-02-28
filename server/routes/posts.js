// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const twitterService = require('../services/twitter');
const instagramService = require('../services/instagram');
const facebookService = require('../services/facebook');
const threadsService = require('../services/threads');

/**
 * POST /api/post
 * Post content to a social media platform (Twitter, Instagram, Facebook, Threads), or simulate posting.
 */
router.post('/post', async (req, res) => {
  const { videoPath, title, description, keywords, platform } = req.body;

  // Validate required fields
  if (!videoPath || !title || !platform) {
    return res.status(400).json({ error: "videoPath, title, and platform are required" });
  }

  // Twitter posting
  if (platform.toLowerCase() === 'twitter' && twitterService.isInitialized()) {
    return twitterService.postToTwitter(req, res);
  } 
  // Instagram posting
  else if (platform.toLowerCase() === 'instagram' && process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
    return instagramService.postToInstagram(req, res);
  }
  // Facebook posting
  else if (platform.toLowerCase() === 'facebook' && process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN) {
    return facebookService.postToFacebook(req, res);
  }
  // Threads posting
  else if (platform.toLowerCase() === 'threads' && process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    return threadsService.postToThreads(req, res);
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
router.get('/post/:id', async (req, res) => {
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

module.exports = router;