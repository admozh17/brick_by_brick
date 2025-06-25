# Video Information Extractor

An advanced information extraction system for short-form videos (Instagram Reels, TikTok, YouTube Shorts) that extracts structured data about places and activities featured in the content.

## Features

- **Multi-source processing**: Combines speech transcription, OCR text, and captions for comprehensive information extraction
- **Place identification**: Extracts place names, genres, and detailed categorization
- **Geographic data**: Captures addresses and location information
- **Feedback analysis**: Extracts ratings, reviews, and key takeaways
- **Compilation support**: Handles videos featuring multiple places/activities
- **Geocoding**: Optional Google Maps integration for address validation
- **Vector database storage**: ChromaDB integration for semantic search and retrieval
- **Semantic search**: Find similar places and activities using natural language queries
- **Web interface**: Modern, responsive web application for easy interaction

## Architecture

The system consists of five main components:

### 1. `agent.py` - Main Orchestrator
- Downloads videos from various platforms
- Coordinates speech/OCR/caption processing
- Manages the LLM parsing pipeline
- Handles geocoding and data formatting
- Stores results in vector database

### 2. `extractor.py` - Video Processing
- **Video download**: Uses yt-dlp for platform-agnostic video downloading
- **Speech transcription**: WhisperX for high-quality speech-to-text
- **OCR processing**: Tesseract for text extraction from video frames
- **Caption extraction**: Retrieves platform-specific captions/descriptions
- **Geocoding**: Google Maps API integration for address validation

### 3. `llm_parser.py` - Information Extraction
- Advanced LLM-based parsing using GPT-4o-mini
- Structured data extraction with Pydantic models
- Handles both single activities and compilations
- Extracts comprehensive place information including:
  - Place names and genres
  - Cuisine types and categories
  - Geographic information
  - Ratings and feedback
  - Key takeaways and insights

### 4. `vector_store.py` - Vector Database
- ChromaDB integration for persistent storage
- Semantic search capabilities using sentence transformers
- Metadata indexing for efficient retrieval
- Support for place name, genre, and semantic queries

### 5. `app.py` - Web Application
- Flask-based web interface
- Video upload and URL processing
- Real-time search and browsing
- Responsive design with modern UI
- RESTful API endpoints

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-information-extractor
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export GOOGLE_API_KEY="your_google_maps_api_key"
export OPENAI_API_KEY="your_openai_api_key"
```

## Usage

### Web Interface (Recommended)
Start the web application:
```bash
python3 run_app.py
```

Then open your browser to `http://localhost:8080` to access the web interface.

### Command Line Interface
```bash
# Process a video URL
python3 agent.py --url "https://www.instagram.com/reel/..." --out result.json

# Skip vector database storage
python3 agent.py --url "https://www.instagram.com/reel/..." --out result.json --no-vector-store

# Search stored places
python3 search_places.py "Chinese restaurant with good atmosphere"
python3 search_places.py "China Pearl" --by-name
python3 search_places.py "restaurant" --by-genre
python3 search_places.py --stats
```

### Supported Platforms
- Instagram Reels
- TikTok
- YouTube Shorts
- Other platforms supported by yt-dlp

## Web Interface Features

### Home Page (`/`)
- **Video Upload**: Drag and drop or browse for video files
- **URL Processing**: Enter video URLs from social media platforms
- **Real-time Results**: View extracted information immediately
- **Statistics Dashboard**: See database overview and recent places

### Search Page (`/search`)
- **Semantic Search**: Find places using natural language
- **Filtered Search**: Search by place name or genre
- **Search Examples**: Quick access to common queries
- **Similarity Scoring**: Results ranked by relevance

### Places Page (`/places`)
- **Browse All Places**: View all stored places with pagination
- **Advanced Filtering**: Filter by genre, sort by various criteria
- **Responsive Grid**: Beautiful card-based layout
- **Quick Search**: Search bar for filtering results

## Output Format

The system generates a structured JSON output with:

```json
{
  "activities": [
    {
      "place_name": "Restaurant Name",
      "genre": "restaurant",
      "category_detail": "Italian",
      "address": "123 Main St, City, State, Country",
      "key_takeaways": [
        "Must-order: Pasta dish",
        "Great atmosphere for dates",
        "Reservations recommended"
      ]
    }
  ]
}
```

## Vector Database Features

### Storage
- Automatic storage of extracted place information
- Metadata indexing for efficient queries
- Source URL tracking for video references

### Search Capabilities
- **Semantic search**: Find places using natural language descriptions
- **Exact name matching**: Search by specific place names
- **Genre filtering**: Find places by category (restaurant, activity, etc.)
- **Similarity scoring**: Results ranked by relevance

### Example Searches
```bash
# Find romantic restaurants
python3 search_places.py "romantic date night restaurant"

# Find outdoor activities
python3 search_places.py "outdoor adventure activities"

# Find specific cuisine
python3 search_places.py "authentic Italian food"

# Find places with good service
python3 search_places.py "excellent customer service"
```

## Dependencies

- `openai` - LLM API access
- `whisperx` - Speech transcription
- `pytesseract` - OCR processing
- `opencv-python` - Video frame extraction
- `yt-dlp` - Video downloading
- `googlemaps` - Geocoding
- `pydantic` - Data validation
- `tqdm` - Progress bars
- `chromadb` - Vector database
- `sentence-transformers` - Semantic embeddings
- `flask` - Web framework
- `werkzeug` - WSGI utilities

## Configuration

The system can be configured through environment variables:
- `GOOGLE_API_KEY`: Required for geocoding functionality
- `OPENAI_API_KEY`: Required for LLM processing
- `FLASK_ENV`: Set to 'production' for production deployment
- `SECRET_KEY`: Flask secret key for session management

## Data Storage

The vector database is stored locally in the `./chroma_db` directory. This includes:
- Embeddings for semantic search
- Metadata for each stored place
- Index files for efficient retrieval

## API Endpoints

The web application provides the following REST API endpoints:

- `GET /` - Main application page
- `GET /search` - Search interface
- `GET /places` - Places browsing interface
- `POST /upload` - Upload and process video files
- `POST /process-url` - Process videos from URLs
- `GET /search?q=query` - Search API
- `GET /places?page=1&per_page=20` - Places API with pagination
- `GET /stats` - Database statistics
- `GET /api/health` - Health check

## Development

To run the application in development mode:
```bash
python3 run_app.py
```

The application will be available at `http://localhost:8080` with auto-reload enabled.

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 