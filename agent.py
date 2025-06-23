#!/usr/bin/env python3
"""Info‑Extractor Agent
--------------------------------
Orchestrates:
  • Video download
  • Speech/OCR/caption fusion
  • LLM parsing (llm_parser.py)
  • Optional geocoding (extractor.py helpers)

Then compacts the rich output into a *lean* summary JSON with:
  • place_name
  • genre (restaurant, activity, hotel, etc.)
  • category_detail (cuisine or activity subtype)
  • address
  • key_takeaways (short list)
"""

import argparse
import json
import pathlib
import tempfile
import traceback
import string
import collections
from typing import List, Dict, Any

from extractor import (
    fetch_clip,
    fetch_caption,
    whisper_transcribe,
    ocr_frames,
    geocode_place,
)
from llm_parser import parse_place_info


# --------------------------------------------------------------------------------------
# Helper functions
# --------------------------------------------------------------------------------------
def _format_address(avail: Dict[str, str]) -> str:
    """Concatenate whatever address fields are present into a single line."""
    parts = [
        avail.get("street_address"),
        avail.get("city"),
        avail.get("state") or avail.get("region"),
        avail.get("country"),
    ]
    return ", ".join(p for p in parts if p)


def _collect_takeaways(ratings: Dict[str, Any]) -> List[str]:
    """Flatten feedback buckets + dish feedback into one list."""
    takeaways: List[str] = []
    for key in (
        "service_feedback",
        "food_feedback",
        "vibes_feedback",
        "miscellaneous_feedback",
    ):
        val = ratings.get(key)
        if val:
            takeaways.append(val.strip())

    for dish in ratings.get("specific_dish_feedback", []):
        name = dish.get("dish_name") or "Dish"
        fb = dish.get("feedback")
        if fb:
            takeaways.append(f"{name}: {fb.strip()}")

    return takeaways


def _get_category_detail(act: Dict[str, Any]) -> str:
    """Return cuisine for restaurants or subtype for other activities."""
    # Common keys the LLM may produce
    for key in (
        "category_detail",
        "cuisine",
        "cuisine_type",
        "cuisine_style",
        "activity_type",
        "activity_subtype",
        "subtype",
    ):
        val = act.get(key)
        if val:
            return val
    return ""


def build_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert rich nested dict into lean summary schema."""
    summary_acts = []
    for act in data.get("activities", []):
        avail = act.get("availability", {}) or {}
        ratings = act.get("ratings_feedback", {}) or {}

        summary_acts.append(
            {
                "place_name": act.get("place_name"),
                "genre": act.get("genre"),
                "category_detail": _get_category_detail(act),
                "address": _format_address(avail),
                "key_takeaways": _collect_takeaways(ratings),
            }
        )
    return {"activities": summary_acts}


# --------------------------------------------------------------------------------------
# Core pipeline (unchanged heavy lifting)
# --------------------------------------------------------------------------------------
def run(url: str):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = pathlib.Path(tmp)
        clip_path = tmp_path / "clip.mp4"

        try:
            fetch_clip(url, clip_path)

            print("📝 Transcribing speech…")
            speech_text = whisper_transcribe(clip_path)

            print("👁️ OCR on frames…")
            frame_text = ocr_frames(clip_path)

            print("📄 Fetching caption…")
            caption_text = fetch_caption(url)

            fused_text = "\n".join(
                filter(
                    None,
                    [
                        f"SPEECH: {speech_text}" if speech_text else "",
                        f"OCR TEXT: {frame_text}" if frame_text else "",
                        f"CAPTION: {caption_text}" if caption_text else "",
                    ],
                )
            )
            print(f"🔹 Fused text len = {len(fused_text)}")

            print("🧠 Parsing via LLM…")
            info = parse_place_info(fused_text)

            print("🌍 Geocoding…")
            for activity in info.activities:
                if not activity.place_name:
                    continue

                if not activity.availability.street_address:
                    geo = geocode_place(
                        place_name=activity.place_name,
                        genre=activity.genre,
                        extra_hint=activity.availability.city,
                    )
                    if geo:
                        activity.availability.street_address = geo.get(
                            "display_address"
                        )
                        activity.availability.city = (
                            activity.availability.city or geo.get("city")
                        )
                        activity.availability.state = (
                            activity.availability.state or geo.get("state")
                        )
                        activity.availability.country = (
                            activity.availability.country or geo.get("country")
                        )
                        activity.availability.region = (
                            activity.availability.region or geo.get("region")
                        )

            rich = info.dict()
            rich["__fused_text"] = fused_text
            return rich

        except Exception as e:
            traceback.print_exc()
            return {"error": str(e), "content_type": "Error", "activities": []}


# --------------------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True, help="Reel / TikTok / Short URL")
    ap.add_argument("--out", default="result.json")
    args = ap.parse_args()

    try:
        rich_data = run(args.url)

        if "error" in rich_data:
            pathlib.Path(args.out).write_text(
                json.dumps(rich_data, indent=2, ensure_ascii=False)
            )
            print("⚠️ Completed with error – see JSON.")
            return

        summary = build_summary(rich_data)
        pathlib.Path(args.out).write_text(
            json.dumps(summary, indent=2, ensure_ascii=False)
        )

        print(f"✅ Wrote lean summary to {args.out}")
        for i, a in enumerate(summary["activities"], 1):
            print(
                f"  {i}. {a['place_name']} ({a['genre']} | {a['category_detail']}) – {len(a['key_takeaways'])} takeaways"
            )

    except Exception as e:
        traceback.print_exc()
        err = {"error": str(e), "content_type": "Error", "activities": []}
        pathlib.Path(args.out).write_text(json.dumps(err, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()


# Simple fallback generator if the LLM omitted key takeaways
_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "you",
    "are",
    "was",
    "were",
    "but",
    "have",
    "has",
    "had",
    "not",
    "just",
    "they",
    "their",
    "them",
    "then",
    "out",
    "all",
    "about",
    "into",
    "when",
    "what",
    "where",
    "which",
    "will",
    "would",
    "could",
    "should",
    "here",
    "there",
    "over",
    "under",
    "after",
    "before",
    "been",
    "much",
    "more",
    "very",
    "than",
    "also",
    "into",
    "onto",
    "off",
    "our",
    "one",
    "two",
    "three",
    "four",
}


def _fallback_takeaways(raw_text: str, k: int = 5) -> List[str]:
    """Return up to *k* high-frequency keywords from raw_text."""
    # Strip punctuation, lowercase, split
    translator = str.maketrans(string.punctuation, " " * len(string.punctuation))
    tokens = raw_text.translate(translator).lower().split()
    counts = collections.Counter(
        t for t in tokens if len(t) > 3 and t not in _STOPWORDS
    )
    if not counts:
        return []
    common = [w for w, _ in counts.most_common(k)]
    return common
