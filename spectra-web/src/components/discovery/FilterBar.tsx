import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import '../../styles/FilterBar.css';

export interface FilterState {
  genre: string;
  year: string;
  country: string;
  sort: string;
  classify: string;
  rating: string;
}

interface FilterBarProps {
  type: 'movie' | 'tv' | 'animation';
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

const SORT_OPTIONS = ['ForYou', 'Hottest', 'Latest', 'Rating'];
const LANGUAGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'French dub', label: 'French dub' },
  { value: 'Hindi dub', label: 'Hindi dub' },
  { value: 'Bengali dub', label: 'Bengali dub' },
  { value: 'Urdu dub', label: 'Urdu dub' },
  { value: 'Punjabi dub', label: 'Punjabi dub' },
  { value: 'Tamil dub', label: 'Tamil dub' },
  { value: 'Telugu dub', label: 'Telugu dub' },
  { value: 'Malayalam dub', label: 'Malayalam dub' },
  { value: 'Kannada dub', label: 'Kannada dub' },
  { value: 'Arabic dub', label: 'Arabic dub' },
  { value: 'Tagalog dub', label: 'Tagalog dub' },
  { value: 'Indonesian dub', label: 'Indonesian dub' },
  { value: 'Russian dub', label: 'Russian dub' },
  { value: 'Kurdish sub', label: 'Kurdish sub' },
];

const GENRE_OPTIONS = [
  '', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama',
  'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

const YEAR_OPTIONS = ['', ...Array.from({ length: 50 }, (_, i) => (2024 - i).toString())];
const COUNTRY_OPTIONS = [
  '', 'United States', 'United Kingdom', 'Korea', 'Japan', 'Bangladesh', 'China',
  'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iraq', 'Italy', 'Ivory Coast',
  'Kenya', 'Lebanon', 'Mexico', 'Morocco', 'Nigeria', 'Pakistan', 'Philippines',
  'Russia', 'Saudi Arabia', 'South Africa', 'Spain', 'Syria', 'Thailand', 'Turkey', 'Other'
];

export const FilterBar: React.FC<FilterBarProps> = ({ type, filters, onFilterChange, onApply, onReset }) => {
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSortChange = (sort: string) => {
    onFilterChange({ ...filters, sort });
  };

  const handleLanguageChange = (classify: string) => {
    onFilterChange({ ...filters, classify });
  };

  const handleGenreChange = (genre: string) => {
    onFilterChange({ ...filters, genre });
  };

  const handleYearChange = (year: string) => {
    onFilterChange({ ...filters, year });
  };

  const handleCountryChange = (country: string) => {
    onFilterChange({ ...filters, country });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, rating: e.target.value });
  };

  const hasActiveFilters = filters.genre || filters.year || filters.country || 
    filters.classify || (filters.rating && filters.rating !== '0');

  return (
    <div className="filter-bar" data-type={type} ref={filterBarRef}>
      <div className="filter-bar__container">
        {/* Mobile Toggle Button */}
        <button 
          className="mobile-filter-toggle"
          onClick={() => setIsMobileOpen(true)}
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>

        {/* Filter Content - Desktop */}
        <div className="filter-content-desktop">
          {/* Main Filter Row */}
          <div className="filter-bar__main">
            <div className="filter-group filter-group--primary">
              <div className="filter-group">
                <span className="filter-label">Genre:</span>
                <select
                  className="filter-select"
                  value={filters.genre}
                  onChange={(e) => handleGenreChange(e.target.value)}
                >
                  {GENRE_OPTIONS.map(genre => (
                    <option key={genre || 'all'} value={genre}>
                      {genre || 'All Genres'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <span className="filter-label">Year:</span>
                <select
                  className="filter-select"
                  value={filters.year}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  {YEAR_OPTIONS.map(year => (
                    <option key={year || 'all'} value={year}>
                      {year || 'All Years'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-group filter-group--actions">
              <div className="sort-options">
                {SORT_OPTIONS.map(sort => (
                  <button
                    key={sort}
                    className={`sort-btn ${filters.sort === sort ? 'active' : ''}`}
                    onClick={() => handleSortChange(sort)}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Filter Row */}
          {type !== 'animation' && (
            <div className="filter-bar__secondary">
              <div className="filter-group">
                <span className="filter-label">Country:</span>
                <select
                  className="filter-select"
                  value={filters.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  {COUNTRY_OPTIONS.map(country => (
                    <option key={country || 'all'} value={country}>
                      {country || 'All Countries'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Language:</span>
                <select
                  className="filter-select"
                  value={filters.classify}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {(type === 'movie' || type === 'tv') && (
                <div className="filter-group rating-group">
                  <span className="filter-label">Min Rating: <strong>{filters.rating}</strong></span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.rating}
                    onChange={handleRatingChange}
                    className="rating-slider"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="filter-bar__actions">
            {hasActiveFilters && (
              <button className="reset-btn" onClick={onReset}>
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
            <button className="apply-btn" onClick={onApply}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Filter Content - Mobile Modal (Portal) */}
        {isMobileOpen && createPortal(
          <div className="filter-content-mobile">
            {/* Mobile Header */}
            <div className="mobile-header">
              <h2 className="mobile-title">
                <Filter size={20} className="text-green-500" style={{ color: '#10b981' }} />
                Filters
              </h2>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Filter Row */}
            <div className="filter-bar__main">
              <div className="filter-group filter-group--primary">
                <div className="filter-group">
                  <span className="filter-label">Genre:</span>
                  <select
                    className="filter-select"
                    value={filters.genre}
                    onChange={(e) => handleGenreChange(e.target.value)}
                  >
                    {GENRE_OPTIONS.map(genre => (
                      <option key={genre || 'all'} value={genre}>
                        {genre || 'All Genres'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <span className="filter-label">Year:</span>
                  <select
                    className="filter-select"
                    value={filters.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    {YEAR_OPTIONS.map(year => (
                      <option key={year || 'all'} value={year}>
                        {year || 'All Years'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-group filter-group--actions">
                <div className="sort-options">
                  {SORT_OPTIONS.map(sort => (
                    <button
                      key={sort}
                      className={`sort-btn ${filters.sort === sort ? 'active' : ''}`}
                      onClick={() => handleSortChange(sort)}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Secondary Filter Row */}
            {type !== 'animation' && (
              <div className="filter-bar__secondary">
                <div className="filter-group">
                  <span className="filter-label">Country:</span>
                  <select
                    className="filter-select"
                    value={filters.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                  >
                    {COUNTRY_OPTIONS.map(country => (
                      <option key={country || 'all'} value={country}>
                        {country || 'All Countries'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Language:</span>
                  <select
                    className="filter-select"
                    value={filters.classify}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {LANGUAGE_OPTIONS.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(type === 'movie' || type === 'tv') && (
                  <div className="filter-group rating-group">
                    <span className="filter-label">Min Rating: <strong>{filters.rating}</strong></span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.rating}
                      onChange={handleRatingChange}
                      className="rating-slider"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="filter-bar__actions">
              {hasActiveFilters && (
                <button className="reset-btn" onClick={onReset}>
                  <X size={14} />
                  <span>Clear</span>
                </button>
              )}
              <button 
                className="apply-btn" 
                onClick={() => {
                  onApply();
                  setIsMobileOpen(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
