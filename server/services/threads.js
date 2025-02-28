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
      return res.status(500).json({
        error: "Failed to create Threads media container",
        details: containerError.response?.data?.error?.message || containerError.message,
        rawError: containerError.response?.data || null
      });
    }
    
    const containerId = mediaResponse.data.id;
    console.log(`Media container created with ID: ${containerId}`);
    
    // Wait for media processing (10 seconds)
    console.log("Waiting for media processing...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 2: Publish the media container with automated polling
    console.log("Publishing media to Threads...");

    let publishResponse;
    let retries = 5;
    while (retries > 0) {
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
        // If the publish call succeeded, break out of the loop.
        break;
      } catch (error) {
        // Check if error message indicates the media isn't ready.
        const errorMsg = error.response?.data?.error?.message || error.message;
        if (errorMsg.includes('Media not found')) {
          console.log(`Media not available yet. Retrying in 3 seconds...`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          // For other errors, exit immediately.
          console.error("Error publishing to Threads:", errorMsg);
          return res.status(500).json({
            error: "Failed to publish to Threads",
            details: errorMsg
          });
        }
      }
    }

    if (!publishResponse) {
      return res.status(500).json({
        error: "Failed to publish to Threads",
        details: "Media was not processed in time."
      });
    }

    console.log("Threads publish response:", publishResponse.data);

    // Save to database
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
  } catch (error) {
    console.error("Error posting to Threads:", error);
    return res.status(500).json({ 
      error: "Threads post failed", 
      details: error.message || error.toString()
    });
  }
};

module.exports = {
  postToThreads
};
