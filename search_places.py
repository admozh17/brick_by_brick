#!/usr/bin/env python3
"""Search Places in Vector Database
-----------------------------------
CLI tool for searching stored place information using semantic similarity.
"""

import argparse
import json
from typing import List, Dict, Any

from vector_store import VectorStore


def format_search_result(result: Dict[str, Any], show_document: bool = False) -> str:
    """Format a search result for display."""
    metadata = result["metadata"]
    distance = result.get("distance")

    lines = [
        f"📍 {metadata['place_name']}",
        f"   Genre: {metadata['genre']}",
        f"   Category: {metadata['category_detail']}",
        f"   Address: {metadata['address']}",
        f"   Takeaways: {metadata['takeaways_count']}",
    ]

    if distance is not None:
        lines.append(f"   Similarity: {1 - distance:.3f}")

    if metadata.get("source_url"):
        lines.append(f"   Source: {metadata['source_url']}")

    if show_document:
        lines.append(f"   Document: {result['document']}")

    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="Search places in vector database")
    ap.add_argument("query", nargs="?", help="Search query")
    ap.add_argument(
        "--limit", "-n", type=int, default=5, help="Number of results (default: 5)"
    )
    ap.add_argument("--by-name", action="store_true", help="Search by place name only")
    ap.add_argument("--by-genre", action="store_true", help="Search by genre only")
    ap.add_argument(
        "--show-document", action="store_true", help="Show full document text"
    )
    ap.add_argument("--json", action="store_true", help="Output as JSON")
    ap.add_argument("--stats", action="store_true", help="Show database statistics")

    args = ap.parse_args()

    store = VectorStore()

    if args.stats:
        stats = store.get_stats()
        if args.json:
            print(json.dumps(stats, indent=2))
        else:
            print("📊 Database Statistics:")
            print(f"   Total places: {stats.get('total_places', 0)}")
            if "genre_distribution" in stats:
                print("   Genre distribution:")
                for genre, count in stats["genre_distribution"].items():
                    print(f"     {genre}: {count}")
        return

    if not args.query:
        print("❌ Query is required unless using --stats")
        return

    # Perform search
    if args.by_name:
        results = store.search_by_place_name(args.query, args.limit)
    elif args.by_genre:
        results = store.search_by_genre(args.query, args.limit)
    else:
        results = store.search(args.query, args.limit)

    if not results:
        print("❌ No results found")
        return

    if args.json:
        # Output as JSON
        output = {"query": args.query, "results": results, "count": len(results)}
        print(json.dumps(output, indent=2))
    else:
        # Pretty print results
        print(f"🔍 Search results for '{args.query}' ({len(results)} found):")
        print("=" * 60)

        for i, result in enumerate(results, 1):
            print(f"\n{i}. {format_search_result(result, args.show_document)}")
            print("-" * 40)


if __name__ == "__main__":
    main()
