# How to Find the Correct Streaming API

## Steps to Get Network Logs for Streaming:

1. **Open Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I`
   - Go to the **Network** tab
   - Check "Preserve log"

2. **Clear Previous Logs**:
   - Click the clear button (🚫) in the Network tab

3. **Navigate and Play**:
   - Go to https://moviebox.ph/web/searchResult?keyword=attack
   - Click on a movie (e.g., "Attack of the Adult Babies")
   - Click the "Watch now" button or play button

4. **Find the API Call**:
   - Look for requests containing "play", "stream", "preview", or "media"
   - Filter by `XHR` or `Fetch` type
   - Look for API endpoints (not `.mp4` files)

5. **Get the Details**:
   - Click on the request
   - Copy the **Request URL**
   - Copy the **Request Headers**
   - Copy the **Request Payload** (if POST)
   - Copy the **Response**

## What to Look For:

- Endpoint URL (probably contains "play", "stream", or "preview")
- HTTP method (GET or POST)
- Query parameters or request body
- Required headers (especially cookies, x-client-info, etc.)
- Response format

## Current Known Endpoints:

Old (might not work):
```
GET https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={id}&se=1&ep=1&detail_path={slug}
```

Possible new endpoints to check:
```
GET https://moviebox.ph/wefeed-h5-bff/web/subject/play
GET https://api.s1.bunny-stream.shop/media/previewInfo  
GET https://moviebox.ph/wefeed-h5-bff/media/previewInfo
```

## Share With Me:

Once you have the network log, share:
1. Request URL
2. Request Method (GET/POST)
3. Headers
4. Payload (if any)
5. Response JSON

Then I can update the code to use the correct endpoint!
