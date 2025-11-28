"""
Session Manager for MovieBox Scraping with Proxy Rotation
Automatically obtains and manages cookies for lok-lok.cc
"""

import requests
from datetime import datetime, timedelta
import uuid
import time
import os
import random


class SessionManager:
    """Manages cookies and session for movie streaming API with proxy rotation"""
    
    def __init__(self):
        self.session = requests.Session()
        
        # Load proxy list from file
        self.proxy_list = self._load_proxies()
        self.current_proxy_index = 0
        
        # Configure initial proxy
        if self.proxy_list:
            proxy = self._get_next_proxy()
            print(f"[+] Using proxy: {proxy[:50]}...")
            self.session.proxies = {
                'http': proxy,
                'https': proxy
            }
        else:
            # Fallback to single proxy from environment variable
            proxy_url = os.getenv('STREAMING_PROXY_URL')
            if proxy_url:
                print(f"[+] Using proxy from env: {proxy_url[:50]}...")
                self.session.proxies = {
                    'http': proxy_url,
                    'https': proxy_url
                }
            else:
                print("[!] WARNING: No proxy configured. Requests will likely be blocked!")
        
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': 'https://lok-lok.cc',
            'Referer': 'https://lok-lok.cc/',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Connection': 'keep-alive'
        })
        self.cookies_obtained_at = None
        self.cookie_lifetime = timedelta(hours=2)  # Refresh every 2 hours
    
    def _load_proxies(self):
        """Load proxies from file"""
        try:
            proxy_file = os.path.join(os.path.dirname(__file__), 'proxy_list.txt')
            if os.path.exists(proxy_file):
                with open(proxy_file, 'r') as f:
                    proxies = [line.strip() for line in f if line.strip() and line.strip().startswith('http')]
                print(f"[+] Loaded {len(proxies)} proxies from file")
                return proxies
            else:
                print(f"[!] Proxy file not found: {proxy_file}")
        except Exception as e:
            print(f"[-] Error loading proxies: {e}")
        return []
    
    def _get_next_proxy(self):
        """Get the next proxy from the list (round-robin)"""
        if not self.proxy_list:
            return None
        
        proxy = self.proxy_list[self.current_proxy_index]
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxy_list)
        return proxy
    
    def rotate_proxy(self):
        """Switch to a different proxy"""
        if self.proxy_list:
            proxy = self._get_next_proxy()
            print(f"[*] Rotating to proxy: {proxy[:50]}...")
            self.session.proxies = {
                'http': proxy,
                'https': proxy
            }
            # Also refresh cookies when rotating proxy
            self.get_fresh_cookies()
            return True
        return False
        
    def get_fresh_cookies(self):
        """
        Generate fresh cookies based on observed patterns from the site
        No need to visit the site - we can generate valid cookies
        Returns True if successful, False otherwise
        """
        try:
            # Generate a UUID for this session
            session_uuid = str(uuid.uuid4())
            
            # Generate account cookie
            # Pattern observed: {19-digit-number}|0|H5|{future-timestamp}|
            import random
            account_id = ''.join([str(random.randint(0, 9)) for _ in range(19)])
            timestamp = int(time.time()) + (30 * 24 * 3600)  # 30 days from now
            account_cookie = f"{account_id}|0|H5|{timestamp}|"
            
            # Generate GA cookies (Google Analytics format)
            ga_client_id = f"{random.randint(100000000, 999999999)}.{int(time.time())}"
            ga_value = f"GA1.1.{ga_client_id}"
            
            # Generate complex GA cookie
            session_start = int(time.time())
            ga_complex = f"GS2.1.s{session_start}$o2$g1$t{session_start}$j{random.randint(1,99)}$l0$h0"
            
            # Clear any existing cookies and set new ones
            self.session.cookies.clear()
            
            # Set cookies for lok-lok.cc domain
            self.session.cookies.set('uuid', session_uuid, domain='.lok-lok.cc')
            self.session.cookies.set('account', account_cookie, domain='.lok-lok.cc')
            self.session.cookies.set('_ga', ga_value, domain='.lok-lok.cc')
            self.session.cookies.set('_ga_5W8GT0FPB7', ga_complex, domain='.lok-lok.cc')
            
            self.cookies_obtained_at = datetime.now()
            
            print(f"[+] Fresh cookies generated successfully!")
            print(f"    UUID: {session_uuid}")
            print(f"    Account: {account_cookie}")
            
            return True
            
        except Exception as e:
            print(f"[-] Failed to generate cookies: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def needs_refresh(self):
        """Check if cookies need to be refreshed"""
        if self.cookies_obtained_at is None:
            return True
        
        age = datetime.now() - self.cookies_obtained_at
        return age > self.cookie_lifetime
    
    def get_session(self):
        """
        Get a requests session with valid cookies
        Automatically refreshes cookies if needed
        """
        if self.needs_refresh():
            print("[*] Cookies expired or not obtained, getting fresh cookies...")
            if not self.get_fresh_cookies():
                print("[!] Warning: Failed to get fresh cookies, using existing session")
        
        return self.session
    
    def get_cookies_dict(self):
        """Get cookies as a dictionary for manual use"""
        return dict(self.session.cookies)


# Global session manager instance
_session_manager = None


def get_session_manager():
    """Get the global session manager instance"""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager


if __name__ == "__main__":
    # Test the session manager
    print("Testing SessionManager with Proxy Rotation...")
    print("=" * 60)
    
    manager = SessionManager()
    success = manager.get_fresh_cookies()
    
    if success:
        print("\n✓ Session established successfully!")
        print(f"\nCookies:")
        for name, value in manager.get_cookies_dict().items():
            print(f"  {name}: {value}")
        
        # Test proxy rotation
        if manager.proxy_list:
            print(f"\n✓ {len(manager.proxy_list)} proxies loaded")
            print("\nTesting proxy rotation...")
            for i in range(3):
                manager.rotate_proxy()
                time.sleep(1)
    else:
        print("\n✗ Failed to establish session")
