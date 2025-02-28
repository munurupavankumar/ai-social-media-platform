// services/facebook.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Post = require('../models/Post');
const { validateMedia } = require('../utils/mediaHelpers');

// Post to Facebook
const postToFacebook = async (req, res) => {
  const { videoPath, title, description, keywords } = req.body;
  
  console.log('Platform check:', {
    hasFacebookPageId: !!process.env.FACEBOOK_PAGE_ID,
    hasFacebookToken: !!process.env.FACEBOOK_ACCESS_TOKEN,
  });
  
  try {
    const videoFileName = path.basename(videoPath);
    
    // Use ngrok URL for local development or server's URL for production
    const ngrokUrl = process.env.NGROK_URL || `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${ngrokUrl}/videos/${videoFileName}`;
    
    console.log(`Facebook post attempt with video URL: ${videoUrl}`);
    
    // Verify file exists and validate format
    const fullPath = path.join(__dirname, '..', '..', 'flask_service', 'downloads', videoFileName);
    
    // Validate media file
    const validationResult = validateMedia(fullPath, ['mp4', 'mov'], 1024); // Max 1GB for Facebook
    if (!validationResult.isValid) {
      return res.status(validationResult.status || 400).json({ 
        error: validationResult.error, 
        details: validationResult.details 
      });
    }
    
    // Facebook Graph API endpoints and credentials
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    // Prepare hashtags for Facebook
    const hashtagsString = keywords && keywords.length ? keywords.map(tag => `#${tag}`).join(' ') : '';
    
    // Approach 1: Video upload via URL
    console.log("Creating Facebook video post...");
    const videosEndpoint = `https://graph.facebook.com/v21.0/${pageId}/videos`;
    
    let videoResponse;
    try {
      // For Facebook, we directly upload the video in a single step with description
      videoResponse = await axios.post(videosEndpoint, {
        file_url: videoUrl,
        description: `${title}\n\n${description || ""}\n\n${hashtagsString}`,
        title: title,
        access_token: accessToken
      });
      
      console.log("Facebook post response:", videoResponse.data);
      
      // Save the post to MongoDB with the Facebook post ID
      try {
        const newPost = new Post({
          videoPath,
          title,
          description,
          keywords,
          platform: 'facebook',
          facebookPostId: videoResponse.data.id
        });
        const savedPost = await newPost.save();
        
        return res.json({ 
          message: "Facebook video posted successfully", 
          post: savedPost,
          facebookPostId: videoResponse.data.id
        });
      } catch (dbError) {
        console.error("Error saving post to database:", dbError);
        // Still return success since the post was published, just not saved
        return res.json({ 
          message: "Facebook video posted successfully, but failed to save to database", 
          facebookPostId: videoResponse.data.id,
          dbError: dbError.message
        });
      }
    } catch (uploadError) {
      console.error("Error uploading to Facebook:", 
        uploadError.response?.data || uploadError.message
      );
      return res.status(500).json({
        error: "Failed to upload video to Facebook",
        details: uploadError.response?.data?.error?.message || uploadError.message,
        rawError: uploadError.response?.data || null
      });
    }
  } catch (error) {
    console.error("Error posting to Facebook:", 
      error.response ? {
        data: error.response.data,
        status: error.response.status
      } : error
    );
    
    return res.status(500).json({ 
      error: "Facebook post failed", 
      details: error.message || error.toString(),
      response: error.response?.data || null
    });
  }
};

module.exports = {
  postToFacebook
};