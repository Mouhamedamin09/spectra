import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { MediaItem } from '../../types';
import '../../styles/HeroCarousel.css';

interface HeroCarouselProps {
  items: MediaItem[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  if (!items.length) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="hero-carousel">
      <div className="hero-carousel__background" />
      
      <div className="hero-carousel__container">
        {/* POSTER */}
        <div className="hero-carousel__poster">
          <img src={currentItem.image} alt={currentItem.title} />
          <div className="hero-carousel__poster-gradient" />
        </div>

        {/* INFO */}
        <div className="hero-carousel__info">
          <div className="hero-carousel__badges">
            <Badge variant="premium">Featured</Badge>
            {currentItem.quality && <Badge>{currentItem.quality}</Badge>}
            {currentItem.rating && (
              <Badge variant="warning">★ {currentItem.rating}</Badge>
            )}
          </div>

          <h1 className="hero-carousel__title">{currentItem.title}</h1>

          <p className="hero-carousel__synopsis">
            Experience the cinematic journey of {currentItem.title}. Stream unlimited
            entertainment in stunning quality with crystal-clear visuals.
          </p>

          <div className="hero-carousel__actions">
            <Button
              variant="primary"
              size="lg"
              icon={<Play size={24} fill="currentColor" />}
            >
              Watch Now
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={<Info size={24} />}
            >
              More Info
            </Button>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="hero-carousel__controls">
        <button 
          className="carousel-btn"
          onClick={handlePrev}
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="carousel-indicators">
          {items.map((_, i) => (
            <button
              key={i}
              className={`indicator ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button 
          className="carousel-btn"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};