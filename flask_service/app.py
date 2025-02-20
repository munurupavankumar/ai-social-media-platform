# app.py
from flask import Flask, jsonify, request  # We'll need this later for real scraping
from bs4 import BeautifulSoup  # Also for future scraping implementation
import subprocess
import os
import json
import re
from flask_cors import CORS
import requests  # Add this import for API calls

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify(message="Hello from the Flask microservice!")

@app.route('/api/trending', methods=['GET'])
def scrape_trending():
    """
    Simulate scraping trending videos from Instagram and Facebook.
    In the future, replace this simulated data with actual scraping logic.
    """
    trending_data = [
        {
            "platform": "Instagram",
            "video_url": "https://instagram.com/samplevideo1",
            "description": "Sample Instagram video 1",
            "likes": 1200,
            "comments": 300
        },
        {
            "platform": "Facebook",
            "video_url": "https://facebook.com/samplevideo1",
            "description": "Sample Facebook video 1",
            "likes": 800,
            "comments": 150
        }
    ]
    return jsonify(trending=trending_data)

@app.route('/api/download', methods=['POST'])
def download_media():
    """
    Download video or audio from a given URL using yt-dlp.
    Expected JSON payload:
    {
        "video_url": "<URL of the video>",
        "media_type": "video"  // or "audio"
    }
    """
    data = request.get_json()
    video_url = data.get('video_url')
    media_type = data.get('media_type', 'video')  # default to video if not provided

    if not video_url:
        return jsonify({"error": "video_url is required"}), 400

    # Ensure a downloads directory exists
    downloads_dir = 'downloads'
    if not os.path.exists(downloads_dir):
        os.makedirs(downloads_dir)

    # Set up the output template; yt-dlp will use this for the output file name
    output_template = os.path.join(downloads_dir, '%(title)s.%(ext)s')

    # Build the command for yt-dlp
    command = ['yt-dlp', '-o', output_template]

    if media_type == 'audio':
        # Download best audio and convert it to mp3
        command.extend(['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3'])
    else:
        # Download best available video
        command.extend(['-f', 'best'])

    command.append(video_url)

    try:
        # Run the command; check=True will raise an exception if the command fails
        subprocess.run(command, check=True)
        return jsonify({"message": "Download successful", "video_url": video_url}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Download failed", "details": str(e)}), 500
    
@app.route('/api/spinoff', methods=['POST'])
def create_spin_off():
    """
    Create a spin-off video using a simple template.
    Expected JSON payload:
    {
        "video_path": "<path to the original video file>",
        "template": {
            "overlay_text": "Your overlay text here"
        }
    }
    This endpoint uses MoviePy to add a text overlay to the video.
    """
    data = request.get_json()
    video_path = data.get('video_path')
    template = data.get('template', {})

    if not video_path:
        return jsonify({"error": "video_path is required"}), 400

    # Retrieve overlay text from the template; default if not provided
    overlay_text = template.get('overlay_text', 'Spin-off Video')

    # Define output path for the spin-off video
    base, ext = os.path.splitext(video_path)
    spin_off_path = f"{base}_spinoff{ext if ext else '.mp4'}"

    try:
        # Import MoviePy components
        from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip

        # Load the original video
        clip = VideoFileClip(video_path)

        # Create a text clip with the overlay text; adjust fontsize and color as needed
        txt_clip = TextClip(overlay_text, fontsize=24, color='white', bg_color='black')
        txt_clip = txt_clip.set_position(('center', 'bottom')).set_duration(clip.duration)

        # Overlay the text on the original video
        video = CompositeVideoClip([clip, txt_clip])
        video.write_videofile(spin_off_path, codec='libx264', audio_codec='aac')

        return jsonify({"message": "Spin-off video created successfully", "spin_off_video": spin_off_path}), 200

    except Exception as e:
        return jsonify({"error": "Failed to create spin-off video", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True, use_reloader=False)
