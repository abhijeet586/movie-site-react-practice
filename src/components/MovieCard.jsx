import React from 'react'
import { Link } from 'react-router-dom'

const MovieCard = ({ movie , mediaType = 'movie' }) => {
    const title = movie.title || movie.name || 'Untitled';
    const releaseDate = movie.release_date || movie.first_air_date;
    const type = movie.title ? 'movie' : 'tv';

    return (
        <Link to={`/${type}/${movie.id}`} className="movie-card-link">
            <div className="movie-card">
                <img alt={title} src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : './no-movie.png'} />
                <div className="mt-4">
                    <h3>{title}</h3>

                    <div className="content">
                        <div className="rating">
                            <img src="star.svg" alt="Star-Icon" />
                            <p>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                        </div>
                        <span>•</span>
                        <p className="lang">{movie.original_language}</p>
                        <span>•</span>
                        <p className="year">{releaseDate ? releaseDate.split('-')[0] : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default MovieCard