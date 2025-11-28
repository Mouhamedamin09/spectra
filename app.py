"""
Flask Backend for Movie Streaming Webapp
Provides API endpoints for searching movies and getting stream URLs
"""

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
from scraper_v2 import get_movie_stream
from session_manager import get_session_manager
from analytics_db import get_analytics_db
from cache_utils import cache_response, get_cache

app = Flask(__name__, static_folder='.')
CORS(app)  # Enable CORS for all routes

# ===== FORCE PROXY INITIALIZATION AT STARTUP =====
print("=" * 80)
print("🚀 INITIALIZING SESSION MANAGER AT STARTUP")
print("=" * 80)
from session_manager import get_session_manager
_startup_session = get_session_manager()
if hasattr(_startup_session, 'proxy_list'):
    print(f"✅ Loaded {len(_startup_session.proxy_list)} proxies at startup")
    if _startup_session.proxy_list:
        print(f"✅ First proxy: {_startup_session.proxy_list[0][:60]}")
    else:
        print("❌ ERROR: Proxy list is EMPTY!")
else:
    print("❌ ERROR: SessionManager has no proxy_list attribute!")
print("=" * 80)


@app.route('/')
def index():
    """Serve the main webpage"""
    return send_from_directory('.', 'index.html')


@app.route('/style.css')
def style():
    """Serve the CSS file"""
    return send_from_directory('.', 'style.css')


@app.route('/script.js')
def script():
    """Serve the JavaScript file"""
    return send_from_directory('.', 'script.js')



