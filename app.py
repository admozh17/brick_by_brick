#!/usr/bin/env python3
"""Video Information Extractor Web App
---------------------------------------
Flask web application for the video information extractor with vector database integration.
"""

import os
import json
import tempfile
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import uuid

from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS

from agent import run, build_summary
from vector_store import VectorStore, search_places

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "dev-secret-key-change-in-production"
)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100MB max file size

# Initialize vector store
vector_store = VectorStore()

# Ensure upload directory exists
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm"}

ALBUMS_FILE = Path("albums.json")


def load_albums():
    if ALBUMS_FILE.exists():
        with open(ALBUMS_FILE, "r") as f:
            return json.load(f)
    return []


def save_albums(albums):
    with open(ALBUMS_FILE, "w") as f:
        json.dump(albums, f)


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    """Main page with upload form and recent results."""
    # Get recent results from vector database
    recent_places = vector_store.get_all_places(limit=10)

    # Get database statistics
    stats = vector_store.get_stats()

    return render_template("index.html", recent_places=recent_places, stats=stats)


@app.route("/upload", methods=["POST"])
def upload_video():
    """Handle video upload and processing."""
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        file = request.files["video"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify(
                {
                    "error": "Invalid file type. Please upload MP4, AVI, MOV, MKV, or WEBM"
                }
            ), 400

        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        filepath = UPLOAD_FOLDER / safe_filename
        file.save(filepath)

        # Process the video
        result = run(str(filepath))

        if "error" in result:
            # Clean up uploaded file
            filepath.unlink(missing_ok=True)
            return jsonify({"error": result["error"]}), 500

        # Build summary and store in vector database
        summary = build_summary(result)
        doc_ids = vector_store.store_results(summary, f"uploaded:{safe_filename}")

        # Clean up uploaded file
        filepath.unlink(missing_ok=True)

        return jsonify(
            {
                "success": True,
                "result": summary,
                "doc_ids": doc_ids,
                "message": f"Successfully processed {len(summary['activities'])} places",
            }
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/process-url", methods=["POST"])
def process_url():
    """Process video from URL."""
    try:
        data = request.get_json()
        url = data.get("url")

        if not url:
            return jsonify({"error": "No URL provided"}), 400

        # Process the URL
        result = run(url)

        if "error" in result:
            return jsonify({"error": result["error"]}), 500

        # Build summary and store in vector database
        summary = build_summary(result)
        doc_ids = vector_store.store_results(summary, url)

        return jsonify(
            {
                "success": True,
                "result": summary,
                "doc_ids": doc_ids,
                "message": f"Successfully processed {len(summary['activities'])} places",
            }
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/search")
def search():
    """Search places in the database."""
    query = request.args.get("q", "")
    search_type = request.args.get("type", "semantic")  # semantic, name, genre
    limit = int(request.args.get("limit", 10))

    if not query:
        return jsonify({"error": "No search query provided"}), 400

    try:
        if search_type == "name":
            results = vector_store.search_by_place_name(query, limit)
        elif search_type == "genre":
            results = vector_store.search_by_genre(query, limit)
        else:
            results = vector_store.search(query, limit)

        return jsonify(
            {"success": True, "results": results, "query": query, "count": len(results)}
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stats")
def get_stats():
    """Get database statistics."""
    try:
        stats = vector_store.get_stats()
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/places")
def get_places():
    """Get all places with pagination."""
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    offset = (page - 1) * per_page

    try:
        all_places = vector_store.get_all_places(limit=per_page)
        total_count = vector_store.get_stats().get("total_places", 0)

        return jsonify(
            {
                "success": True,
                "places": all_places,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_count,
                    "pages": (total_count + per_page - 1) // per_page,
                },
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/place/<place_id>")
def get_place(place_id):
    """Get specific place details."""
    try:
        # This would need to be implemented in vector_store.py
        # For now, return a placeholder
        return jsonify(
            {
                "success": True,
                "place": {"id": place_id, "message": "Place details endpoint"},
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health_check():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "vector_db": "connected",
        }
    )


@app.route("/api/test", methods=["POST"])
def test_endpoint():
    """Test endpoint for mobile app connection."""
    try:
        data = request.get_json()
        return jsonify(
            {
                "success": True,
                "message": "Connection test successful",
                "received_data": data,
                "timestamp": datetime.now().isoformat(),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/search")
def search_page():
    """Search page."""
    return render_template("search.html")


@app.route("/places")
def places_page():
    """Places browsing page."""
    return render_template("places.html")


@app.route("/albums", methods=["GET"])
def get_albums():
    albums = load_albums()
    return jsonify({"success": True, "albums": albums})


@app.route("/albums", methods=["POST"])
def create_album():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"success": False, "error": "Album name required"}), 400
    albums = load_albums()
    album_id = str(uuid.uuid4())
    new_album = {"id": album_id, "name": name, "placeIds": []}
    albums.append(new_album)
    save_albums(albums)
    return jsonify({"success": True, "album": new_album})


@app.route("/albums/add_places", methods=["POST"])
def add_places_to_album():
    data = request.get_json()
    album_id = data.get("albumId")
    place_ids = data.get("placeIds", [])
    albums = load_albums()
    for album in albums:
        if album["id"] == album_id:
            album["placeIds"] = list(set(album["placeIds"] + place_ids))
            save_albums(albums)
            return jsonify({"success": True, "album": album})
    return jsonify({"success": False, "error": "Album not found"}), 404


@app.route("/albums/<album_id>", methods=["DELETE"])
def delete_album(album_id):
    albums = load_albums()
    new_albums = [a for a in albums if a["id"] != album_id]
    save_albums(new_albums)
    return jsonify({"success": True})


@app.route("/places/<place_id>", methods=["DELETE"])
def delete_place(place_id):
    print(f"API DELETE /places/{place_id} called")
    # Remove from vector DB
    try:
        vector_store.delete_place(place_id)
    except Exception as e:
        print(f"Error deleting from vector DB: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    # Remove from all albums
    albums = load_albums()
    for album in albums:
        album["placeIds"] = [pid for pid in album["placeIds"] if pid != place_id]
    save_albums(albums)
    print(f"Place {place_id} deleted successfully")
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
