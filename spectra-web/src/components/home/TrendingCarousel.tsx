import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  if (!items.length) return null;

  // Get visible items (previous, current, next)
  const getPrevIndex = () => (currentIndex - 1 + items.length) % items.length;
  const getNextIndex = () => (currentIndex + 1) % items.length;

  return (
    <div className="hero-showcase">
      <div className="hero-showcase__header">
        <h2 className="hero-showcase__label">Featured This Week</h2>
        <div className="hero-showcase__nav">
          <button className="nav-arrow" onClick={handlePrev}>
            <ChevronLeft size={24} />
          </button>
          <button className="nav-arrow" onClick={handleNext}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="hero-showcase__stage">
        {/* Side Cards */}
        <div className="showcase-card showcase-card--left">
          <img src={items[getPrevIndex()].image} alt="" />
        </div>

        {/* Main Card */}
        <div className="showcase-card showcase-card--center">
          <div className="showcase-card__image">
            <img src={items[currentIndex].image} alt={items[currentIndex].title} />
            <div className="showcase-card__overlay" />
          </div>

          <div className="showcase-card__content">
            <div className="showcase-card__badges">
              <Badge variant="premium">Featured</Badge>
              {items[currentIndex].quality && <Badge>{items[currentIndex].quality}</Badge>}
            </div>

            <h1 className="showcase-card__title">{items[currentIndex].title}</h1>

            {items[currentIndex].rating && (
              <div className="showcase-card__rating">
                <Star size={18} fill="#FFD700" color="#FFD700" />
                <span>{items[currentIndex].rating}</span>
                <span className="showcase-card__votes">• 2024</span>
              </div>
            )}

            <p className="showcase-card__description">
              Experience the ultimate entertainment with {items[currentIndex].title}. 
              A thrilling journey that captivates from start to finish.
            </p>

            <div className="showcase-card__actions">
              <Link to={`/details/${items[currentIndex].slug}`} state={{ item: items[currentIndex] }}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play size={20} fill="currentColor" />}
                >
                  Play Now
                </Button>
              </Link>
              <Link to={`/details/${items[currentIndex].slug}`} state={{ item: items[currentIndex] }}>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Info size={20} />}
                >
                  Details
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Side Cards */}
        <div className="showcase-card showcase-card--right">
          <img src={items[getNextIndex()].image} alt="" />
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="hero-showcase__indicators">
        {items.map((_, i) => (
          <button
            key={i}
            className={`showcase-indicator ${i === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};