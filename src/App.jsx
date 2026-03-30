import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import FilterBar from './components/FilterBar';
import MovieDetail from './components/MovieDetail';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [filters, setFilters] = useState({
    mediaType: 'all',
    genre: '',
    minRating: 0,
    sortBy: 'popularity.desc',
  });

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let results = [];

      if (query) {
        // Search mode — search across the selected type(s)
        const types = filters.mediaType === 'all' ? ['movie', 'tv'] : [filters.mediaType];

        const fetches = types.map(async (t) => {
          const endpoint = `${API_BASE_URL}/search/${t}?query=${encodeURIComponent(query)}`;
          const response = await fetch(endpoint, API_OPTIONS);
          if (!response.ok) throw new Error(`Failed to search ${t}`);
          const data = await response.json();
          return (data.results || []).map(item => ({ ...item, _mediaType: t }));
        });

        const allResults = await Promise.all(fetches);
        results = allResults.flat();

      } else {
        // Discover mode — use filters
        const types = filters.mediaType === 'all' ? ['movie', 'tv'] : [filters.mediaType];

        const fetches = types.map(async (t) => {
          let endpoint = `${API_BASE_URL}/discover/${t}?sort_by=${filters.sortBy}`;

          if (filters.genre) {
            endpoint += `&with_genres=${filters.genre}`;
          }
          if (filters.minRating > 0) {
            endpoint += `&vote_average.gte=${filters.minRating}&vote_count.gte=100`;
          }

          const response = await fetch(endpoint, API_OPTIONS);
          if (!response.ok) throw new Error(`Failed to discover ${t}`);
          const data = await response.json();
          return (data.results || []).map(item => ({ ...item, _mediaType: t }));
        });

        const allResults = await Promise.all(fetches);
        results = allResults.flat();

        // Sort merged results
        if (filters.sortBy === 'popularity.desc') {
          results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        } else if (filters.sortBy === 'vote_average.desc') {
          results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        } else if (filters.sortBy === 'primary_release_date.desc') {
          results.sort((a, b) => {
            const da = a.release_date || a.first_air_date || '';
            const db = b.release_date || b.first_air_date || '';
            return db.localeCompare(da);
          });
        } else if (filters.sortBy === 'primary_release_date.asc') {
          results.sort((a, b) => {
            const da = a.release_date || a.first_air_date || '';
            const db = b.release_date || b.first_air_date || '';
            return da.localeCompare(db);
          });
        } else if (filters.sortBy === 'original_title.asc') {
          results.sort((a, b) => {
            const ta = (a.title || a.name || '').toLowerCase();
            const tb = (b.title || b.name || '').toLowerCase();
            return ta.localeCompare(tb);
          });
        }
      }

      if (results.length === 0) {
        setErrorMessage('No results found.');
        setMovieList([]);
        return;
      }

      setMovieList(results);

      if (query && results.length > 0) {
        await updateSearchCount(query, results[0]);
      }
    } catch (error) {
      console.log(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.')
    } finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.log(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm, filters])

  useEffect(() => {
    loadTrendingMovies();
  }, [])

  const sectionTitle = filters.mediaType === 'tv'
    ? 'TV Series'
    : filters.mediaType === 'movie'
      ? 'Movies'
      : 'Movies & TV Series';

  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="hero banner" />
            <h1><span className="text-gradient"> Movies</span> to Binge</h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>
          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>

              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <Link to={`/movie/${movie.movie_id}`} className="trending-link">
                      <p>{index + 1}</p>
                      <img src={movie.poster_url} alt={movie.title} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <FilterBar filters={filters} onFilterChange={handleFilterChange} />

          <section className="all-movies">
            <h2>{searchTerm ? `Search Results` : sectionTitle}</h2>
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500">Error fetching movies</p>
            ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={`${movie._mediaType}-${movie.id}`} movie={movie} mediaType={movie._mediaType} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

const App = () => {
  return (
    <BrowserRouter basename="/movie-site-react-practice/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:type/:id" element={<MovieDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App