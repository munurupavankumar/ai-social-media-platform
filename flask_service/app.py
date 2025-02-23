# app.py
from flask import Flask, jsonify, request, Response  # We'll need this later for real scraping
import subprocess
import os
from flask_cors import CORS
from openai import OpenAI
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from moviepy.video.tools.segmenting import findObjects
import moviepy.video.fx.all as vfx
import numpy as np
import random

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
    Create platform-optimized spin-off videos using predefined templates.
    
    Expected JSON payload:
    {
        "video_path": "<path to the original video file>",
        "platform": "twitter|instagram|youtube|pinterest|facebook"
    }
    """
    data = request.get_json()
    video_path = data.get('video_path')
    platform = data.get('platform', 'instagram')  # Default to Instagram if not specified
    
    if not video_path:
        return jsonify({"error": "video_path is required"}), 400
    
    if platform not in ['twitter', 'instagram', 'youtube', 'pinterest', 'facebook']:
        return jsonify({"error": "Invalid platform specified"}), 400

    try:
        # Load the original video
        clip = VideoFileClip(video_path)
        
        # Apply platform-specific templates
        if platform == 'twitter':
            final_clip = twitter_template(clip)
        elif platform == 'instagram':
            final_clip = instagram_template(clip)
        elif platform == 'youtube':
            final_clip = youtube_template(clip)
        elif platform == 'pinterest':
            final_clip = pinterest_template(clip)
        else:  # facebook
            final_clip = facebook_template(clip)
            
        # Generate output path
        base, ext = os.path.splitext(video_path)
        spin_off_path = f"{base}_spinoff_{platform}{ext if ext else '.mp4'}"
        
        # Write the final video with platform-specific settings
        write_video(final_clip, spin_off_path, platform)
        
        return jsonify({
            "message": f"Spin-off video for {platform} created successfully",
            "spin_off_video": spin_off_path
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to create spin-off video", "details": str(e)}), 500

def twitter_template(clip):
    """
    Twitter template: 
    - Short, punchy videos (max 2:20 minutes)
    - Fast-paced with quick cuts
    - Captions at the bottom for accessibility
    - High contrast and vibrant colors
    """
    # Trim to Twitter's max length if needed
    if clip.duration > 140:
        clip = clip.subclip(0, 140)
    
    # Resize to Twitter's recommended dimensions (1280x720)
    clip = clip.resize(width=1280, height=720)
    
    # Enhance colors and contrast
    clip = clip.fx(vfx.colorx, 1.3)
    clip = clip.fx(vfx.lum_contrast, contrast=1.2)
    
    # Add auto-generated captions (placeholder - would need speech recognition)
    # clip = add_captions(clip)
    
    return clip

def instagram_template(clip):
    """
    Instagram template:
    - Square format for feed (1:1)
    - Bright, vibrant colors
    - Smooth transitions
    - Subtle motion effects
    """
    # Create square format
    clip = resize_to_square(clip)
    
    # Enhance colors for Instagram's aesthetic
    clip = clip.fx(vfx.colorx, 1.2)
    
    # Use the resize effect which scales the clip and create a zoom-like effect
    spin_off_clip = clip.fx(vfx.resize, 1.1)
    
    return spin_off_clip

def youtube_template(clip):
    """
    YouTube template:
    - Cinematic 16:9 format
    - Professional color grading
    - Smooth transitions
    - End screen space
    """
    # Resize to YouTube recommended resolution (1920x1080)
    clip = clip.resize(width=1920, height=1080)
    
    # Professional color grading
    clip = clip.fx(vfx.lum_contrast, lum=0.1, contrast=1.1)
    
    # Add space for end screen (last 20 seconds)
    if clip.duration > 20:
        main_portion = clip.subclip(0, -20)
        end_screen = create_end_screen(20)
        clip = CompositeVideoClip([main_portion, end_screen])
    
    return clip

def pinterest_template(clip):
    """
    Pinterest template:
    - Vertical format (2:3 ratio)
    - Bright, clean aesthetic
    - Text overlay space at top/bottom
    - Lifestyle-focused color grading
    """
    # Resize to Pinterest's preferred vertical format (1080x1620)
    clip = resize_vertical(clip, width=1080, height=1620)
    
    # Apply Pinterest-style color grading
    clip = clip.fx(vfx.colorx, 1.15)  # Subtle color boost
    clip = clip.fx(vfx.lum_contrast, lum=0.05, contrast=1.05)  # Soft contrast
    
    # Add subtle vignette effect
    clip = add_vignette(clip)
    
    return clip

def facebook_template(clip):
    """
    Facebook template:
    - Square format for better feed presence
    - Engaging first 3 seconds
    - Optimized for silent viewing
    - Text overlay space
    """
    # Create square format
    clip = resize_to_square(clip)
    
    # Enhance first 3 seconds with zoom
    if clip.duration > 3:
        intro = clip.subclip(0, 3).fx(vfx.resize, 1.1)
        rest = clip.subclip(3)
        clip = CompositeVideoClip([intro, rest])
    
    # Add subtle motion
    clip = clip.fx(vfx.speedx, 1.1)  # Slightly faster pace
    
    return clip

# Helper functions
def resize_to_square(clip):
    """Resize video to 1:1 aspect ratio"""
    width = height = max(clip.w, clip.h)
    return clip.resize(width=width, height=height)

def resize_vertical(clip, width, height):
    """Resize video to vertical format"""
    return clip.resize(width=width, height=height)

def add_vignette(clip):
    """Add subtle vignette effect"""
    def vignette_filter(image):
        height, width = image.shape[:2]
        Y, X = np.ogrid[:height, :width]
        center_x, center_y = width/2, height/2
        dist_from_center = np.sqrt((X - center_x)**2 + (Y - center_y)**2)
        max_dist = np.sqrt(center_x**2 + center_y**2)
        vignette = 1 - dist_from_center/max_dist
        return image * vignette[:, :, np.newaxis]
    
    return clip.fl_image(vignette_filter)

def create_end_screen(duration):
    """Create YouTube end screen space"""
    # Create blank space for end screen elements
    return ColorClip((1920, 1080), col=(0, 0, 0))

def write_video(clip, output_path, platform):
    """Write video with platform-specific settings"""
    settings = {
        'twitter': {'bitrate': '2000k', 'audio_bitrate': '128k', 'preset': 'faster'},
        'instagram': {'bitrate': '3500k', 'audio_bitrate': '192k', 'preset': 'medium'},
        'youtube': {'bitrate': '4000k', 'audio_bitrate': '192k', 'preset': 'slow'},
        'pinterest': {'bitrate': '2500k', 'audio_bitrate': '128k', 'preset': 'medium'},
        'facebook': {'bitrate': '2500k', 'audio_bitrate': '128k', 'preset': 'medium'}
    }
    
    platform_settings = settings[platform]
    
    clip.write_videofile(
        output_path,
        codec='libx264',
        audio_codec='aac',
        bitrate=platform_settings['bitrate'],
        audio_bitrate=platform_settings['audio_bitrate'],
        preset=platform_settings['preset'],
        threads=4
    )

@app.route('/api/metadata_stream', methods=['POST'])
def generate_metadata_stream():
    """
    This endpoint generates metadata (creative title, description, and keywords)
    for a given content description using an AI API and streams the output.
    
    Expected JSON payload:
    {
        "content": "Your content description here..."
    }
    """
    data = request.get_json()
    content = data.get("content")
    if not content:
        return jsonify({"error": "Field 'content' is required"}), 400

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        return jsonify({"error": "GITHUB_TOKEN environment variable not set"}), 500

    # Set the endpoint and model name
    endpoint = "https://models.inference.ai.azure.com"
    model_name = "gpt-4o"

    # Create the OpenAI client
    client = OpenAI(
        base_url=endpoint,
        api_key=token,
    )

    # Prepare the prompt messages for metadata generation
    messages = [
        {
            "role": "system",
            "content": "You are an assistant that generates creative metadata for social media content."
        },
        {
            "role": "user",
            "content": f"Generate a creative title, a concise description, and a list of relevant keywords for the following content: {content}"
        }
    ]

    try:
        # Call the chat completion API with streaming enabled
        response = client.chat.completions.create(
            messages=messages,
            model=model_name,
            temperature=1.0,
            top_p=1.0,
            max_tokens=300,
            stream=True,
            stream_options={'include_usage': True}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Generator function to stream the response token-by-token
    def generate():
        for update in response:
            if update.choices and update.choices[0].delta:
                yield update.choices[0].delta.content or ""
    
    return Response(generate(), mimetype='text/plain')

if __name__ == '__main__':
    app.run(port=5000, debug=True, use_reloader=False)
