from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, validator, root_validator, Field
import json


SYSTEM = """
    
You are an advanced information extraction agent.

You will be given mixed *speech transcription, **OCR text, and **captions* from a short-form video (e.g., Instagram Reels, TikTok, YouTube Shorts). Your task is to carefully extract structured information.  
*Prioritize captions* when filling in the different data points about the reel.

Follow this step-by-step:

---

*1. Detect the Primary Content Type of the Video:*
•⁠  ⁠Classify the video by what kind of Activity (e.g., visiting a restaurant, event, hiking, shopping, sightseeing)

---

*2. If the video is a Compilation:*
•⁠  ⁠Extract information *separately for each major place/activity* featured.
•⁠  ⁠Each activity should have its own extracted fields as described below.

---

*3. For each activity/place (single video or each item in a compilation), extract:*

•⁠  ⁠*PLACE_NAME*: The name of the primary place or event (e.g., "Central Park," "Joe's Pizza," "Coachella Festival").

•⁠  ⁠*GENRE*: Classify the place or event into one of these genres:
  - restaurant, cafe, bar, bakery, museum, landmark, park, hike, hotel, shopping, event, nightlife, wellness, transportation, experience, other (specify if none fit)

•⁠  ⁠*CUISINE (if restaurant/cafe/bar/bakery)*: Specify the cuisine type (e.g., Italian, Japanese, fusion).

•⁠  ⁠*VIBES*: Describe the atmosphere (e.g., cozy, upscale, casual, family-friendly, romantic, party, nature-filled).

•⁠  ⁠*ACTIVITIES* (if event, hotel, park, experience): List any specific activities mentioned (e.g., hiking, spa, concert).

•⁠  ⁠*AVAILABILITY*: Extract available geographic information:
  - Street address (if stated)
  - City
  - County
  - State/Province
  - Country
  - Region/Area (e.g., "Bali", "the Amalfi Coast")
  - Prioritize filling these fields based on captions first, then speech, then OCR.

•⁠  ⁠*SOURCES*: Specify whether the information came from:
  - speech
  - OCR
  - captions
  - multiple sources

•⁠  ⁠*RATINGS_FEEDBACK*: If the creator provides any reactions or evaluations, capture:
  - service_feedback: Feedback on staff quality, speed, professionalism
  - food_feedback: General comments about food quality
  - vibes_feedback: Opinions about decor, noise, crowd, atmosphere
  - miscellaneous_feedback: Other impressions not fitting the above

•⁠  ⁠*DISHES*: For food-related places, extract dishes mentioned with:
  - dish_name
  - mentioned: whether explicitly mentioned (true/false)
  - shown: whether visually shown (true/false)
  - feedback: any associated feedback

•⁠  ⁠*CONFIDENCE*: For each extracted field, assign a confidence score from 0.0 (low) to 1.0 (high)

---

*4. Ratings and Feedback Extraction:*
If the creator provides any reactions or evaluations, capture the following:

•⁠  ⁠*SERVICE_FEEDBACK*: Feedback on staff quality, speed, professionalism, attentiveness.
•⁠  ⁠*FOOD_FEEDBACK*: General comments about food quality, without duplicating specific dish feedback.
•⁠  ⁠*VIBES_FEEDBACK*: Opinions about decor, noise, crowd, atmosphere.
•⁠  ⁠*MISCELLANEOUS_FEEDBACK*: Other impressions not fitting the above.

*Important:*  
•⁠  ⁠*Do not duplicate feedback between general food and specific dishes.*  
•⁠  ⁠Focus general food feedback only if not tied to a particular dish.

---

*5. Dishes Extraction:*
For food-related places:
•⁠  ⁠Extract a *single unified list* of all *dishes shown and/or mentioned*, with:
  - Dish name
  - Whether it was *explicitly mentioned* in speech/caption (yes/no)
  - Whether it was *visually shown* in the video (yes/no)
  - Any associated feedback (taste, texture, temperature, sauce, plating)
  
•⁠  ⁠*Dishes explicitly mentioned but not visually shown* should be clearly marked.

Example Dish Record:
⁠ json
{
  "dish_name": "Spaghetti Carbonara",
  "mentioned": true,
  "shown": false,
  "feedback": "Rich and creamy sauce"
}
 ⁠

*6. Smart Location Refinement:*
•⁠  ⁠If sub-location hints (e.g., "Tokyo Station") are available, use them to refine Google Maps lookup.
•⁠  ⁠Populate street, city, state, and country fields only if they were missing.
•⁠  ⁠If Google Maps returns different info than what was extracted, save both:
  - ⁠ location_from_video ⁠
  - ⁠ location_from_google_maps ⁠

---

*8. Final Output Format:*
Return the result as a JSON object with the following top-level fields:
- content_type: The primary content type of the video
- activities: An array of activity objects, each with the detailed fields described above

Each activity object should include:
- place_name: The name of the place
- genre: The genre classification
- cuisine: Cuisine type (for restaurants/cafes/bars/bakeries)
- vibes: Atmosphere description
- activities: List of specific activities
- availability: Geographic information (street_address, city, county, state, country, region)
- sources: Information sources used
- ratings_feedback: Feedback categories (service_feedback, food_feedback, vibes_feedback, miscellaneous_feedback)
- dishes: Dish information (explicitly_mentioned, visually_shown)
- confidence: Confidence scores for each field
- key_takeaways: 3-6 concise, actionable insights or tips for this specific place/activity

IMPORTANT: Ensure each field has its corresponding value. Never leave required fields empty.


*Additional Extraction Requirement:*
•⁠  ⁠*KEY_TAKEAWAYS*: Provide 3–6 concise, actionable insights or tips drawn from the overall feedback and observations (e.g., "Must‑order: Pork belly ramen", "Go at sunset for best views"). Include these within each activity object.
"""


