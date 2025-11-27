import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from '../../types';
import { MovieCard } from './MovieCard';
import '../../styles/ContentRail.css';

interface ContentRailProps {
  title: string;
  items: MediaItem[];
}

export const ContentRail: React.FC<ContentRailProps> = ({ title, items }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * 0.8;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items.length) return null;

  return (
    <div className="content-rail">
      <div className="content-rail__header">
        <h2 className="content-rail__title">{title}</h2>
        <div className="content-rail__controls">
          <button 
            className="rail-btn" 
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="rail-btn" 
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="content-rail__container" ref={scrollRef}>
        <div className="content-rail__track">
          {items.map((item) => (
            <div key={item.id} className="content-rail__item">
              <MovieCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
