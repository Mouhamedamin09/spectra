import type { MediaItem } from '../types';

const API_BASE = '/api';

// Types for API Responses
interface ApiSubject {
  subjectId: string;
  title: string;
  cover?: { url: string };
  image?: string; // Sometimes returned directly
  releaseDate?: string;
  imdbRatingValue?: string;
  subjectType?: number; // 1=Movie, 2=TV, 3=Animation?
  detailPath?: string;
  slug?: string;
  genre?: string;
  description?: string;
  quality?: string;
  corner?: string; // Contains dub info like "En français"
  isDubbed?: boolean;
  dubLanguage?: string;
  language?: string;
}

// Helper function to extract dub language from title or detect from data
const extractDubLanguage = (item: ApiSubject): { isDubbed: boolean; dubLanguage?: string } => {
  // If API provides explicit dub information
  if (item.corner) {
    return {
      isDubbed: true,
      dubLanguage: item.corner
    };
  }

  if (item.isDubbed || item.dubLanguage || item.language) {
    return {
      isDubbed: true,
      dubLanguage: item.dubLanguage || item.language || undefined
    };
  }

  // Try to detect from title (common patterns: "Title (Arabic Dub)", "Title - Turkish Dub", etc.)
  const title = item.title || '';
  const dubPatterns = [
    /\(([^)]+)\s*dub\)/i,
    /-?\s*([A-Za-z]+)\s*dub/i,
    /\(([^)]+)\s*مدبلج\)/i, // Arabic for "dubbed"
    /\(([^)]+)\s*دبلجة\)/i, // Arabic for "dubbing"
  ];

  for (const pattern of dubPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const language = match[1].trim();
      // Common language names
      const languageMap: { [key: string]: string } = {
        'arabic': 'Arabic',
        'ar': 'Arabic',
        'turkish': 'Turkish',
        'tr': 'Turkish',
        'english': 'English',
        'en': 'English',
        'french': 'French',
        'fr': 'French',
        'spanish': 'Spanish',
        'es': 'Spanish',
        'hindi': 'Hindi',
        'hi': 'Hindi',
      };
      
      const normalizedLang = language.toLowerCase();
      return {
        isDubbed: true,
        dubLanguage: languageMap[normalizedLang] || language.charAt(0).toUpperCase() + language.slice(1).toLowerCase()
      };
    }
  }

  // Check if title contains common dub indicators
  const dubIndicators = ['dub', 'dubbed', 'مدبلج', 'دبلجة'];
  const hasDubIndicator = dubIndicators.some(indicator => 
    title.toLowerCase().includes(indicator.toLowerCase())
  );

  if (hasDubIndicator) {
    return { isDubbed: true };
  }

  return { isDubbed: false };
};

// Mapper function to convert API data to frontend MediaItem
const mapSubjectToMediaItem = (item: ApiSubject): MediaItem => {
  const isTv = item.subjectType === 2;
  const isAnimation = item.subjectType === 3 || (item.genre && item.genre.toLowerCase().includes('animation'));
  
  // Prioritize corner field for dub detection
  let dubInfo;
  if (item.corner) {
    dubInfo = { isDubbed: true, dubLanguage: item.corner };
  } else {
    dubInfo = extractDubLanguage(item);
  }
  
  return {
    id: item.subjectId,
    subjectId: item.subjectId, // Preserve subjectId
    title: item.title,
    image: item.cover?.url || item.image || '',
    year: item.releaseDate ? item.releaseDate.substring(0, 4) : undefined,
    rating: item.imdbRatingValue,
    type: isTv ? 'tv' : isAnimation ? 'animation' : 'movie',
    slug: item.detailPath || item.slug || '',
    quality: item.quality as any, // Cast to specific union type if needed
    subjectType: item.subjectType, // Preserve subjectType for proper detection
    description: item.description,
    isDubbed: dubInfo.isDubbed,
    dubLanguage: dubInfo.dubLanguage,
  };
};

// Cache helper
const cache = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { value, expiry } = JSON.parse(item);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (e) {
      return null;
    }
  },
  set: (key: string, value: any, ttlSeconds: number = 300) => {
    try {
      const item = {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to save to cache', e);
    }
  }
};

