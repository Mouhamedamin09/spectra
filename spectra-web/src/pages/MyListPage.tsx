import React, { useEffect, useState } from 'react';
import { MovieCard } from '../components/media/MovieCard';
import { myListService } from '../services/myListService';
import type { MediaItem } from '../types';
import '../styles/BrowserPage.css';

export const MyListPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);

  const loadMyList = () => {
    const savedItems = myListService.getAll();
    setItems(savedItems);
  };

  useEffect(() => {
    loadMyList();

    // Listen for storage changes (in case user opens multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spectra_my_list') {
        loadMyList();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    const handleMyListUpdate = () => {
      loadMyList();
    };
    
    window.addEventListener('myListUpdated', handleMyListUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('myListUpdated', handleMyListUpdate);
    };
  }, []);

  return (
    <div className="browser-page" style={{ width: '100%', overflowX: 'hidden' }}>
      <div className="browser-header">
        <h1 className="browser-title">My List</h1>
        <p style={{ color: 'var(--color-text-grey)', marginTop: '8px' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      <div className="browser-content">
        {items.length === 0 ? (
          <div className="text-center py-12" style={{ padding: '80px 20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-grey)', marginBottom: '12px' }}>
              Your list is empty
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Add movies and TV shows to your list by clicking the + button
            </p>
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
