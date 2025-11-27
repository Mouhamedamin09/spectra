import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Zap, List } from 'lucide-react';
import '../../styles/MobileTabBar.css';

export const MobileTabBar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="mobile-tab-bar">
      <Link to="/" className={`tab-item ${isActive('/') ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      
      <Link to="/movies" className={`tab-item ${isActive('/movies') ? 'active' : ''}`}>
        <Film size={24} />
        <span>Movies</span>
      </Link>
      
      <Link to="/tv-shows" className={`tab-item ${isActive('/tv-shows') ? 'active' : ''}`}>
        <Tv size={24} />
        <span>TV Shows</span>
      </Link>
      
      <Link to="/animation" className={`tab-item ${isActive('/animation') ? 'active' : ''}`}>
        <Zap size={24} />
        <span>Animation</span>
      </Link>
      
      <Link to="/my-list" className={`tab-item ${isActive('/my-list') ? 'active' : ''}`}>
        <List size={24} />
        <span>My List</span>
      </Link>
    </nav>
  );
};
