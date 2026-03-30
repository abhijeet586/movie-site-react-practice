import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from './Spinner'

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const MovieDetail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [credits, setCredits] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [watchLink, setWatchLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError('');
      try {
        const mediaType = type || 'movie';
        const [detailRes, creditsRes, watchRes] = await Promise.all([
          fetch(`${API_BASE_URL}/${mediaType}/${id}`, API_OPTIONS),
          fetch(`${API_BASE_URL}/${mediaType}/${id}/credits`, API_OPTIONS),
          fetch(`${API_BASE_URL}/${mediaType}/${id}/watch/providers`, API_OPTIONS),
        ]);

        if (!detailRes.ok) throw new Error('Failed to fetch details');

        const detailData = await detailRes.json();
        setDetail(detailData);

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCredits(creditsData);
        }

        if (watchRes.ok) {
          const watchData = await watchRes.json();
          // Try user's likely regions, fallback to first available
          const results = watchData.results || {};
          const regionData = results.IN || results.US || results.GB || Object.values(results)[0];
          if (regionData) {
            setWatchProviders(regionData);
            setWatchLink(regionData.link || '');
          }
        }
      } catch (err) {
        console.log('Error fetching movie details:', err);
        setError('Failed to load details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [type, id]);

  if (isLoading) {
    return (
      <main>
        <div className="pattern" />
        <div className="wrapper detail-loading">
          <Spinner />
        </div>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main>
        <div className="pattern" />
        <div className="wrapper detail-loading">
          <p className="text-red-400 text-lg">{error || 'Not found'}</p>
          <button className="back-btn" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </main>
    );
  }

  const title = detail.title || detail.name || 'Untitled';
  const releaseDate = detail.release_date || detail.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  const runtime = detail.runtime
    ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`
    : detail.episode_run_time?.length
      ? `${detail.episode_run_time[0]} min/ep`
      : null;
  const rating = detail.vote_average ? detail.vote_average.toFixed(1) : 'N/A';
  const backdropUrl = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
    : null;
  const posterUrl = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : './no-movie.png';
  const director = credits?.crew?.find(c => c.job === 'Director');
  const topCast = credits?.cast?.slice(0, 6) || [];
  const seasons = detail.number_of_seasons;
  const episodes = detail.number_of_episodes;

  return (
    <main>
      {/* Backdrop */}
      <div className="detail-backdrop">
        {backdropUrl && <img src={backdropUrl} alt={title} />}
        <div className="detail-backdrop-overlay" />
      </div>

      <div className="wrapper detail-wrapper">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span>←</span> Back
        </button>

        <div className="detail-content">
          {/* Poster */}
          <div className="detail-poster">
            <img src={posterUrl} alt={title} />
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>
            {detail.tagline && (
              <p className="detail-tagline">"{detail.tagline}"</p>
            )}

            <div className="detail-meta">
              <div className="detail-rating">
                <img src="star.svg" alt="rating" />
                <span>{rating}</span>
                <span className="detail-vote-count">
                  ({detail.vote_count?.toLocaleString()} votes)
                </span>
              </div>
              {year !== 'N/A' && <span className="detail-meta-item">{year}</span>}
              {runtime && <span className="detail-meta-item">{runtime}</span>}
              {detail.original_language && (
                <span className="detail-meta-item detail-lang">{detail.original_language.toUpperCase()}</span>
              )}
              {seasons && (
                <span className="detail-meta-item">{seasons} Season{seasons > 1 ? 's' : ''}</span>
              )}
              {episodes && (
                <span className="detail-meta-item">{episodes} Episodes</span>
              )}
            </div>

            {/* Genres */}
            {detail.genres?.length > 0 && (
              <div className="detail-genres">
                {detail.genres.map(g => (
                  <span key={g.id} className="genre-pill">{g.name}</span>
                ))}
              </div>
            )}

            {/* Where to Watch */}
            <div className="detail-watch">
              <h3>Where to Watch</h3>
              {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) ? (
                <>
                  {watchProviders.flatrate && (
                    <div className="watch-category">
                      <span className="watch-label">Stream</span>
                      <div className="watch-providers">
                        {watchProviders.flatrate.map(p => (
                          <a
                            key={p.provider_id}
                            href={watchLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-provider"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                            <span>{p.provider_name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchProviders.rent && (
                    <div className="watch-category">
                      <span className="watch-label">Rent</span>
                      <div className="watch-providers">
                        {watchProviders.rent.map(p => (
                          <a
                            key={p.provider_id}
                            href={watchLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-provider"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                            <span>{p.provider_name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchProviders.buy && (
                    <div className="watch-category">
                      <span className="watch-label">Buy</span>
                      <div className="watch-providers">
                        {watchProviders.buy.map(p => (
                          <a
                            key={p.provider_id}
                            href={watchLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-provider"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                            <span>{p.provider_name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchLink && (
                    <a
                      href={watchLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="watch-all-link"
                    >
                      View all watch options →
                    </a>
                  )}
                </>
              ) : (
                <p className="watch-unavailable">Watch provider info not available for your region.</p>
              )}
            </div>

            {/* Overview */}
            {detail.overview && (
              <div className="detail-overview">
                <h3>Overview</h3>
                <p>{detail.overview}</p>
              </div>
            )}

            {/* Director */}
            {director && (
              <div className="detail-crew">
                <h3>Director</h3>
                <p>{director.name}</p>
              </div>
            )}

            {/* Cast */}
            {topCast.length > 0 && (
              <div className="detail-cast">
                <h3>Top Cast</h3>
                <div className="cast-grid">
                  {topCast.map(actor => (
                    <div key={actor.id} className="cast-card">
                      <img
                        src={actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : './no-movie.png'}
                        alt={actor.name}
                      />
                      <div>
                        <p className="cast-name">{actor.name}</p>
                        <p className="cast-character">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Production Companies */}
            {detail.production_companies?.length > 0 && (
              <div className="detail-production">
                <h3>Production</h3>
                <div className="production-list">
                  {detail.production_companies.filter(c => c.logo_path).slice(0, 4).map(company => (
                    <div key={company.id} className="production-item">
                      <img
                        src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                        alt={company.name}
                        title={company.name}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default MovieDetail
