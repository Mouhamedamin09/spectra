// User Analytics Service
// Generates and manages anonymous user IDs for tracking

export const analyticsService = {
  // Get or create anonymous user ID
  getUserId: (): string => {
    const STORAGE_KEY = 'spectra_user_id';
    let userId = localStorage.getItem(STORAGE_KEY);
    
    if (!userId) {
      // Generate UUID v4
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem(STORAGE_KEY, userId);
    }
    
    return userId;
  },

  // Track watch event
  trackWatch: async (contentId: string, contentTitle: string, contentType: 'movie' | 'tv' | 'animation'): Promise<void> => {
    try {
      const userId = analyticsService.getUserId();
      
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          content_id: contentId,
          content_title: contentTitle,
          content_type: contentType
        })
      });
      
      console.log('[Analytics] Tracked watch event:', contentTitle);
    } catch (error) {
      console.error('[Analytics] Failed to track watch event:', error);
    }
  },

  // Get analytics stats
  getStats: async (days: number = 7): Promise<any> => {
    try {
      const response = await fetch(`/api/analytics/stats?days=${days}`);
      return await response.json();
    } catch (error) {
      console.error('[Analytics] Failed to get stats:', error);
      return null;
    }
  },

  // Get daily users count
  getDailyUsers: async (date?: string): Promise<number> => {
    try {
      const url = date ? `/api/analytics/daily-users?date=${date}` : '/api/analytics/daily-users';
      const response = await fetch(url);
      const data = await response.json();
      return data.unique_users || 0;
    } catch (error) {
      console.error('[Analytics] Failed to get daily users:', error);
      return 0;
    }
  }
};