class Availability(BaseModel):
    street_address: Optional[str] = ""
    city: Optional[str] = ""
    county: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    region: Optional[str] = ""


class SpecificDishFeedback(BaseModel):
    dish_name: str
    feedback: Optional[str] = None


class RatingsFeedback(BaseModel):
    service_feedback: Optional[str] = None
    food_feedback: Optional[str] = None
    specific_dish_feedback: List[SpecificDishFeedback] = Field(default_factory=list)
    vibes_feedback: Optional[str] = None
    miscellaneous_feedback: Optional[str] = None


class ConfidenceScores(BaseModel):
    place_name: float = 0.0
    genre: float = 0.0
    cuisine: float = 0.0
    vibes: float = 0.0
    activities: float = 0.0
    availability: float = 0.0
    ratings_feedback: float = 0.0
    dishes: float = 0.0


class DishEntry(BaseModel):
    dish_name: str
    mentioned: Optional[bool] = False
    shown: Optional[bool] = False
    feedback: Optional[str] = None


class DishesInfo(BaseModel):
    explicitly_mentioned: List[DishEntry] = Field(default_factory=list)
    visually_shown: List[DishEntry] = Field(default_factory=list)


class PlaceInfo(BaseModel):
    place_name: str
    genre: str
    cuisine: Optional[str] = None
    vibes: Optional[str] = None
    activities: List[str] = Field(default_factory=list)
    key_takeaways: List[str] = Field(default_factory=list)
    availability: Availability = Field(default_factory=Availability)
    sources: List[str] = Field(default_factory=list)
    ratings_feedback: RatingsFeedback = Field(default_factory=RatingsFeedback)
    dishes: Union[DishesInfo, List[DishEntry]] = Field(default_factory=DishesInfo)
    confidence: ConfidenceScores = Field(default_factory=ConfidenceScores)

    @validator("sources", pre=True)
    def ensure_sources_is_list(cls, v):
        if isinstance(v, str):
            return [v]
        return v or []

    @validator("activities", pre=True)
    def ensure_activities_is_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v

    @validator("key_takeaways", pre=True)
    def ensure_key_takeaways_is_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v

    @validator("dishes", pre=True)
    def normalize_dishes(cls, v):
        if isinstance(v, list):
            # Convert list to DishesInfo
            explicitly_mentioned = [
                d for d in v if isinstance(d, dict) and d.get("mentioned", False)
            ]
            visually_shown = [
                d for d in v if isinstance(d, dict) and d.get("shown", False)
            ]
            return {
                "explicitly_mentioned": explicitly_mentioned,
                "visually_shown": visually_shown,
            }
        return v or {"explicitly_mentioned": [], "visually_shown": []}


