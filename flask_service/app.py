# app.py
from flask import Flask, jsonify, request, Response
import subprocess
import os
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

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
