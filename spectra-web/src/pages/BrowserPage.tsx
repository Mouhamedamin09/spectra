import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FilterBar, type FilterState } from '../components/discovery/FilterBar';
import { MovieCard } from '../components/media/MovieCard';
import { api } from '../services/api';
import type { MediaItem } from '../types';
import '../styles/BrowserPage.css';

interface BrowserPageProps {
  title: string;
  type: 'movie' | 'tv' | 'animation';
}

const initialFilters: FilterState = {
  genre: '',
  year: '',
  country: '',
  sort: '',
  classify: '',
  rating: '0',
};

export const BrowserPage: React.FC<BrowserPageProps> = ({ title, type }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (pageNum: number, append: boolean = false, currentFilters?: FilterState) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      // Map type to channelId: movie=1, tv=2, animation=3
      const channelIdMap: { [key: string]: number } = {
        'movie': 1,
        'tv': 2,
        'animation': 1006
      };

      const activeFilters = currentFilters || filters;

      const filterParams: any = {
        page: pageNum,
        perPage: 24, // Increased for better grid filling
        channelId: channelIdMap[type] || 1,
      };
      
      if (activeFilters.genre) filterParams.genre = activeFilters.genre;
      if (activeFilters.year) filterParams.year = activeFilters.year;
      if (activeFilters.country) filterParams.country = activeFilters.country;
      if (activeFilters.sort) filterParams.sort = activeFilters.sort;
      if (activeFilters.classify) filterParams.classify = activeFilters.classify;
      if (activeFilters.rating && activeFilters.rating !== '0') filterParams.rating = activeFilters.rating;

      const { items: newItems, hasMore: moreAvailable } = await api.browse(type, filterParams);
      
      if (append) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setHasMore(moreAvailable);
    } catch (error) {
      console.error('Failed to browse content:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [type, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    loadData(1, false, filters);
  };

  const handleResetFilters = () => {
    const resetFilters = { ...initialFilters };
    setFilters(resetFilters);
    setPage(1);
    setHasMore(true);
    setItems([]);
    loadData(1, false, resetFilters);
  };

  // Initial load and reset when type changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    setFilters(initialFilters);
    loadData(1, false, initialFilters);
  }, [type]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadData(nextPage, true, filters);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, filters]);

  return (
    <div className="browser-page" style={{ width: '100%', overflowX: 'hidden' }}>
      <div className="browser-header">
        <h1 className="browser-title">{title}</h1>
      </div>

      <FilterBar 
        type={type} 
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="browser-content">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <div className="media-grid">
              {items.map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div ref={observerTarget} className="loading-more-indicator">
                {loadingMore && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