class Compilation(BaseModel):
    content_type: str = "Compilation"  # Default value
    activities: List[PlaceInfo] = Field(default_factory=list)

    @root_validator(pre=True)
    def extract_activities(cls, values):
        # Handle case where there's no "activities" key but there's primary_content_type
        if "activities" not in values and "primary_content_type" in values:
            values["content_type"] = values.pop("primary_content_type")

        # Handle single activity case
        if "place_name" in values and "activities" not in values:
            values["activities"] = [values.copy()]

        return values


def normalize_keys(d):
    """Recursively normalize dictionary keys to lowercase."""
    if isinstance(d, dict):
        return {k.lower(): normalize_keys(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [normalize_keys(v) for v in d]
    else:
        return d


def ensure_required_fields(data):
    """Ensures all required fields are present in the data."""
    # Ensure content_type exists
    if "content_type" not in data:
        if "primary_content_type" in data:
            data["content_type"] = data.pop("primary_content_type")
        else:
            data["content_type"] = "Compilation"

    # Handle top-level key_takeaways
    top_level_takeaways = data.get("key_takeaways", [])
    if isinstance(top_level_takeaways, str):
        top_level_takeaways = [top_level_takeaways]

    # Ensure activities exists
    if "activities" not in data:
        # If there's a place_name but no activities, this is a single activity
        if "place_name" in data:
            data["activities"] = [data.copy()]
        else:
            data["activities"] = []

    # Ensure each activity has required fields
    for activity in data.get("activities", []):
        # Ensure key_takeaways exists - use top-level if not present in activity
        if "key_takeaways" not in activity or not activity["key_takeaways"]:
            activity["key_takeaways"] = top_level_takeaways
        elif isinstance(activity["key_takeaways"], str):
            activity["key_takeaways"] = [activity["key_takeaways"]]

        # Ensure availability has all required fields
        if "availability" not in activity:
            activity["availability"] = {}

        avail = activity["availability"]
        for field in ["street_address", "city", "county", "state", "country", "region"]:
            if field not in avail:
                avail[field] = ""

        # Ensure confidence scores
        if "confidence" not in activity:
            activity["confidence"] = {}

        conf = activity["confidence"]
        for field in [
            "place_name",
            "genre",
            "cuisine",
            "vibes",
            "activities",
            "availability",
            "ratings_feedback",
            "dishes",
        ]:
            if field not in conf:
                conf[field] = 0.0

        # Ensure ratings_feedback
        if "ratings_feedback" not in activity:
            activity["ratings_feedback"] = {
                "service_feedback": None,
                "food_feedback": None,
                "specific_dish_feedback": [],
                "vibes_feedback": None,
                "miscellaneous_feedback": None,
            }

    return data


def parse_place_info(text: str) -> Compilation:
    import openai
    import json

    client = openai.OpenAI()

    # Call LLM
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": text[:8000]},
        ],
        response_format={"type": "json_object"},
    )

    # Attempt to parse output as JSON
    try:
        data = json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        print("❌ Failed to parse JSON from LLM output:")
        print("Raw content:\n", resp.choices[0].message.content)
        raise ValueError("Input string to parse_place_info is not valid JSON")

    # Normalize keys to lowercase
    data = normalize_keys(data)

    # Ensure all required fields exist
    data = ensure_required_fields(data)

    # Print the normalized data for debugging
    print("Normalized data structure before model validation:")
    print(json.dumps(data, indent=2))

    try:
        return Compilation(**data)
    except Exception as e:
        print(f"Error creating Compilation model: {e}")
        # Attempt to create a minimal valid Compilation
        return Compilation(content_type="Error", activities=[])
