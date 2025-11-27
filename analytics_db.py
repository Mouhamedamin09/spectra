"""
MongoDB Analytics Module
Tracks user sessions and daily active users
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid

# MongoDB connection
MONGO_URI = "mongodb+srv://mouhamedaminkraiem09:admin123@cluster0.n9oaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "spectra_analytics"

class AnalyticsDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            # Test connection
            self.client.admin.command('ping')
            print("[+] Connected to MongoDB successfully")
        except Exception as e:
            print(f"[-] MongoDB connection error: {e}")
            self.client = None
            self.db = None
    
    def track_watch_event(self, user_id, content_id, content_title, content_type):
        """Track when a user starts watching content"""
        if self.db is None:
            return False
        
        try:
            session_data = {
                'user_id': user_id,
                'content_id': content_id,
                'content_title': content_title,
                'content_type': content_type,
                'timestamp': datetime.utcnow(),
                'date': datetime.utcnow().strftime('%Y-%m-%d')
            }
            
            self.db.user_sessions.insert_one(session_data)
            print(f"[+] Tracked watch event for user {user_id[:8]}... watching {content_title}")
            return True
        except Exception as e:
            print(f"[-] Error tracking watch event: {e}")
            return False
    
    def get_daily_active_users(self, date=None):
        """Get count of unique users for a specific date"""
        if self.db is None:
            return 0
        
        try:
            if date is None:
                date = datetime.utcnow().strftime('%Y-%m-%d')
            
            # Count unique user_ids for the date
            pipeline = [
                {'$match': {'date': date}},
                {'$group': {'_id': '$user_id'}},
                {'$count': 'total'}
            ]
            
            result = list(self.db.user_sessions.aggregate(pipeline))
            count = result[0]['total'] if result else 0
            
            return count
        except Exception as e:
            print(f"[-] Error getting daily active users: {e}")
            return 0
    
    def get_stats_last_n_days(self, days=7):
        """Get daily active user stats for the last N days"""
        if self.db is None:
            return []
        
        try:
            stats = []
            for i in range(days):
                date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
                count = self.get_daily_active_users(date)
                
                # Get total sessions for the day
                total_sessions = self.db.user_sessions.count_documents({'date': date})
                
                stats.append({
                    'date': date,
                    'unique_users': count,
                    'total_sessions': total_sessions
                })
            
            return stats
        except Exception as e:
            print(f"[-] Error getting stats: {e}")
            return []
    
    def get_popular_content(self, limit=10):
        """Get most watched content"""
        if self.db is None:
            return []
        
        try:
            pipeline = [
                {'$group': {
                    '_id': {
                        'content_id': '$content_id',
                        'content_title': '$content_title',
                        'content_type': '$content_type'
                    },
                    'watch_count': {'$sum': 1}
                }},
                {'$sort': {'watch_count': -1}},
                {'$limit': limit}
            ]
            
            results = list(self.db.user_sessions.aggregate(pipeline))
            
            popular = []
            for item in results:
                popular.append({
                    'content_id': item['_id']['content_id'],
                    'content_title': item['_id']['content_title'],
                    'content_type': item['_id']['content_type'],
                    'watch_count': item['watch_count']
                })
            
            return popular
        except Exception as e:
            print(f"[-] Error getting popular content: {e}")
            return []

# Singleton instance
_analytics_db = None

def get_analytics_db():
    """Get or create analytics DB instance"""
    global _analytics_db
    if _analytics_db is None:
        _analytics_db = AnalyticsDB()
    return _analytics_db
