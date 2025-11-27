import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import '../../styles/Header.css';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (searchQuery.length >= 2) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          const results = await import('../../services/api').then(m => m.api.getSuggestions(searchQuery));
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const performSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    performSearch(suggestion);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header__container">
        <div className="header__left">
          <Link to="/" className="header__logo">
            <img src="/spectra-logo.png" alt="Spectra" />
          </Link>
          
          <nav className="header__nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/movies" className={`nav-link ${isActive('/movies') ? 'active' : ''}`}>Movies</Link>
            <Link to="/tv-shows" className={`nav-link ${isActive('/tv-shows') ? 'active' : ''}`}>TV Shows</Link>
            <Link to="/animation" className={`nav-link ${isActive('/animation') ? 'active' : ''}`}>Animation</Link>
            <Link to="/my-list" className={`nav-link ${isActive('/my-list') ? 'active' : ''}`}>My List</Link>
          </nav>
        </div>

        <div className="header__right">
          <div className={`search-bar ${isSearchOpen ? 'open' : ''}`}>
            <Search size={20} className="search-icon" onClick={() => setIsSearchOpen(!isSearchOpen)} />
            <input
              type="text"
              placeholder="Titles, people, genres"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking them
                setTimeout(() => {
                  if (!searchQuery) setIsSearchOpen(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              ref={searchInputRef}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search size={14} className="suggestion-icon" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className="icon-btn" aria-label="Profile">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