export const api = {
  // Helper
  getSubjectId: async (slug: string): Promise<string> => {
    const cacheKey = `subject_id_${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/get-subject-id/${slug}`);
    if (!res.ok) throw new Error('Failed to get subject ID');
    const data = await res.json();
    
    cache.set(cacheKey, data.subjectId, 3600); // Cache for 1 hour
    return data.subjectId;
  },

  // Home
  getTrending: async (): Promise<MediaItem[]> => {
    const cacheKey = 'trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/home/trending`);
    const data = await res.json();
    const items = (data.items || []).map(mapSubjectToMediaItem);
    
    cache.set(cacheKey, items, 600); // Cache for 10 minutes
    return items;
  },

  getCollection: async (id: string): Promise<MediaItem[]> => {
    const cacheKey = `collection_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/home/collection/${id}`);
    const data = await res.json();
    const items = (data.subjectList || []).map(mapSubjectToMediaItem);
    
    cache.set(cacheKey, items, 900); // Cache for 15 minutes
    return items;
  },

  // Browse
  browse: async (type: 'movie' | 'tv' | 'animation', params: any = {}): Promise<{ items: MediaItem[], hasMore: boolean }> => {
    // Use a unified browse endpoint that accepts channelId
    const endpoint = '/browse';

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const cacheKey = `browse_${type}_${queryParams.toString()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let data;
    const res = await fetch(`${API_BASE}${endpoint}?${queryParams.toString()}`);
    
    if (!res.ok) {
      // Fallback to old endpoints if new one doesn't exist
      let fallbackEndpoint = '/movies/browse';
      if (type === 'tv') fallbackEndpoint = '/tv-shows/browse';
      if (type === 'animation') fallbackEndpoint = '/animation/browse';
      
      const fallbackRes = await fetch(`${API_BASE}${fallbackEndpoint}?${queryParams.toString()}`);
      if (!fallbackRes.ok) {
        const errText = await fallbackRes.text();
        console.error('Fallback failed:', errText);
        throw new Error(`Failed to browse content: ${fallbackRes.status} ${errText}`);
      }
      data = await fallbackRes.json();
    } else {
      data = await res.json();
    }
    
    const items = (data.items || []).map(mapSubjectToMediaItem);
    // Use pager.hasMore if available, otherwise fallback to checking if we got items
    const hasMore = data.pager?.hasMore ?? (items.length > 0);
    
    const result = { items, hasMore };
    cache.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  },

  // Metadata
  getMetadata: async (slug: string): Promise<MediaItem> => {
    const cacheKey = `metadata_${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/metadata/${slug}`);
    if (!res.ok) throw new Error('Failed to load metadata');
    const data = await res.json();
    const subjectType = data.subjectType || data.subject_type;
    const isTv = subjectType === 2 || subjectType === '2';
    const isAnimation = subjectType === 3 || subjectType === '3';
    const dubInfo = extractDubLanguage(data as ApiSubject);
    
    const result = {
      id: data.subjectId,
      subjectId: data.subjectId,
      title: data.title,
      image: data.image,
      type: isTv ? 'tv' : isAnimation ? 'animation' : 'movie',
      slug: data.slug,
      description: data.description,
      subjectType: subjectType,
      isDubbed: dubInfo.isDubbed,
      dubLanguage: dubInfo.dubLanguage,
    };
    
    cache.set(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  },

  // Details
  getDetails: async (id: string, type: 'movie' | 'tv' | 'animation', slug: string) => {
    const cacheKey = `details_${id}_${type}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let result;
    // For TV shows, we need a specific endpoint
    if (type === 'tv') {
      const res = await fetch(`${API_BASE}/tv-details/${id}/${slug}`);
      result = await res.json();
    } else {
      // For movies, we use the movie-details endpoint
      const res = await fetch(`${API_BASE}/movie-details/${id}`);
      result = await res.json();
    }
    
    cache.set(cacheKey, result, 1800); // Cache for 30 minutes
    return result;
  },

  // Stream
  getStreams: async (slug: string, id: string, season?: number, episode?: number) => {
    // Do NOT cache streams as they expire quickly
    let url = `${API_BASE}/stream/${slug}/${id}`;
    if (season && episode) {
      url += `?se=${season}&ep=${episode}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('No streams available');
    return await res.json();
  },

  // Captions
  getCaptions: async (slug: string, id: string, streamId: string) => {
    const cacheKey = `captions_${id}_${streamId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/captions/${slug}/${id}/${streamId}`);
    if (!res.ok) return { captions: [] };
    const result = await res.json();
    
    cache.set(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  },

  // Search
  search: async (query: string): Promise<MediaItem[]> => {
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results = (data.results || []).map((item: any) => {
      const subjectType = item.subjectType;
      const isTv = subjectType === 2 || subjectType === '2';
      const isAnimation = subjectType === 3 || subjectType === '3';
      const dubInfo = extractDubLanguage(item as ApiSubject);
      return {
        id: item.subjectId,
        subjectId: item.subjectId,
        title: item.title,
        image: item.image,
        year: item.year,
        rating: item.rating,
        type: isTv ? 'tv' : isAnimation ? 'animation' : 'movie',
        slug: item.slug,
        subjectType: subjectType,
        isDubbed: dubInfo.isDubbed,
        dubLanguage: dubInfo.dubLanguage,
      };
    });
    
    cache.set(cacheKey, results, 300); // Cache for 5 minutes
    return results;
  },

  getSuggestions: async (keyword: string): Promise<string[]> => {
    const cacheKey = `suggest_${keyword}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/search-suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword })
    });
    const data = await res.json();
    const suggestions = data.suggestions || [];
    
    cache.set(cacheKey, suggestions, 3600); // Cache for 1 hour
    return suggestions;
  }
};
