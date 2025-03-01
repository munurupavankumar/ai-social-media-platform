// services/threads.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Post = require('../models/Post');
const { validateMedia } = require('../utils/mediaHelpers');

// Post to Threads
const postToThreads = async (req, res) => {
  const { videoPath, title, description, keywords } = req.body;

  try {
    const videoFileName = path.basename(videoPath);
    
    // Use ngrok URL for local development
    const ngrokUrl = process.env.NGROK_URL || `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${ngrokUrl}/videos/${videoFileName}`;
    
    console.log(`Threads post attempt with video URL: ${videoUrl}`);
    
    // Verify file exists and validate format
    const fullPath = path.join(__dirname, '..', '..', 'flask_service', 'downloads', videoFileName);
    
    // Validate media file
    const validationResult = validateMedia(fullPath, ['mp4', 'mov'], 100); // Max 100MB
    if (!validationResult.isValid) {
      return res.status(validationResult.status || 400).json({ 
        error: validationResult.error, 
        details: validationResult.details 
      });
    }
    
    // Threads API credentials
    const threadsUserId = process.env.THREADS_USER_ID;
    const accessToken = process.env.THREADS_ACCESS_TOKEN;
    const mediaEndpoint = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const publishEndpoint = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`;
    
    // Step 1: Create a media container
    console.log("Creating Threads media container...");
    let mediaResponse;
    try {
      mediaResponse = await axios.post(
        mediaEndpoint,
        {
          media_type: 'VIDEO',
          video_url: videoUrl,
          text: `${title}\n\n${description || ""}${keywords && keywords.length ? '\n\n#' + keywords.join(' #') : ''}`
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (containerError) {
      console.error("Error creating media container:", containerError.response?.data || containerError.message);
      
      // Check for URL access issues
      const errorMsg = containerError.response?.data?.error?.message || containerError.message;
      if (errorMsg.includes('Unable to download media file')) {
        return res.status(400).json({
          error: "Threads cannot access video",
          details: "Threads servers cannot access your video file. This may be because ngrok connection is not stable or has changed.",
          suggestions: [
            "1. Check if your ngrok URL is still active",
            "2. Make sure the video file is accessible through your browser at " + videoUrl,
            "3. Try restarting ngrok to get a new URL"
          ]
        });
      }
      
      return res.status(500).json({
        error: "Failed to create Threads media container",
        details: errorMsg,
        rawError: containerError.response?.data || null
      });
    }
    
    const containerId = mediaResponse.data.id;
    console.log(`Media container created with ID: ${containerId}`);
    
    // Step 2: Check the media container status with exponential backoff
    // Implementation similar to Instagram service
    const statusEndpoint = `https://graph.threads.net/v1.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
    let status = '';
    let statusDetail = '';
    const maxAttempts = 30; // Increased from original 5 retries
    let attempt = 0;
    let waitTime = 5000; // Start with 5 seconds
    
    console.log("Checking media processing status...");
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        const statusResponse = await axios.get(statusEndpoint, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        
        status = statusResponse.data.status_code || statusResponse.data.status;
        statusDetail = statusResponse.data.status || 'No detailed status available';
        
        console.log(`Attempt ${attempt}/${maxAttempts}: Media status: ${status}. Detail: ${statusDetail}`);
        
        if (status === 'FINISHED' || status === 'READY') {
          console.log("Media processing completed successfully!");
          break; // Exit the loop when the media is ready
        }
        
        if (status === 'ERROR' || status === 'EXPIRED') {
          // Check for common error patterns
          if (statusDetail.includes('access') || statusDetail.includes('download')) {
            return res.status(400).json({
              error: "Threads cannot access video",
              details: "Threads servers cannot access your video file. This may be because ngrok connection is not stable or has changed.",
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
    if (status !== 'FINISHED' && status !== 'READY') {
      return res.status(500).json({
        error: "Media processing failed",
        details: `Final status: ${status}. Detail: ${statusDetail}`
      });
    }
    
    // Step 4: Publish the media container
    console.log("Publishing media to Threads...");
    let publishResponse;
    try {
      publishResponse = await axios.post(
        publishEndpoint,
        { creation_id: containerId },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      console.log("Threads publish response:", publishResponse.data);
    } catch (publishError) {
      console.error("Error publishing to Threads:", 
        publishError.response?.data || publishError.message
      );
      return res.status(500).json({
        error: "Failed to publish to Threads",
        details: publishError.response?.data?.error?.message || publishError.message,
        rawError: publishError.response?.data || null
      });
    }

    // Step 5: Save to database with error handling
    try {
      const newPost = new Post({
        videoPath,
        title,
        description,
        keywords,
        platform: 'threads',
        threadsPostId: publishResponse.data.id
      });
      const savedPost = await newPost.save();

      return res.json({
        message: "Threads video posted successfully",
        post: savedPost,
        threadsPostId: publishResponse.data.id
      });
    } catch (dbError) {
      console.error("Error saving post to database:", dbError);
      // Still return success since the post was published, just not saved
      return res.json({ 
        message: "Threads video posted successfully, but failed to save to database", 
        threadsPostId: publishResponse.data.id,
        dbError: dbError.message
      });
    }
  } catch (error) {
    console.error("Error posting to Threads:", 
      error.response ? {
        data: error.response.data,
        status: error.response.status
      } : error
    );
    
    return res.status(500).json({ 
      error: "Threads post failed", 
      details: error.message || error.toString(),
      response: error.response?.data || null
    });
  }
};

module.exports = {
  postToThreads
};