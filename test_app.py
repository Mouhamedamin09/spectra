"""
Quick Test Script for Movie Streaming API
Tests the core functionality without a browser
"""

import requests
import json

API_BASE = 'http://localhost:5000/api'

print("=" * 70)
print("🧪 Testing Movie Streaming API")
print("=" * 70)

# Test 1: Get subject ID
print("\n[Test 1] Getting subject ID for test movie...")
slug = "natural-disaster-arabic-Iu6LI2yUkW2"

try:
    response = requests.get(f"{API_BASE}/get-subject-id/{slug}", timeout=10)
    if response.ok:
        data = response.json()
        print(f"✓ Subject ID retrieved: {data.get('subjectId')}")
        subject_id = data.get('subjectId')
    else:
        print(f"✗ Failed: {response.status_code}")
        subject_id = "2468315697651272720"  # Use hardcoded for test
except Exception as e:
    print(f"✗ Error: {e}")
    subject_id = "2468315697651272720"

# Test 2: Get stream URL
print(f"\n[Test 2] Getting stream URL for {slug}...")

try:
    response = requests.get(f"{API_BASE}/stream/{slug}/{subject_id}", timeout=10)
    if response.ok:
        data = response.json()
        print(f"✓ Stream URL retrieved!")
        print(f"  URL: {data.get('url')[:80]}...")
        print(f"  Resolution: {data.get('resolution')}p")
        print(f"  Format: {data.get('format')}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Search (basic test - might not return results depending on implementation)
print(f"\n[Test 3] Testing search endpoint...")

try:
    response = requests.get(f"{API_BASE}/search?q=predator", timeout=10)
    if response.ok:
        data = response.json()
        results_count = len(data.get('results', []))
        print(f"✓ Search completed!")
        print(f"  Found {results_count} results")
        if results_count > 0:
            print(f"  First result: {data['results'][0].get('title')}")
    else:
        print(f"✗ Failed: {response.status_code}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 70)
print("✓ API Testing Complete!")
print("=" * 70)
print("\nNext step: Open http://localhost:5000 in your browser to test the webapp!")
