# Video Information Extractor

An advanced information extraction system for short-form videos (Instagram Reels, TikTok, YouTube Shorts) that extracts structured data about places and activities featured in the content.

## Features

- **Multi-source processing**: Combines speech transcription, OCR text, and captions for comprehensive information extraction
- **Place identification**: Extracts place names, genres, and detailed categorization
- **Geographic data**: Captures addresses and location information
- **Feedback analysis**: Extracts ratings, reviews, and key takeaways
- **Compilation support**: Handles videos featuring multiple places/activities
- **Geocoding**: Optional Google Maps integration for address validation

## Architecture

The system consists of three main components:

### 1. `agent.py` - Main Orchestrator
- Downloads videos from various platforms
- Coordinates speech/OCR/caption processing
- Manages the LLM parsing pipeline
- Handles geocoding and data formatting

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

## Dependencies

- `openai` - LLM API access
- `whisperx` - Speech transcription
- `pytesseract` - OCR processing
- `opencv-python` - Video frame extraction
- `yt-dlp` - Video downloading
- `googlemaps` - Geocoding
- `pydantic` - Data validation
- `tqdm` - Progress bars

## Configuration

The system can be configured through environment variables:
- `GOOGLE_API_KEY`: Required for geocoding functionality
- `OPENAI_API_KEY`: Required for LLM processing

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 