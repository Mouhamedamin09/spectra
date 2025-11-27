# MovieBox API Documentation

Complete documentation for all API endpoints used by the movie streaming webapp.

## Base URLs

- **Frontend**: `http://localhost:5000`
- **MovieBox API**: `https://moviebox.ph/wefeed-h5-bff`
- **Streaming API**: `https://api.s1.bunny-stream.shop`

---

## 1. Search Movies

**Endpoint**: `POST https://moviebox.ph/wefeed-h5-bff/web/subject/search`

**Headers**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Content-Type: application/json
Origin: https://moviebox.ph
Referer: https://moviebox.ph/web/searchResult?keyword={query}
x-client-info: {"timezone":"Europe/Paris"}
Cookie: account=...; uuid=...; _ga=...
```

**Request Body**:
```json
{
  "keyword": "attack",
  "page": 1,
  "perPage": 0,
  "subjectType": 0
}
```

**Parameters**:
- `keyword` (string): Search query
- `page` (integer): Page number (starts at 1)
- `perPage` (integer): Results per page (0 = default ~24)
- `subjectType` (integer): Content type (0 = all, 1 = movie, 2 = series)

**Response**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "pager": {
      "hasMore": true,
      "nextPage": "2",
      "page": "1",
      "perPage": 24,
      "totalCount": 237
    },
    "items": [
      {
        "subjectId": "5838326801264690216",
        "subjectType": 1,
        "title": "Attack of the Adult Babies",
        "description": "",
        "releaseDate": "2017-09-25",
        "duration": 5040,
        "genre": "Horror",
        "cover": {
          "url": "https://pbcdnw.aoneroom.com/image/...",
          "width": 416,
          "height": 586
        },
        "countryName": "United Kingdom",
        "imdbRatingValue": "4.2",
        "hasResource": true,
        "detailPath": "attack-of-the-adult-babies-WX35Am7BhX6"
      }
    ]
  }
}
```

**Important Fields**:
- `subjectId`: Required for streaming
- `detailPath`: URL slug
- `hasResource`: true = can stream
- `cover.url`: Poster image

---

## 2. Get Stream URL

**Endpoint**: `GET https://api.s1.bunny-stream.shop/media/previewInfo`

**Query Parameters**:
```
category: 0
contentId: {subjectId}
episodeId: (empty for movies)
definition: 2
```

**Headers**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Cookie: account=...; uuid=...; _ga=...
```

**Response**:
```json
{
  "data": {
    "businessType": 1,
    "episodeId": "",
    "currentDefinition": 2,
    "hasResource": true,
    "mediaUrl": "https://bcdnxw.hakunaymatata.com/cms/xxx.mp4?sign=xxx",
    "totalDuration": 5280,
    "qualities": [
      {
        "category": 0,
        "code": 2,
        "description": "720",
        "hidden": false
      }
    ]
  },
  "code": "0000"
}
```

**Important Fields**:
- `mediaUrl`: The actual video stream URL
- `currentDefinition`: Quality (1=480p, 2=720p, 3=1080p)
- `totalDuration`: Video length in seconds

**Definition Codes**:
- `1` = 480p (SD)
- `2` = 720p (HD)
- `3` = 1080p (FHD)
- `4` = 4K

---

## 3. Our Flask API Endpoints

### 3.1 Search Movies

**Endpoint**: `GET http://localhost:5000/api/search`

**Query Parameters**:
- `q` (required): Search query
- `page` (optional): Page number (default: 1)

**Example**:
```
GET /api/search?q=attack
```

**Response**:
```json
{
  "results": [
    {
      "title": "Attack of the Adult Babies",
      "slug": "attack-of-the-adult-babies-WX35Am7BhX6",
      "subjectId": "5838326801264690216",
      "image": "https://pbcdnw.aoneroom.com/image/...",
      "url": "https://moviebox.ph/detail/...",
      "rating": "4.2",
      "year": "2017",
      "genre": "Horror",
      "description": ""
    }
  ],
  "query": "attack",
  "page": 1,
  "hasMore": true,
  "total": 237
}
```

### 3.2 Get Stream URL

**Endpoint**: `GET http://localhost:5000/api/stream/{slug}/{subject_id}`

**Example**:
```
GET /api/stream/attack-of-the-adult-babies-WX35Am7BhX6/5838326801264690216
```

**Response**:
```json
{
  "url": "https://bcdnxw.hakunaymatata.com/cms/xxx.mp4?sign=xxx",
  "resolution": "720",
  "duration_seconds": 5280,
  "format": "MP4"
}
```

### 3.3 Get Subject ID (Deprecated - Not Needed)

Subject IDs now come directly from search results, so this endpoint is no longer needed.

---

## 4. Cookie Management

**Required Cookies**:

```
account={19-digit-number}|0|H5|{future-timestamp}|
uuid={uuid-v4}
_ga=GA1.1.{random-number}.{timestamp}
```

**Generation**:
- `account`: Format `{random_19_digits}|0|H5|{timestamp_30_days_future}|`
- `uuid`: Standard UUID v4
- `_ga`: Google Analytics format

**Auto-Refresh**:
- Cookies expire after ~30 days
- Session manager automatically regenerates when expired
- All API calls use the same session with fresh cookies

---

## 5. Error Codes

**MovieBox API**:
- `code: 0` = Success
- `code: 400` = Bad request (check payload format)
- `code: 404` = Not found

**Streaming API**:
- `code: "0000"` = Success
- `hasResource: false` = No stream available

---

## 6. Rate Limiting

No rate limiting observed, but recommended:
- Max 1 request per second for search
- Use session cookies (don't regenerate for each request)

---

## 7. CORS Notes

- MovieBox API: Allows `Origin: https://moviebox.ph`
- For localhost development: Flask-CORS enabled
- Video URLs: May have CORS restrictions in browser

---

## Implementation Notes

1. **Always check `hasResource: true`** before attempting to stream
2. **Subject IDs are required** for streaming - get from search results
3. **Cookies must be fresh** - regenerate if API returns 401/403
4. **Video URLs expire** - they have signed tokens that expire
5. **Definition 2 (720p)** works most reliably

---

## Testing

```bash
# Test search
curl -X POST https://moviebox.ph/wefeed-h5-bff/web/subject/search \
  -H "Content-Type: application/json" \
  -H "x-client-info: {\"timezone\":\"Europe/Paris\"}" \
  -d '{"keyword":"attack","page":1,"perPage":0,"subjectType":0}'

# Test our Flask API
curl "http://localhost:5000/api/search?q=attack"
```
