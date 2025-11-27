"""
Simple in-memory cache for API responses with TTL
"""

from functools import wraps
from datetime import datetime, timedelta
import hashlib
import json


class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        """Get cached value if exists and not expired"""
        if key in self._cache:
            value, expires_at = self._cache[key]
            if datetime.now() < expires_at:
                return value
            else:
                # Expired, remove it
                del self._cache[key]
        return None
    
    def set(self, key, value, ttl_seconds=300):
        """Set cache value with TTL"""
        expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expires_at)
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
    
    def size(self):
        """Get current cache size"""
        return len(self._cache)


# Global cache instance
_cache = SimpleCache()


def cache_response(ttl_seconds=300):
    """
    Decorator to cache Flask route responses
    
    Args:
        ttl_seconds: Time to live in seconds (default 5 minutes)
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Import here to avoid circular dependency
            from flask import request
            
            # Create cache key from request URL and args
            cache_key_parts = [request.path]
            
            # Add query parameters
            if request.args:
                sorted_args = sorted(request.args.items())
                cache_key_parts.append(str(sorted_args))
            
            # Add path parameters
            if kwargs:
                sorted_kwargs = sorted(kwargs.items())
                cache_key_parts.append(str(sorted_kwargs))
            
            cache_key = hashlib.md5('|'.join(cache_key_parts).encode()).hexdigest()
            
            # Try to get from cache
            cached = _cache.get(cache_key)
            if cached is not None:
                print(f"[CACHE HIT] {request.path}")
                return cached
            
            # Execute function
            print(f"[CACHE MISS] {request.path}")
            result = f(*args, **kwargs)
            
            # Store in cache
            _cache.set(cache_key, result, ttl_seconds)
            
            return result
        
        return wrapper
    return decorator


def get_cache():
    """Get the global cache instance"""
    return _cache