@app.route('/api/search')
def search():
    """
    Search for movies by name using the real moviebox API
    GET /api/search?q=attack
    """
    query = request.args.get('q', '').strip()
    page = int(request.args.get('page', '1'))
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    try:
        print(f"[*] Searching for: {query} (page {page})")
        
        # Get session manager for cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the real moviebox search API
        search_url = 'https://moviebox.ph/wefeed-h5-bff/web/subject/search'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://moviebox.ph',
            'Referer': f'https://moviebox.ph/web/searchResult?keyword={query}',
            'x-client-info': '{"timezone":"Europe/Paris"}'
        }
        
        # Request body - matching the actual API format
        payload = {
            'keyword': query,
            'page': page,
            'perPage': 0,  # 0 for default
            'subjectType': 0  # 0 for all types
        }
        
        print(f"[*] Payload: {payload}")
        
        response = session.post(search_url, json=payload, headers=headers, timeout=10)
        
        # Log response for debugging
        print(f"[*] Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"[*] Response body: {response.text[:500]}")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Check if successful
        if data.get('code') != 0:
            print(f"[-] API error: {data.get('message')}")
            return jsonify({'error': data.get('message', 'Search failed')}), 500
        
        # Extract movie data
        results = []
        items = data.get('data', {}).get('items', [])
        
        for item in items:
            # Only include if hasResource is True (has streaming available)
            if not item.get('hasResource', False):
                continue
                
            movie = {
                'title': item.get('title', 'Unknown'),
                'slug': item.get('detailPath', ''),
                'subjectId': item.get('subjectId', ''),
                'subjectType': item.get('subjectType'),
                'image': item.get('cover', {}).get('url', ''),
                'url': f'https://moviebox.ph/detail/{item.get("detailPath", "")}',
                'rating': item.get('imdbRatingValue', '0'),
                'year': item.get('releaseDate', '')[:4] if item.get('releaseDate') else '',
                'genre': item.get('genre', ''),
                'description': item.get('description', '')
            }
            results.append(movie)
        
        # Get pagination info
        pager = data.get('data', {}).get('pager', {})
        
        print(f"[+] Found {len(results)} results (total: {pager.get('totalCount', 0)})")
        
        return jsonify({
            'results': results,
            'query': query,
            'page': page,
            'hasMore': pager.get('hasMore', False),
            'total': pager.get('totalCount', 0)
        })
        
    except Exception as e:
        print(f"[-] Search error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



@app.route('/api/stream/<slug>/<subject_id>')
def stream(slug, subject_id):
    """
    Get stream URL for a movie or TV episode
    GET /api/stream/harvester-cM7asI5cHi4/3610296229948702968
    GET /api/stream/game-of-thrones-CR3bydu6Us6/5427084510527638448?se=1&ep=1
    """
    try:
        # Get optional season and episode for TV shows
        season = request.args.get('se', '0')
        episode = request.args.get('ep', '0')
        
        print(f"[*] Getting stream for: {slug} (ID: {subject_id}, S{season}E{episode})")
        
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the lok-lok streaming API
        api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={subject_id}&se={season}&ep={episode}&detail_path={slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0 and data.get('data', {}).get('hasResource'):
            streams = data['data'].get('streams', [])
            
            if streams:
                # Return all available qualities
                quality_streams = []
                for stream in streams:
                    quality_streams.append({
                        'id': stream.get('id'),
                        'url': stream.get('url'),
                        'resolution': stream.get('resolutions'),
                        'quality': f"{stream.get('resolutions')}p",
                        'size_bytes': stream.get('size'),
                        'duration_seconds': stream.get('duration'),
                        'format': stream.get('format'),
                        'codec': stream.get('codecName')
                    })
                
                # Sort by quality (720p first, then 480p, etc.)
                quality_streams.sort(key=lambda x: int(x['resolution']) if x['resolution'].isdigit() else 0, reverse=True)
                
                print(f"[+] Found {len(quality_streams)} quality options")
                
                return jsonify({
                    'streams': quality_streams,
                    'available_qualities': [s['quality'] for s in quality_streams]
                })
            else:
                print(f"[-] No streams found in data: {json.dumps(data)}")
                return jsonify({'error': 'No streams available'}), 404
        else:
            error_msg = data.get('message', 'No resource available')
            print(f"[-] Stream API Error: {error_msg}")
            print(f"[-] Full Response: {json.dumps(data)}")
            return jsonify({'error': error_msg, 'details': data}), 404
            
    except Exception as e:
        print(f"[-] Stream Exception: {e}")
        import traceback
        traceback.print_exc()
        # Return the actual error to the client for debugging
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/api/captions/<slug>/<subject_id>/<stream_id>')
def get_captions(slug, subject_id, stream_id):
    """
    Get available subtitles/captions for a movie
    GET /api/captions/harvester-cM7asI5cHi4/3610296229948702968/6278746629130830072
    """
    try:
        print(f"[*] Getting captions for: {slug}")
        
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the lok-lok captions API
        api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/caption?format=MP4&id={stream_id}&subjectId={subject_id}&detail_path={slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
            'x-client-info': '{"timezone":"Europe/Paris"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0:
            captions = data.get('data', {}).get('captions', [])
            
            # Format captions for frontend
            formatted_captions = []
            for caption in captions:
                formatted_captions.append({
                    'id': caption.get('id'),
                    'language': caption.get('lan'),
                    'languageName': caption.get('lanName'),
                    'url': caption.get('url')
                })
            
            print(f"[+] Found {len(formatted_captions)} subtitle tracks")
            
            return jsonify({
                'captions': formatted_captions
            })
        else:
            return jsonify({'error': data.get('message', 'Failed to fetch captions')}), 404
            
    except Exception as e:
        print(f"[-] Captions error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/movie-details/<subject_id>')
@cache_response(ttl_seconds=1800)  # Cache for 30 minutes
def get_movie_details(subject_id):
    """
    Get complete movie details including recommendations
    GET /api/movie-details/2116866929607460888
    """
    try:
        print(f"[*] Getting full details for subject ID: {subject_id}")
        
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the detail-rec API
        api_url = f'https://moviebox.ph/wefeed-h5-bff/web/subject/detail-rec?subjectId={subject_id}&page=1&perPage=12'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'x-client-info': '{"timezone":"Europe/Paris"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0:
            recommendations = data.get('data', {}).get('items', [])
            
            # Format recommendations
            formatted_recs = []
            for rec in recommendations:
                formatted_recs.append({
                    'subjectId': rec.get('subjectId'),
                    'title': rec.get('title'),
                    'image': rec.get('cover', {}).get('url'),
                    'rating': rec.get('imdbRatingValue'),
                    'year': rec.get('releaseDate', '')[:4] if rec.get('releaseDate') else '',
                    'genre': rec.get('genre'),
                    'slug': rec.get('detailPath')
                })
            
            print(f"[+] Found {len(formatted_recs)} recommended movies")
            
            return jsonify({
                'recommendations': formatted_recs
            })
        else:
            return jsonify({'recommendations': []}), 200
            
    except Exception as e:
        print(f"[-] Details error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'recommendations': []}), 200


@app.route('/api/tv-details/<subject_id>/<slug>')
@cache_response(ttl_seconds=1800)  # Cache for 30 minutes
def get_tv_details(subject_id, slug):
    """
    Get TV show details including seasons and episodes
    GET /api/tv-details/5427084510527638448/game-of-thrones-arabic-CR3bydu6Us6
    """
    try:
        print(f"[*] Getting TV show details for: {slug} (ID: {subject_id})")
        
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the detail API for TV shows
        api_url = f'https://lok-lok.cc/wefeed-h5-bff/web/subject/detail?subjectId={subject_id}&detail_path={slug}'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0:
            subject = data.get('data', {}).get('subject') or {}
            stars = data.get('data', {}).get('stars') or []
            resource = data.get('data', {}).get('resource') or {}
            
            # Format response
            tv_data = {
                'title': subject.get('title'),
                'description': subject.get('description'),
                'rating': subject.get('imdbRatingValue'),
                'ratingCount': subject.get('imdbRatingCount'),
                'year': subject.get('releaseDate', '')[:4] if subject.get('releaseDate') else '',
                'genre': subject.get('genre'),
                'country': subject.get('countryName'),
                'cover': subject.get('cover', {}).get('url'),
                'stills': subject.get('stills'),
                'postTitle': subject.get('postTitle'),
                'seasons': resource.get('seasons', []),
                'cast': []
            }
            
            # Format cast
            for star in stars[:10]:  # First 10 cast members
                tv_data['cast'].append({
                    'name': star.get('name'),
                    'character': star.get('character'),
                    'avatar': star.get('avatarUrl')
                })
            
            print(f"[+] Found {len(tv_data['seasons'])} seasons")
            
            return jsonify(tv_data)
        else:
            return jsonify({'error': data.get('message', 'Failed to fetch TV details')}), 404
            
    except Exception as e:
        print(f"[-] TV details error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/search-suggest', methods=['POST'])
def search_suggest():
    """
    Get search suggestions
    POST /api/search-suggest
    Body: {"keyword": "Game of"}
    """
    try:
        data = request.json
        keyword = data.get('keyword')
        
        if not keyword:
            return jsonify({'items': []})
            
        print(f"[*] Getting suggestions for: {keyword}")
        
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Use the search suggest API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/subject/search-suggest'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://moviebox.ph',
            'Referer': f'https://moviebox.ph/web/searchResult?keyword={keyword}',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        payload = {
            "keyword": keyword,
            "perPage": 10
        }
        
        response = session.post(api_url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        resp_data = response.json()
        
        if resp_data.get('code') == 0:
            items = resp_data.get('data', {}).get('items', [])
            suggestions = [item.get('word') for item in items if item.get('word')]
            return jsonify({'suggestions': suggestions})
        else:
            return jsonify({'suggestions': []})
            
    except Exception as e:
        print(f"[-] Suggestion error: {e}")
        return jsonify({'suggestions': []})


@app.route('/api/home/trending')
@cache_response(ttl_seconds=300)  # Cache for 5 minutes
def get_trending():
    """
    Get trending content
    GET /api/home/trending
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Trending API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/subject/trending'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Referer': 'https://moviebox.ph/',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        params = {
            'uid': '2619550464035246824',
            'page': 0,
            'perPage': 18
        }
        
        response = session.get(api_url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0:
            return jsonify(data.get('data', {}))
        else:
            return jsonify({'subjectList': []})
            
    except Exception as e:
        print(f"[-] Trending error: {e}")
        return jsonify({'subjectList': []})


@app.route('/api/home/collection/<collection_id>')
@cache_response(ttl_seconds=600)  # Cache for 10 minutes
def get_collection(collection_id):
    """
    Get specific collection (e.g. Western TV)
    GET /api/home/collection/2337210270994629192
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Collection API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/ranking-list/content'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': f'https://moviebox.ph/ranking-list/Kfiq8uLrEM2?id={collection_id}&page_from=more_SUBJECTS_MOVIE',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        params = {
            'id': collection_id,
            'page': 1,
            'perPage': 20
        }
        
        response = session.get(api_url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 0:
            return jsonify(data.get('data', {}))
        else:
            return jsonify({'subjectList': []})
            
    except Exception as e:
        print(f"[-] Collection error: {e}")
        return jsonify({'subjectList': []})






@app.route('/api/tv-shows/browse')
def browse_tv_shows():
    """
    Browse TV shows with filters
    GET /api/tv-shows/browse?page=1&perPage=18&genre=Crime&year=2025&country=Egypt
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Get filter parameters
        page = request.args.get('page', '1')
        per_page = request.args.get('perPage', '18')
        genre = request.args.get('genre', '')
        year = request.args.get('year', '')
        country = request.args.get('country', '')
        sort = request.args.get('sort', '')
        classify = request.args.get('classify', '')
        rating = request.args.get('rating', '')
        
        # Filter API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/filter'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://moviebox.ph/',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        # Build payload
        payload = {
            'page': int(page),
            'perPage': int(per_page),
            'channelId': 2  # 2 = TV Shows
        }
        
        if genre:
            payload['genre'] = genre
        if year:
            payload['year'] = year
        if country:
            payload['country'] = country
        if sort:
            payload['sort'] = sort
        if classify:
            payload['classify'] = classify
        if rating:
            payload['rating'] = rating
        
        response = session.post(api_url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return jsonify(data.get('data', {}))
        
    except Exception as e:
        print(f"[-] Error browsing TV shows: {e}")
        return jsonify({'error': str(e)}), 500



@app.route('/api/get-subject-id/<slug>')
@cache_response(ttl_seconds=3600)  # Cache for 1 hour
def get_subject_id(slug):
    """
    Get subject ID for a movie slug by fetching the detail page
    GET /api/get-subject-id/natural-disaster-arabic-Iu6LI2yUkW2
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Use the API to get subject ID (more robust than scraping)
        api_url = f'https://moviebox.ph/wefeed-h5-bff/web/subject/detail?detail_path={slug}'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Referer': f'https://moviebox.ph/detail/{slug}',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                subject = data.get('data', {}).get('subject', {})
                subject_id = subject.get('subjectId')
                if subject_id:
                    return jsonify({'slug': slug, 'subjectId': str(subject_id)})
        
        # Fallback to scraping if API fails
        print(f"[*] API failed, falling back to scraping for {slug}")
        
        # Fetch the movie detail page
        url = f'https://moviebox.ph/detail/{slug}'
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for lok-lok.cc links
        lok_lok_links = soup.find_all('a', href=re.compile(r'lok-lok\.cc.*[?&]id=(\d+)'))
        
        for link in lok_lok_links:
            href = link.get('href', '')
            id_match = re.search(r'[?&]id=(\d+)', href)
            if id_match:
                subject_id = id_match.group(1)
                return jsonify({'slug': slug, 'subjectId': subject_id})
        
        # Alternative: look in script tags for the ID
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                id_match = re.search(r'"id"\s*:\s*"?(\d{15,})"?', script.string)
                if id_match:
                    subject_id = id_match.group(1)
                    return jsonify({'slug': slug, 'subjectId': subject_id})
        
        return jsonify({'error': 'Subject ID not found'}), 404
        
    except Exception as e:
        print(f"[-] Error getting subject ID: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/metadata/<slug>')
@cache_response(ttl_seconds=3600)  # Cache for 1 hour - metadata rarely changes
def get_metadata(slug):
    """
    Get movie/TV metadata by scraping the detail page
    GET /api/metadata/dune-part-two
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Use the API to get metadata (more robust)
        api_url = f'https://moviebox.ph/wefeed-h5-bff/web/subject/detail?detail_path={slug}'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Referer': f'https://moviebox.ph/detail/{slug}',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        response = session.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                subject = data.get('data', {}).get('subject', {})
                if subject:
                    return jsonify({
                        'title': subject.get('title'),
                        'description': subject.get('description'),
                        'image': subject.get('cover', {}).get('url'),
                        'subjectId': str(subject.get('subjectId')),
                        'slug': slug,
                        'subjectType': subject.get('subjectType')
                    })

        # Fallback to scraping
        print(f"[*] API metadata failed, falling back to scraping for {slug}")
        
        url = f'https://moviebox.ph/detail/{slug}'
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Scrape metadata
        title = soup.find('h1', class_='title')
        title = title.text.strip() if title else slug
        
        desc = soup.find('p', class_='desc')
        description = desc.text.strip() if desc else ''
        
        poster = soup.find('div', class_='poster')
        image = poster.find('img')['src'] if poster and poster.find('img') else ''
        
        # Try to find subject ID
        subject_id = ''
        
        # 1. Look for lok-lok.cc links (most reliable)
        lok_lok_links = soup.find_all('a', href=re.compile(r'lok-lok\.cc.*[?&]id=(\d+)'))
        for link in lok_lok_links:
            href = link.get('href', '')
            id_match = re.search(r'[?&]id=(\d+)', href)
            if id_match:
                subject_id = id_match.group(1)
                break
        
        # 2. If not found, look in scripts
        if not subject_id:
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    id_match = re.search(r'"id"\s*:\s*"?(\d{15,})"?', script.string)
                    if id_match:
                        subject_id = id_match.group(1)
                        break
        
        return jsonify({
            'title': title,
            'description': description,
            'image': image,
            'subjectId': subject_id,
            'slug': slug
        })
        
    except Exception as e:
        print(f"[-] Error getting metadata: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/proxy-stream')
def proxy_stream():
    """
    Proxy video stream to bypass CORS restrictions
    GET /api/proxy-stream?url=https://...
    """
    video_url = request.args.get('url')
    
    if not video_url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    try:
        # Get session with cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Stream the video
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://lok-lok.cc/',
            'Range': request.headers.get('Range', 'bytes=0-')
        }
        
        response = session.get(video_url, headers=headers, stream=True)
        
        def generate():
            # Use larger chunks for better performance (1MB)
            for chunk in response.iter_content(chunk_size=1024*1024):
                if chunk:
                    yield chunk
        
        # Forward response with proper headers
        flask_response = Response(generate(), status=response.status_code)
        flask_response.headers['Content-Type'] = response.headers.get('Content-Type', 'video/mp4')
        flask_response.headers['Accept-Ranges'] = 'bytes'
        flask_response.headers['Access-Control-Allow-Origin'] = '*'
        
        if 'Content-Range' in response.headers:
            flask_response.headers['Content-Range'] = response.headers['Content-Range']
        if 'Content-Length' in response.headers:
            flask_response.headers['Content-Length'] = response.headers['Content-Length']
        
        return flask_response
        
    except Exception as e:
        print(f"[-] Proxy error: {e}")
        return jsonify({'error': str(e)}), 500



@app.route('/api/browse')
@cache_response(ttl_seconds=300)  # Cache for 5 minutes
def browse_unified():
    """
    Unified browse endpoint
    GET /api/browse?channelId=1&page=1...
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Get filter parameters
        page = request.args.get('page', '1')
        per_page = request.args.get('perPage', '24')
        channel_id = request.args.get('channelId', '1')
        genre = request.args.get('genre', '')
        year = request.args.get('year', '')
        country = request.args.get('country', '')
        sort = request.args.get('sort', '')
        classify = request.args.get('classify', '')
        rating = request.args.get('rating', '')
        
        # Filter API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/filter'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://moviebox.ph/',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        # Build payload
        payload = {
            'page': int(page),
            'perPage': int(per_page),
            'channelId': int(channel_id)
        }
        
        if genre:
            payload['genre'] = genre
        if year:
            payload['year'] = year
        if country:
            payload['country'] = country
        if sort:
            payload['sort'] = sort
        if classify:
            payload['classify'] = classify
        if rating:
            payload['rating'] = rating
        
        
        print(f"[DEBUG] Browsing unified: {payload}")
        
        # Use requests directly to avoid potential session issues
        response = requests.post(api_url, headers=headers, json=payload, timeout=10)
        
        print(f"[DEBUG] Status: {response.status_code}")
        if not response.ok:
            print(f"[DEBUG] Error Text: {response.text}")
            
        response.raise_for_status()
        
        data = response.json()
        return jsonify(data.get('data', {}))
        
    except Exception as e:
        print(f"[-] Error browsing content: {e}")
        import traceback
        traceback.print_exc()
        # Return the actual error message if possible
        return jsonify({'error': str(e)}), 500


@app.route('/api/movies/browse')
def browse_movies():
    """
    Browse movies with filters
    GET /api/movies/browse?page=1&perPage=18&genre=Action&year=2025&country=USA
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Get filter parameters
        page = request.args.get('page', '1')
        per_page = request.args.get('perPage', '18')
        genre = request.args.get('genre', '')
        year = request.args.get('year', '')
        country = request.args.get('country', '')
        sort = request.args.get('sort', '')
        classify = request.args.get('classify', '')
        rating = request.args.get('rating', '')
        
        # Filter API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/filter'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://moviebox.ph/',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        # Build payload
        payload = {
            'page': int(page),
            'perPage': int(per_page),
            'channelId': 1  # 1 = Movies
        }
        
        if genre:
            payload['genre'] = genre
        if year:
            payload['year'] = year
        if country:
            payload['country'] = country
        if sort:
            payload['sort'] = sort
        if classify:
            payload['classify'] = classify
        if rating:
            payload['rating'] = rating
        
        response = session.post(api_url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return jsonify(data.get('data', {}))
        
    except Exception as e:
        print(f"[-] Error browsing movies: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/animation/browse')
def browse_animation():
    """
    Browse animation with filters
    GET /api/animation/browse?page=1&perPage=18&year=2025&country=Japan
    """
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Get filter parameters
        page = request.args.get('page', '1')
        per_page = request.args.get('perPage', '18')
        year = request.args.get('year', '')
        country = request.args.get('country', '')
        
        # Filter API
        api_url = 'https://moviebox.ph/wefeed-h5-bff/web/filter'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://moviebox.ph/',
            'x-client-info': '{"timezone":"Africa/Tunis"}'
        }
        
        # Build payload
        payload = {
            'page': int(page),
            'perPage': int(per_page),
            'channelId': 1006  # 1006 = Animation
        }
        
        if year:
            payload['year'] = year
        if country:
            payload['country'] = country
        
        response = session.post(api_url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return jsonify(data.get('data', {}))
        
    except Exception as e:
        print(f"[-] Error browsing animation: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/track', methods=['POST'])
def track_analytics():
    """
    Track user watch event
    POST /api/analytics/track
    Body: {"user_id": "uuid", "content_id": "123", "content_title": "Movie Name", "content_type": "movie"}
    """
    try:
        data = request.json
        print(f"[ANALYTICS] Received track request: {data}")
        
        user_id = data.get('user_id')
        content_id = data.get('content_id')
        content_title = data.get('content_title')
        content_type = data.get('content_type', 'unknown')
        
        if not user_id or not content_id:
            print(f"[ANALYTICS] Missing required fields - user_id: {user_id}, content_id: {content_id}")
            return jsonify({'error': 'user_id and content_id required'}), 400
        
        print(f"[ANALYTICS] Attempting to track: user={user_id[:8]}..., content={content_title}")
        
        analytics_db = get_analytics_db()
        if not analytics_db or analytics_db.db is None:
            print("[ANALYTICS] WARNING: Analytics DB not connected! Skipping track.")
            # Return success anyway to avoid breaking the frontend
            return jsonify({'success': True, 'message': 'Event tracked (mock)'})
        
        success = analytics_db.track_watch_event(user_id, content_id, content_title, content_type)
        
        if success:
            print(f"[ANALYTICS] Successfully tracked event for {content_title}")
            return jsonify({'success': True, 'message': 'Event tracked'})
        else:
            print(f"[ANALYTICS] Failed to track event for {content_title}")
            return jsonify({'success': False, 'message': 'Failed to track event'}), 500
            
    except Exception as e:
        print(f"[ANALYTICS] ERROR in track_analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/stats')
def get_analytics_stats():
    """
    Get analytics statistics
    GET /api/analytics/stats?days=7
    """
    try:
        days = int(request.args.get('days', '7'))
        
        analytics_db = get_analytics_db()
        stats = analytics_db.get_stats_last_n_days(days)
        popular = analytics_db.get_popular_content(limit=10)
        
        return jsonify({
            'daily_stats': stats,
            'popular_content': popular
        })
        
    except Exception as e:
        print(f"[-] Analytics stats error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/daily-users')
def get_daily_users():
    """
    Get daily active users count
    GET /api/analytics/daily-users?date=2025-11-27
    """
    try:
        date = request.args.get('date')  # Optional, defaults to today
        
        analytics_db = get_analytics_db()
        count = analytics_db.get_daily_active_users(date)
        
        return jsonify({
            'date': date or datetime.utcnow().strftime('%Y-%m-%d'),
            'unique_users': count
        })
        
    except Exception as e:
        print(f"[-] Daily users error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cache/stats')
def cache_stats():
    """
    Get cache statistics
    GET /api/cache/stats
    """
    cache = get_cache()
    return jsonify({
        'cache_size': cache.size(),
        'status': 'active'
    })


@app.route('/api/cache/clear')
def clear_cache():
    """
    Clear the cache (admin endpoint)
    GET /api/cache/clear
    """
    cache = get_cache()
    cache.clear()
    return jsonify({
        'message': 'Cache cleared successfully',
        'cache_size': cache.size()
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🎬 Movie Streaming Backend Server")
    print("=" * 60)
    print("Starting server on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /api/search?q=<query>")
    print("  GET  /api/browse?channelId=<id>&page=<page>")
    print("  GET  /api/stream/<slug>/<subject_id>")
    print("  GET  /api/get-subject-id/<slug>")
    print("  GET  /api/tv-shows/browse")
    print("  GET  /api/movies/browse")
    print("  GET  /api/animation/browse")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)

