import React, { useEffect, useState } from 'react'

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const RATING_OPTIONS = [
  { label: 'All Ratings', value: 0 },
  { label: '5+ ★', value: 5 },
  { label: '6+ ★', value: 6 },
  { label: '7+ ★', value: 7 },
  { label: '8+ ★', value: 8 },
  { label: '9+ ★', value: 9 },
]

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Top Rated', value: 'vote_average.desc' },
  { label: 'Newest First', value: 'primary_release_date.desc' },
  { label: 'Oldest First', value: 'primary_release_date.asc' },
  { label: 'Title A-Z', value: 'original_title.asc' },
]

const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'movie' },
  { label: 'TV Series', value: 'tv' },
]

const FilterBar = ({ filters, onFilterChange }) => {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          fetch(`${API_BASE_URL}/genre/movie/list`, API_OPTIONS),
          fetch(`${API_BASE_URL}/genre/tv/list`, API_OPTIONS),
        ]);
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();

        // Merge and deduplicate genres
        const allGenres = [...(movieData.genres || []), ...(tvData.genres || [])];
        const uniqueGenres = Array.from(
          new Map(allGenres.map(g => [g.id, g])).values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        setGenres(uniqueGenres);
      } catch (error) {
        console.log('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  return (
    <div className="filter-bar">
      {/* Type Toggle Pills */}
      <div className="filter-group">
        <label className="filter-label">Type</label>
        <div className="type-pills">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`type-pill ${filters.mediaType === opt.value ? 'active' : ''}`}
              onClick={() => onFilterChange('mediaType', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Dropdown */}
      <div className="filter-group">
        <label className="filter-label">Genre</label>
        <select
          className="filter-select"
          value={filters.genre}
          onChange={(e) => onFilterChange('genre', e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Rating Filter */}
      <div className="filter-group">
        <label className="filter-label">Rating</label>
        <select
          className="filter-select"
          value={filters.minRating}
          onChange={(e) => onFilterChange('minRating', Number(e.target.value))}
        >
          {RATING_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Sort Dropdown */}
      <div className="filter-group">
        <label className="filter-label">Sort By</label>
        <select
          className="filter-select"
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default FilterBar
