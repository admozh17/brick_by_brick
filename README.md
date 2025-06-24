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

## Architecture

The system consists of four main components:

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

### Basic Usage
```bash
python agent.py --url "https://www.instagram.com/reel/..." --out result.json
```

### Skip Vector Database Storage
```bash
python agent.py --url "https://www.instagram.com/reel/..." --out result.json --no-vector-store
```

### Search Stored Places
```bash
# Semantic search
python search_places.py "Chinese restaurant with good atmosphere"

# Search by place name
python search_places.py "China Pearl" --by-name

# Search by genre
python search_places.py "restaurant" --by-genre

# Show database statistics
python search_places.py --stats

# Get JSON output
python search_places.py "pizza" --json
```

### Supported Platforms
- Instagram Reels
- TikTok
- YouTube Shorts
- Other platforms supported by yt-dlp

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
python search_places.py "romantic date night restaurant"

# Find outdoor activities
python search_places.py "outdoor adventure activities"

# Find specific cuisine
python search_places.py "authentic Italian food"

# Find places with good service
python search_places.py "excellent customer service"
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

## Configuration

The system can be configured through environment variables:
- `GOOGLE_API_KEY`: Required for geocoding functionality
- `OPENAI_API_KEY`: Required for LLM processing

## Data Storage

The vector database is stored locally in the `./chroma_db` directory. This includes:
- Embeddings for semantic search
- Metadata for each stored place
- Index files for efficient retrieval

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 