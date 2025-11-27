import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Share2, Star } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ContentRail } from '../components/media/ContentRail';
import { AdBanner } from '../components/common/AdBanner';
import { api } from '../services/api';
import { myListService } from '../services/myListService';
import type { MediaItem } from '../types';
import '../styles/DetailsPage.css';

export const DetailsPage: React.FC = () => {
  const { id: slug } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<MediaItem | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isInMyList, setIsInMyList] = useState(false);

  // Check if item is in My List on mount and when item changes
  useEffect(() => {
    if (item?.id) {
      setIsInMyList(myListService.isInList(item.id));
    }
  }, [item]);

  // Check if item is in My List on mount and when item changes
  useEffect(() => {
    if (item?.id) {
      setIsInMyList(myListService.isInList(item.id));
    }
  }, [item]);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      
      // Reset all state when slug changes
      setLoading(true);
      setError(null);
      setItem(null);
      setDetails(null);
      setRecommendations([]);
      setSelectedSeason(1);

      try {
        // Check if location.state has an item for this slug (optimization)
        let currentItem = location.state?.item;
        let subjectId = null;

        // Verify the item from state matches the current slug
        if (currentItem && currentItem.slug === slug) {
          subjectId = currentItem.id || currentItem.subjectId;
        }

        // 1. Get Subject ID if missing or doesn't match
        if (!subjectId) {
          try {
            // Try getting metadata first
            const metadata = await api.getMetadata(slug);
            subjectId = metadata.id || metadata.subjectId;
            
            // If no ID found in metadata, throw to trigger fallback
            if (!subjectId) throw new Error('No ID in metadata');
            
            currentItem = metadata;
            setItem(currentItem);
          } catch (e) {
             // Fallback to getSubjectId endpoint if metadata fails
             subjectId = await api.getSubjectId(slug);
             currentItem = { id: subjectId, title: 'Loading...', image: '', type: 'movie', slug };
             setItem(currentItem);
          }
        } else {
          // Use the item from state if it matches
          setItem(currentItem);
        }

        if (!subjectId) throw new Error('Could not resolve content ID');

        // 2. Determine Type (TV or Movie) - Check subjectType first (like in JS code)
        // subjectType === 2 or '2' means TV show, subjectType === 1 or '1' means movie
        let isTV = false;
        
        // Check subjectType first (primary method from JS code)
        if (currentItem?.subjectType !== undefined) {
          isTV = currentItem.subjectType === 2 || currentItem.subjectType === '2';
        } else if (currentItem?.type === 'tv') {
          isTV = true;
        } else {
          // If type is ambiguous, try TV details first (common pattern in script.js)
          try {
            const tvCheck = await api.getDetails(subjectId, 'tv', slug);
            if (tvCheck && !tvCheck.error && (tvCheck.seasons || tvCheck.subjectType === 2 || tvCheck.subjectType === '2')) {
              isTV = true;
              setDetails(tvCheck);
              setItem((prev: MediaItem | null) => prev ? { ...prev, type: 'tv', subjectType: 2 } : null);
            }
          } catch (e) {
            // Not a TV show, continue as movie
            console.log('TV check failed, treating as movie');
          }
        }

        // 3. Load Full Details
        if (isTV) {
            // Already loaded in check above, or load now
            if (!details) {
                const tvData = await api.getDetails(subjectId, 'tv', slug);
                setDetails(tvData);
                // Update item type to ensure it's marked as TV
                setItem((prev: MediaItem | null) => prev ? { ...prev, type: 'tv', subjectType: 2 } : null);
                if (tvData.seasons?.length > 0) {
                    setSelectedSeason(tvData.seasons[0].se);
                }
            }
            
            // Load Recommendations for TV shows
            try {
                const movieData = await api.getDetails(subjectId, 'movie', slug);
                if (movieData.recommendations) {
                    setRecommendations(movieData.recommendations.map((rec: any) => ({
                        id: rec.subjectId,
                        title: rec.title,
                        image: rec.image,
                        year: rec.year,
                        rating: rec.rating,
                        type: rec.subjectType === 2 || rec.subjectType === '2' ? 'tv' : 'movie',
                        slug: rec.slug,
                        subjectType: rec.subjectType
                    })));
                }
            } catch (e) {
                console.log('No recommendations available for TV show');
            }
        } else {
            // Ensure item is marked as movie
            setItem((prev: MediaItem | null) => prev ? { ...prev, type: 'movie', subjectType: 1 } : null);
            // Load Movie Details
            const movieData = await api.getDetails(subjectId, 'movie', slug);
            setDetails(movieData);
            
            // Load Recommendations
            if (movieData.recommendations) {
                setRecommendations(movieData.recommendations.map((rec: any) => ({
                    id: rec.subjectId,
                    title: rec.title,
                    image: rec.image,
                    year: rec.year,
                    rating: rec.rating,
                    type: 'movie',
                    slug: rec.slug
                })));
            }

            // Check for streams to get duration/quality
            try {
                const streams = await api.getStreams(slug, subjectId);
                if (streams.streams?.length > 0) {
                    const best = streams.streams[0];
                    setDetails((prev: any) => ({
                        ...prev,
                        duration: Math.floor(best.duration_seconds / 60) + ' min',
                        quality: best.quality
                    }));
                }
            } catch (e) {
                console.log('No streams available yet');
            }
        }

      } catch (err: any) {
        console.error('Details load error:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const scrollToEpisodes = () => {
    document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlay = () => {
      if (!item) return;
      navigate(`/watch/${item.slug}`, { state: { item } });
  };

  const handleMyListToggle = () => {
    if (!item) return;
    const added = myListService.toggle(item);
    setIsInMyList(added);
    
    // Dispatch custom event for MyListPage to update
    window.dispatchEvent(new Event('myListUpdated'));
    
    // Show toast notification
    const message = added ? 'Added to My List' : 'Removed from My List';
    showToast(message);
  };

  const handleShare = async () => {
    if (!item) return;
    
    const shareUrl = `https://spectramovie.site/details/${item.slug}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy link');
    }
  };

  const showToast = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };



  if (loading) {
    return (
      <div className="details-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="details-error">
        <div>
          <h2>Content Not Found</h2>
          <p>{error || "The requested content could not be loaded."}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const currentSeason = details?.seasons?.find((s: any) => s.se === selectedSeason);

  // Filter out duplicate cast members based on name (case-insensitive)
  const getUniqueCast = (cast: any[]) => {
    if (!cast || cast.length === 0) return [];
    
    const seen = new Set<string>();
    const unique: any[] = [];
    
    for (const member of cast) {
      const nameKey = member.name?.toLowerCase().trim();
      if (nameKey && !seen.has(nameKey)) {
        seen.add(nameKey);
        unique.push(member);
      }
    }
    
    return unique;
  };

  const uniqueCast = details?.cast ? getUniqueCast(details.cast) : [];

  return (
    <div className="details-page">
      <div className="details-hero">
        <div className="details-hero__backdrop">
          <img src={item.image} alt={item.title} />
          <div className="details-hero__gradient" />
        </div>

        <div className="details-hero__content">
          <div className="details-poster">
            <img src={item.image} alt={item.title} />
          </div>

          <div className="details-info">
            <h1 className="details-title">{item.title}</h1>
            
            <div className="details-meta">
              <span className="meta-item">{item.year || details?.year}</span>
              {details?.duration && (
                <>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">{details.duration}</span>
                </>
              )}
              <span className="meta-separator">•</span>
              <div className="meta-rating">
                <Star size={16} fill="currentColor" className="text-gold" />
                <span>{item.rating || details?.rating || 'N/A'}</span>
              </div>
              {(item.quality || details?.quality) && (
                <Badge variant="default">{item.quality || details?.quality}</Badge>
              )}
            </div>

            <div className="details-genres">
              {details?.genre && details.genre.split(',').map((g: string) => (
                <span key={g} className="genre-tag">{g.trim()}</span>
              ))}
            </div>

            <p className="details-synopsis">{details?.description || item.description}</p>

            <div className="details-actions">
              {item.type === 'tv' ? (
                <Button 
                  variant="primary" 
                  size="lg" 
                  icon={<Play size={24} fill="currentColor" />}
                  onClick={scrollToEpisodes}
                >
                  Watch Episodes
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  size="lg" 
                  icon={<Play size={24} fill="currentColor" />}
                  onClick={handlePlay}
                >
                  Play Now
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                size="lg" 
                icon={isInMyList ? <Check size={24} /> : <Plus size={24} />}
                onClick={handleMyListToggle}
              >
                {isInMyList ? 'In My List' : 'My List'}
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                icon={<Share2 size={24} />}
                onClick={handleShare}
              >
                Share
              </Button>
            </div>

            {uniqueCast.length > 0 && (
              <div className="details-cast">
                <h3>Starring</h3>
                <div className="cast-grid">
                  {uniqueCast.map((member: any, index: number) => (
                    <div key={`${member.name}-${index}`} className="cast-card">
                      <img 
                        src={member.avatar || member.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%231a1a2e"/%3E%3C/svg%3E'} 
                        alt={member.name}
                        className="cast-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%231a1a2e"/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="cast-name">{member.name}</div>
                      {member.character && (
                        <div className="cast-character">{member.character}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {item.type === 'tv' && details?.seasons && (
        <div id="episodes-section" className="episodes-section">
            <div className="episodes-header">
                <h3>Episodes</h3>
                <select 
                    className="season-selector"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                >
                    {details.seasons.map((season: any) => (
                        <option key={season.se} value={season.se}>
                            Season {season.se}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="episode-grid">
                {currentSeason && Array.from({ length: currentSeason.maxEp }).map((_, i) => {
                    const epNum = i + 1;
                    return (
                        <Link 
                            key={epNum} 
                            to={`/watch/${item.slug}?se=${selectedSeason}&ep=${epNum}`}
                            state={{ item }}
                        >
                            <div className="episode-card">
                                <Play size={28} className="play-icon" />
                                <span>Episode {epNum}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="details-related">
          <ContentRail title="You May Also Like" items={recommendations} />
        </div>
      )}

      {/* Ad Banner */}
      <div style={{ marginTop: '40px' }}>
        <AdBanner />
      </div>
    </div>
  );
};
