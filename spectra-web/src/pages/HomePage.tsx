import React, { useEffect, useState } from 'react';

import { ContentRail } from '../components/media/ContentRail';
import { AdBanner } from '../components/common/AdBanner';
import { api } from '../services/api';
import type { MediaItem } from '../types';

export const HomePage: React.FC = () => {
 
  const [trendingItems, setTrendingItems] = useState<MediaItem[]>([]);
  const [westernTV, setWesternTV] = useState<MediaItem[]>([]);
  const [kDrama, setKDrama] = useState<MediaItem[]>([]);
  const [turkishDrama, setTurkishDrama] = useState<MediaItem[]>([]);
  const [arabicDrama, setArabicDrama] = useState<MediaItem[]>([]);
  const [arabicMovies, setArabicMovies] = useState<MediaItem[]>([]);
  const [top100, setTop100] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all required collections in parallel
        const [
          trending,
          western,
          kdrama,
          turkish,
          arabicD,
          arabicM,
          top
        ] = await Promise.all([
          api.getCollection('9028172287106864712'), // Trending Now
          api.getCollection('2337210270994629192'), // Western TV
          api.getCollection('2462114791909901808'), // K-Drama
          api.getCollection('7481476133956322608'), // Turkish Drama
          api.getCollection('5490279765967865272'), // Arabic Drama
          api.getCollection('1581736020528300216'), // Arabic Movies
          api.getCollection('5715714650961068312')  // Top 100
        ]);

        setTrendingItems(trending);
        
        setWesternTV(western);
        setKDrama(kdrama);
        setTurkishDrama(turkish);
        setArabicDrama(arabicD);
        setArabicMovies(arabicM);
        setTop100(top);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      <div className="content-rails" style={{ marginTop: '-100px', paddingTop: '120px', position: 'relative', zIndex: 20, width: '100%' }}>
        <ContentRail title="Trending Now" items={trendingItems} />
        <AdBanner />
        <ContentRail title="Western TV" items={westernTV} />
        <ContentRail title="K-Drama" items={kDrama} />
        <ContentRail title="Turkish Drama" items={turkishDrama} />
        <AdBanner />
        <ContentRail title="Arabic Drama" items={arabicDrama} />
        <ContentRail title="Arabic Movies" items={arabicMovies} />
        <ContentRail title="Top 100" items={top100} />
      </div>
    </div>
  );
};
