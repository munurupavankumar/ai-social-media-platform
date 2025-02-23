// src/components/PostDetails.jsx
import React, { useState } from 'react';
import axios from 'axios';

const PostDetails = () => {
  const [postId, setPostId] = useState('');
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  const handleFetchPost = async () => {
    try {
      setError('');
      const response = await axios.get(`http://localhost:3000/api/post/${postId}`);
      setPost(response.data.post);
    } catch (err) {
      console.error(err);
      setError('Error fetching post details');
      setPost(null);
    }
  };

  return (
    <div>
      <h2>Post Details</h2>
      <input
        type="text"
        value={postId}
        onChange={(e) => setPostId(e.target.value)}
        placeholder="Enter post ID"
      />
      <button onClick={handleFetchPost}>Fetch Post</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {post && (
        <div style={{marginTop: '20px', border: '1px solid #ccc', padding: '15px'}}>
          <h3>{post.title}</h3>
          <p><strong>Description:</strong> {post.description}</p>
          <p><strong>Platform:</strong> {post.platform}</p>
          <p>
            <strong>Date Posted:</strong> {new Date(post.datePosted).toLocaleString()}
          </p>
          {post.platform.toLowerCase() === 'twitter' && post.tweetId && (
            <p>
              <strong>Tweet:</strong>{' '}
              <a
                href={`https://twitter.com/i/web/status/${post.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Tweet
              </a>
            </p>
          )}
          {post.videoPath && (
            <div>
              <h4>Video Preview:</h4>
              <video width="320" height="240" controls>
                <source src={`http://localhost:3000/${post.videoPath}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostDetails;
