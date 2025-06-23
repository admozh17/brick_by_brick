import subprocess, os, pathlib, cv2, pytesseract, torch, googlemaps
import whisperx
from tqdm import tqdm
from yt_dlp import YoutubeDL


# ---------- Download ----------
def fetch_clip(url: str, out_path: pathlib.Path):
    """Download video via yt‑dlp (supports IG, TikTok, YT)."""
    cmd = ["yt-dlp", "-f", "mp4", "-o", str(out_path), url]
    subprocess.run(cmd, check=True)


# ---------- Speech ----------
def whisper_transcribe(video_path: pathlib.Path) -> str:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisperx.load_model(
        "large-v2",  # or "medium" / "small" for faster
        device=device,
        compute_type="float32",  # or "int8"
    )
    result = model.transcribe(str(video_path))
    return " ".join(seg["text"] for seg in result["segments"])


# ---------- OCR ----------
def _iter_frames(path: pathlib.Path, step_sec: float = 0.5):
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    step = int(step_sec * fps)
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % step == 0:
            yield frame
        i += 1
    cap.release()


def ocr_frames(video_path: pathlib.Path) -> str:
    texts = []
    for frame in tqdm(_iter_frames(video_path), desc="OCR"):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        txt = pytesseract.image_to_string(gray, lang="eng")
        if txt.strip():
            texts.append(txt)
    return " ".join(texts)


# ---------- Geocode (Updated) ----------
def geocode_place(place_name: str, genre: str = None, extra_hint: str = None):
    """Geocode a place using Google Maps API with optional genre and extra search hint."""
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        print("❗ No GOOGLE_API_KEY found in environment.")
        return {}

    gm = googlemaps.Client(key)

    query_parts = [place_name]
    if genre:
        query_parts.append(genre)
    if extra_hint:
        query_parts.append(extra_hint)

    query = " ".join(query_parts)

    try:
        res = gm.places(query)
    except Exception as e:
        print(f"❌ Geocoding error for {place_name}: {e}")
        return {}

    if not res.get("results"):
        return {}

    best = res["results"][0]
    loc = best["geometry"]["location"]

    return {
        "display_address": best.get("formatted_address"),
        "lat": loc["lat"],
        "lon": loc["lng"],
    }


# ---------- Captions ----------
def fetch_caption(url: str) -> str:
    """Return the caption/description text of a Reel, TikTok, or YT Short."""
    ydl_opts = {
        "skip_download": True,  # metadata only
        "quiet": True,
        "simulate": True,
        "forcejson": True,  # return info-dict
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        desc = info.get("description") or ""
        return desc
