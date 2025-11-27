# Investigation Needed: Actual Movie Stream URLs

## Current Issue
The scraper currently extracts `og:video:url` meta tags, which contain **trailer links**, not actual movie streaming URLs.

## What We Know
1. The actual movie streams are NOT in the initial HTML
2. They load dynamically when clicking "Watch Online"  
3. The batch scraper extracted 21 trailer links instead of movie streams

## Next Steps
**USER ACTION REQUIRED:**

To fix the scraper, I need to understand how the "Watch Online" button works. Please help by doing ONE of the following:

### Option 1: Check Network Tab
1. Open https://moviebox.ph/detail/natural-disaster-arabic-Iu6LI2yUkW2
2. Open Developer Tools (F12) → Network tab
3. Click "Watch Online" button
4. Look for API calls (likely to `/api/` or similar)
5. Share the API endpoint URL pattern and response

### Option 2: Share the API Details
If you already know:
- What API endpoint the Watch button calls
- The request format (GET/POST, parameters)
- How to extract the streaming URL from the response

## Impact
Once we have this information, I can update:
- `scraper.py` - to extract actual movie streams
- `batch_scraper.py` - to batch scrape real movies
- `movies.json` - will contain usable streaming links
