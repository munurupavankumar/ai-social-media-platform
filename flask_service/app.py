# app.py
from flask import Flask, jsonify, request, Response
import subprocess
import requests
import os
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

required_env_vars = ['INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please ensure your .env file contains these variables")

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify(message="Hello from the Flask microservice!")

def getCreds():
    return {
        "instagram_account_id": os.getenv('INSTAGRAM_USER_ID'),
        "access_token": os.getenv('INSTAGRAM_ACCESS_TOKEN'),
        "endpoint_base": "https://graph.facebook.com/v21.0/",  # Updated version
        "debug": True  # Enable debug to see API responses
    }

def makeApiCall(url, params, debug=False):
    """
    Make a GET request to the specified URL with parameters.
    Returns a dictionary with the JSON response.
    """
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return {"json_data": response.json()}
    except requests.exceptions.RequestException as e:
        print(f"\nAPI Error: {str(e)}")
        print(f"Response content: {response.text if 'response' in locals() else 'No response'}")
        return {"json_data": {"error": str(e)}}

def getHashtagInfo(params):
    """
    Get info on a hashtag.
    
    API Endpoint:
      https://graph.facebook.com/{graph-api-version}/ig_hashtag_search?user_id={user-id}&q={hashtag-name}&fields=id,name
    """
    endpointParams = {
        "user_id": params['instagram_account_id'],
        "q": params['hashtag_name'],
        "fields": "id,name",
        "access_token": params['access_token']
    }
    url = params['endpoint_base'] + 'ig_hashtag_search'
    return makeApiCall(url, endpointParams, params['debug'])

def getHashtagMedia(params):
    """
    Get posts for a hashtag with rate limit handling.
    Args:
        params: Dictionary containing:
            - instagram_account_id: Instagram Business Account ID
            - access_token: Access token
            - hashtag_id: ID of the hashtag
            - media_type: Either 'recent_media' or 'top_media'
    """
    endpointParams = {
        "user_id": params['instagram_account_id'],
        "fields": "id,caption,media_type,media_url,permalink,timestamp",
        "access_token": params['access_token'],
        "limit": 50
    }
    
    # Use either top_media or recent_media based on params
    media_type = params.get('media_type', 'recent_media')
    if media_type not in ['top_media', 'recent_media']:
        media_type = 'recent_media'  # fallback to recent if invalid type
        
    url = params['endpoint_base'] + params['hashtag_id'] + '/' + media_type
    return makeApiCall(url, endpointParams, params['debug'])

@app.route('/api/trending', methods=['GET'])
def scrape_trending():
    """
    Fetch trending videos from Instagram by performing a hashtag search.
    Query parameters:
        - hashtag: The hashtag to search for (required)
        - type: Either 'top' or 'recent' (optional, defaults to 'top')
    """
    params = getCreds()
    if not params['instagram_account_id'] or not params['access_token']:
        return jsonify({"error": "Missing Instagram credentials"}), 400

    try:
        # Get hashtag and media type from URL parameters
        hashtag = request.args.get('hashtag')
        media_type = request.args.get('type', 'top')  # Default to top media
        
        if not hashtag:
            return jsonify({"error": "Hashtag parameter is required"}), 400
            
        params['hashtag_name'] = hashtag
        params['media_type'] = 'top_media' if media_type == 'top' else 'recent_media'
        
        hashtagInfoResponse = getHashtagInfo(params)
        
        if 'error' in hashtagInfoResponse['json_data']:
            print("\nError in hashtag search:", hashtagInfoResponse['json_data'])
            return jsonify({"error": "Hashtag search failed", 
                          "details": hashtagInfoResponse['json_data']}), 500
        
        if not hashtagInfoResponse['json_data'].get("data"):
            return jsonify({"error": "No hashtag data found"}), 404

        params['hashtag_id'] = hashtagInfoResponse['json_data']['data'][0]['id']
        
        hashtagMediaResponse = getHashtagMedia(params)
        
        if 'error' in hashtagMediaResponse['json_data']:
            print("\nError in media fetch:", hashtagMediaResponse['json_data'])
            return jsonify({"error": "Media fetch failed", 
                          "details": hashtagMediaResponse['json_data']}), 500

        # Process the response data
        media_data = hashtagMediaResponse['json_data'].get('data', [])
        trending_videos = []
        
        for post in media_data:
            media_type = post.get('media_type', '').upper()
            if media_type == 'VIDEO':
                video_data = {
                    "platform": "Instagram",
                    "video_url": post.get("media_url"),
                    "description": post.get("caption"),
                    "permalink": post.get("permalink"),
                    "timestamp": post.get("timestamp"),
                    "media_type": media_type,
                    "id": post.get("id")
                }
                trending_videos.append(video_data)

        response_data = {
            "trending": trending_videos,
            "total_found": len(trending_videos),
            "hashtag_used": params['hashtag_name'],
            "debug_info": {
                "hashtag_id": params['hashtag_id'],
                "total_media_items": len(media_data)
            }
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

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
