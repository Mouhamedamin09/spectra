"""
Session Manager for MovieBox Scraping
Automatically obtains and manages cookies for lok-lok.cc
"""

import requests
from datetime import datetime, timedelta
import uuid
import time


class SessionManager:
    """Manages cookies and session for movie streaming API"""
    
    def __init__(self):
        self.session = requests.Session()
        self.cookies_obtained_at = None
        self.cookie_lifetime = timedelta(hours=2)  # Refresh every 2 hours
        
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
    print("Testing SessionManager...")
    print("=" * 60)
    
    manager = SessionManager()
    success = manager.get_fresh_cookies()
    
    if success:
        print("\n✓ Session established successfully!")
        print(f"\nCookies:")
        for name, value in manager.get_cookies_dict().items():
            print(f"  {name}: {value}")
    else:
        print("\n✗ Failed to establish session")
