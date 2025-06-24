#!/usr/bin/env python3
"""Example Usage of Vector Database
-----------------------------------
Demonstrates how to use the vector database functionality.
"""

import json
from vector_store import VectorStore, store_results_from_file, search_places


def main():
    print("🚀 Vector Database Example Usage")
    print("=" * 50)

    # Initialize vector store
    store = VectorStore()

    # Example 1: Store results from existing JSON file
    print("\n1. Storing results from result.json...")
    try:
        doc_ids = store_results_from_file("result.json")
        print(f"   ✅ Stored {len(doc_ids)} documents")
    except FileNotFoundError:
        print("   ⚠️ No result.json found - skipping storage example")

    # Example 2: Store some sample data
    print("\n2. Storing sample data...")
    sample_data = {
        "activities": [
            {
                "place_name": "Pizza Palace",
                "genre": "restaurant",
                "category_detail": "Italian",
                "address": "456 Oak St, New York, NY, USA",
                "key_takeaways": [
                    "Best pizza in the neighborhood",
                    "Great for family dining",
                    "Authentic Italian recipes",
                ],
            },
            {
                "place_name": "Adventure Park",
                "genre": "activity",
                "category_detail": "outdoor recreation",
                "address": "789 Forest Rd, Denver, CO, USA",
                "key_takeaways": [
                    "Perfect for hiking and camping",
                    "Beautiful mountain views",
                    "Family-friendly trails",
                ],
            },
        ]
    }

    doc_ids = store.store_results(sample_data, "https://example.com/sample-video")
    print(f"   ✅ Stored {len(doc_ids)} sample documents")

    # Example 3: Search examples
    print("\n3. Search Examples:")

    # Semantic search
    print("\n   🔍 Searching for 'Italian food'...")
    results = search_places("Italian food", 3)
    for i, result in enumerate(results, 1):
        print(
            f"   {i}. {result['metadata']['place_name']} - {result['metadata']['genre']}"
        )

    # Search by genre
    print("\n   🔍 Searching for 'activity' genre...")
    results = store.search_by_genre("activity", 3)
    for i, result in enumerate(results, 1):
        print(
            f"   {i}. {result['metadata']['place_name']} - {result['metadata']['category_detail']}"
        )

    # Search by place name
    print("\n   🔍 Searching for 'Pizza Palace'...")
    results = store.search_by_place_name("Pizza Palace", 3)
    for i, result in enumerate(results, 1):
        print(
            f"   {i}. {result['metadata']['place_name']} - {result['metadata']['address']}"
        )

    # Example 4: Get database statistics
    print("\n4. Database Statistics:")
    stats = store.get_stats()
    print(f"   Total places: {stats.get('total_places', 0)}")
    if "genre_distribution" in stats:
        print("   Genre distribution:")
        for genre, count in stats["genre_distribution"].items():
            print(f"     {genre}: {count}")

    # Example 5: Get all places
    print("\n5. All stored places:")
    all_places = store.get_all_places(limit=10)
    for i, place in enumerate(all_places, 1):
        print(
            f"   {i}. {place['metadata']['place_name']} ({place['metadata']['genre']})"
        )

    print("\n✅ Example completed!")
    print("\n💡 Try these commands:")
    print("   python search_places.py 'restaurant' --by-genre")
    print("   python search_places.py 'outdoor activities'")
    print("   python search_places.py --stats")


if __name__ == "__main__":
    main()
