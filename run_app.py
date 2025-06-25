#!/usr/bin/env python3
"""Startup script for the Video Information Extractor Web App"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set environment variables if not already set
os.environ.setdefault("FLASK_ENV", "development")
os.environ.setdefault("FLASK_DEBUG", "1")

# Import and run the app
from app import app

if __name__ == "__main__":
    print("🚀 Starting Video Information Extractor Web App...")
    print("📍 Access the app at: http://localhost:8080")
    print("📝 Press Ctrl+C to stop the server")
    print("-" * 50)

    try:
        app.run(debug=True, host="0.0.0.0", port=8080)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
