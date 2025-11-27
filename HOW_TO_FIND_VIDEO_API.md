# Finding the Video Stream API - Step by Step

## What I Found From Your Capture

✅ When you click "Watch Online", it redirects to:
```
https://lok-lok.cc/spa/videoPlayPage/movies/natural-disaster-arabic-Iu6LI2yUkW2?id=2468315697651272720&type=/movie/detail&lang=en
```

Most of the APIs you shared are **tracking/analytics** (not video streams).

---

## How to Find the ACTUAL Video Stream

### Step 1: Stay on the Video Player Page
After clicking "Watch Online", you should be on the `lok-lok.cc` player page. **Don't close it.**

### Step 2: In Network Tab, Filter for XHR/Fetch
- In the Network tab, click on **"Fetch/XHR"** filter (not "All")
- This shows only API calls, hiding images/scripts/tracking

### Step 3: Look for These Patterns
Search for API requests that have:
- URLs containing: `episode`, `video`, `media`, `stream`, `play`
- Domain might be different (not lok-lok.cc)
- Look for requests to domains like:
  - `api.` something
  - Contains `hisavana`, `aoneroom`, or similar

### Step 4: Click on Suspicious Requests
For each API request:
1. Click on it
2. Go to **"Preview"** or **"Response"** tab
3. Look for JSON responses containing:
   - `.m3u8` URLs (HLS streams) ← **MOST LIKELY**
   - `.mp4` URLs (direct video)
   - Fields like: `videoUrl`, `playUrl`, `streamUrl`, `mediaUrl`

### Step 5: What to Share
When you find a response with video URLs, share:
- The **Request URL** (the API endpoint)
- The **Response** (the JSON data)

---

## Example of What You're Looking For

A good API response will look something like:
```json
{
  "data": {
    "videoUrl": "https://something.com/video.m3u8",
    "qualities": [...]
  }
}
```

## If You Still Can't Find It

Try this:
1. Clear Network tab
2. **Refresh** the video player page (`lok-lok.cc`)
3. Let it load completely
4. Filter by "Fetch/XHR" 
5. Look through the requests one by one

The video URL API usually loads **after** the page, not during the initial page load.
