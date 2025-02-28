// services/instagram.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Post = require('../models/Post');
const { validateMedia } = require('../utils/mediaHelpers');

// Post to Instagram
const postToInstagram = async (req, res) => {
  const { videoPath, title, description, keywords } = req.body;
  
  try {
    // Construct the public video URL using ngrok URL
    const videoFileName = path.basename(videoPath);
    
    // Use ngrok URL for local development
    const ngrokUrl = process.env.NGROK_URL || `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${ngrokUrl}/videos/${videoFileName}`;
    
    console.log(`Instagram post attempt with video URL: ${videoUrl}`);
    
    // Verify the file exists and validate its format
    const fullPath = path.join(__dirname, '..', '..', 'flask_service', 'downloads', videoFileName);
    
    // Validate media file
    const validationResult = validateMedia(fullPath, ['mp4', 'mov'], 100); // Max 100MB
    if (!validationResult.isValid) {
      return res.status(validationResult.status || 400).json({ 
        error: validationResult.error, 
        details: validationResult.details 
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
        platform: 'instagram',
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
};

module.exports = {
  postToInstagram
};