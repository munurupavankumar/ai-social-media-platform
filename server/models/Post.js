// models/Post.js
const mongoose = require('mongoose');

// Define a Post schema and model for tracking posts
const postSchema = new mongoose.Schema({
  videoPath: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  keywords: [String],
  platform: { type: String, required: true },
  datePosted: { type: Date, default: Date.now },
  tweetId: { type: String }, // For Twitter posts
  instagramPostId: { type: String }, // For Instagram posts
  facebookPostId: { type: String }, // For Facebook posts
  threadsPostId: { type: String } // For Threads posts
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;