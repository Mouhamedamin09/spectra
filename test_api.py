import requests
import json

def test_browse(channel_id):
    url = 'https://moviebox.ph/wefeed-h5-bff/web/filter'
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': 'https://moviebox.ph/',
        'x-client-info': '{"timezone":"Africa/Tunis"}'
    }
    payload = {
        'page': 1,
        'perPage': 24,
        'channelId': channel_id
    }
    
    print(f"Testing channelId={channel_id}...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.ok:
            data = response.json()
            items = data.get('data', {}).get('items', [])
            print(f"Items count: {len(items)}")
            if len(items) > 0:
                print(f"First item: {items[0].get('title')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_browse(1006)
    test_browse(3)
    test_browse(1)
