// services/twitter.js
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');

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

// Check if Twitter is initialized
const isInitialized = () => {
  return !!twitterClient;
};

// Get Twitter client
const getClient = () => {
  return twitterClient;
};

// Post to Twitter
const postToTwitter = async (req, res) => {
  const { videoPath, title, description, keywords } = req.body;
  
  try {
    const tweetText = `${title}\n\n${description}\n\n${keywords.join(', ')}`;
    console.log("Tweet text being sent:", tweetText);

    let mediaIds = [];
    const fullPath = path.join(__dirname, '..', '..', 'flask_service', 'downloads', path.basename(videoPath));
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
    
    // Save the post to MongoDB
    try {
      const newPost = new Post({
        videoPath,
        title,
        description,
        keywords,
        platform: 'twitter',
        tweetId: tweetResponse.data.id
      });
      const savedPost = await newPost.save();
      return res.json({ 
        message: "Tweet posted successfully", 
        tweet: tweetResponse,
        post: savedPost
      });
    } catch (dbError) {
      console.error("Error saving tweet to database:", dbError);
      return res.json({ 
        message: "Tweet posted successfully, but failed to save to database", 
        tweet: tweetResponse,
        dbError: dbError.message
      });
    }
  } catch (error) {
    console.error("Error posting tweet:", error);
    return res.status(500).json({ error: "Twitter post failed", details: error.toString() });
  }
};

module.exports = {
  isInitialized,
  getClient,
  postToTwitter
};