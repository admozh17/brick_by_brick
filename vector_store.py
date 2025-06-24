#!/usr/bin/env python3
"""Vector Database Storage for Info-Extractor Results
----------------------------------------------------
Uses ChromaDB to store and retrieve place information with semantic search capabilities.
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


class VectorStore:
    """Vector database for storing and retrieving place information."""

    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize the vector store with ChromaDB."""
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(exist_ok=True)

        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(anonymized_telemetry=False),
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="place_info",
            metadata={"description": "Place information extracted from videos"},
        )

        # Initialize sentence transformer for embeddings
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    def _create_document_text(self, activity: Dict[str, Any]) -> str:
        """Create a searchable text document from activity data."""
        parts = []

        # Basic info
        if activity.get("place_name"):
            parts.append(f"Place: {activity['place_name']}")

        if activity.get("genre"):
            parts.append(f"Genre: {activity['genre']}")

        if activity.get("category_detail"):
            parts.append(f"Category: {activity['category_detail']}")

        if activity.get("address"):
            parts.append(f"Address: {activity['address']}")

        # Key takeaways
        takeaways = activity.get("key_takeaways", [])
        if takeaways:
            parts.append("Key points: " + ". ".join(takeaways))

        return " | ".join(parts)

    def _create_metadata(
        self, activity: Dict[str, Any], source_url: str = None
    ) -> Dict[str, Any]:
        """Create metadata for the vector store entry."""
        metadata = {
            "place_name": activity.get("place_name", ""),
            "genre": activity.get("genre", ""),
            "category_detail": activity.get("category_detail", ""),
            "address": activity.get("address", ""),
            "takeaways_count": len(activity.get("key_takeaways", [])),
            "timestamp": datetime.now().isoformat(),
        }

        if source_url:
            metadata["source_url"] = source_url

        return metadata

    def store_results(
        self, results: Dict[str, Any], source_url: str = None
    ) -> List[str]:
        """Store results in the vector database.

        Args:
            results: Dictionary containing activities data
            source_url: Optional source URL of the video

        Returns:
            List of document IDs that were stored
        """
        activities = results.get("activities", [])
        if not activities:
            return []

        document_ids = []
        documents = []
        metadatas = []

        for activity in activities:
            # Create unique ID
            doc_id = str(uuid.uuid4())
            document_ids.append(doc_id)

            # Create searchable text
            doc_text = self._create_document_text(activity)
            documents.append(doc_text)

            # Create metadata
            metadata = self._create_metadata(activity, source_url)
            metadatas.append(metadata)

        # Add to collection
        self.collection.add(documents=documents, metadatas=metadatas, ids=document_ids)

        print(f"✅ Stored {len(activities)} activities in vector database")
        return document_ids

    def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for places using semantic similarity.

        Args:
            query: Search query
            n_results: Number of results to return

        Returns:
            List of matching activities with metadata and scores
        """
        results = self.collection.query(query_texts=[query], n_results=n_results)

        matches = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                match = {
                    "document": doc,
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i]
                    if results["distances"]
                    else None,
                    "id": results["ids"][0][i],
                }
                matches.append(match)

        return matches

    def search_by_place_name(
        self, place_name: str, n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for places by name using exact matching."""
        results = self.collection.query(
            query_texts=[f"Place: {place_name}"], n_results=n_results
        )

        matches = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                match = {
                    "document": doc,
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i]
                    if results["distances"]
                    else None,
                    "id": results["ids"][0][i],
                }
                matches.append(match)

        return matches

    def search_by_genre(self, genre: str, n_results: int = 10) -> List[Dict[str, Any]]:
        """Search for places by genre."""
        results = self.collection.query(
            query_texts=[f"Genre: {genre}"], n_results=n_results
        )

        matches = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                match = {
                    "document": doc,
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i]
                    if results["distances"]
                    else None,
                    "id": results["ids"][0][i],
                }
                matches.append(match)

        return matches

    def get_all_places(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all stored places (up to limit)."""
        results = self.collection.get(limit=limit)

        places = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"]):
                place = {
                    "document": doc,
                    "metadata": results["metadatas"][i],
                    "id": results["ids"][i],
                }
                places.append(place)

        return places

    def delete_place(self, place_id: str) -> bool:
        """Delete a specific place by ID."""
        try:
            self.collection.delete(ids=[place_id])
            return True
        except Exception as e:
            print(f"Error deleting place {place_id}: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the stored data."""
        try:
            count = self.collection.count()

            # Get sample data for analysis
            sample = self.collection.get(limit=100)

            genres = {}
            if sample["metadatas"]:
                for metadata in sample["metadatas"]:
                    genre = metadata.get("genre", "unknown")
                    genres[genre] = genres.get(genre, 0) + 1

            return {
                "total_places": count,
                "genre_distribution": genres,
                "sample_size": len(sample["metadatas"]) if sample["metadatas"] else 0,
            }
        except Exception as e:
            return {"error": str(e)}


# Convenience functions for easy usage
def store_results_from_file(json_file: str, source_url: str = None) -> List[str]:
    """Store results from a JSON file."""
    with open(json_file, "r") as f:
        results = json.load(f)

    store = VectorStore()
    return store.store_results(results, source_url)


def search_places(query: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Search for places using a query."""
    store = VectorStore()
    return store.search(query, n_results)


if __name__ == "__main__":
    # Example usage
    store = VectorStore()

    # Example: Store results from result.json
    try:
        doc_ids = store_results_from_file("result.json")
        print(f"Stored documents with IDs: {doc_ids}")

        # Example: Search for Chinese restaurants
        results = search_places("Chinese restaurant", 3)
        print("\nSearch results for 'Chinese restaurant':")
        for result in results:
            print(
                f"- {result['metadata']['place_name']} ({result['metadata']['genre']})"
            )
            print(f"  Score: {result['distance']:.3f}")
            print()

        # Get stats
        stats = store.get_stats()
        print(f"Database stats: {stats}")

    except FileNotFoundError:
        print("No result.json file found. Run the agent first to generate results.")
