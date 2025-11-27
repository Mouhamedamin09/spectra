import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import type { MediaItem } from '../../types';
import { Badge } from '../common/Badge';
import '../../styles/MovieCard.css';

interface MovieCardProps {
  item: MediaItem;
}

export const MovieCard: React.FC<MovieCardProps> = ({ item }) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on overlay buttons
    const target = e.target as HTMLElement;
    if (target.closest('.movie-card__action')) {
      return;
    }
    // Navigate to details page
    navigate(`/details/${item.slug}`, { state: { item } });
  };

  return (
    <div className="movie-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="movie-card__poster">
        <img src={item.image} alt={item.title} loading="lazy" />
        
        <div className="movie-card__overlay">
          <Link 
            to={`/details/${item.slug}`} 
            state={{ item }} 
            className="movie-card__action primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Play size={24} fill="currentColor" />
          </Link>
          <Link 
            to={`/details/${item.slug}`} 
            state={{ item }}
            className="movie-card__action secondary"
            onClick={(e) => e.stopPropagation()}
          >
            <Info size={24} />
          </Link>
        </div>

        <div className="movie-card__badges">
          {item.isDubbed && (
            <Badge variant="info" className="dub-badge">
              {item.dubLanguage || 'Dubbed'}
            </Badge>
          )}
          {item.quality && (
            <Badge variant="default" className="quality-badge">{item.quality}</Badge>
          )}
        </div>
      </div>

      <div className="movie-card__info">
        <h3 className="movie-card__title" title={item.title}>{item.title}</h3>
        <div className="movie-card__meta">
          {item.year && <span className="movie-card__year">{item.year}</span>}
          {item.rating && (
            <span className="movie-card__rating">
              <span className="star">★</span> {item.rating}
            </span>
          )}
          <span className="movie-card__type">{item.type === 'tv' ? 'TV Series' : 'Movie'}</span>
        </div>
      </div>
    </div>
  );
};
