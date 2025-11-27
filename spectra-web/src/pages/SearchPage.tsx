import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/media/MovieCard';
import { api } from '../services/api';
import type { MediaItem } from '../types';
import '../styles/BrowserPage.css'; // Reuse browser page styles

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setItems([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await api.search(query);
        setItems(results);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Failed to search content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="browser-page" style={{ width: '100%', overflowX: 'hidden' }}>
      <div className="browser-header">
        <h1 className="browser-title">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
      </div>

      <div className="browser-content">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-red-500 mb-4">{error}</h2>
          </div>
        ) : items.length === 0 && query ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-400">No results found for "{query}"</h2>
            <p className="text-gray-500 mt-2">Try searching for something else.</p>
          </div>
        ) : (
          <div className="media-grid">
            {items.map((item) => (
              <MovieCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
