const genreNames = new Map([
  [12, 'Adventure'],
  [14, 'Fantasy'],
  [16, 'Animation'],
  [18, 'Drama'],
  [28, 'Action'],
  [35, 'Comedy'],
  [53, 'Thriller'],
  [878, 'Sci-Fi'],
]);

function mapTmdbMovie(movie, fallbackPoster) {
  return {
    id: `tmdb-${movie.id}`,
    title: movie.title || 'Untitled',
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
    rating: Number(movie.vote_average || 0).toFixed(1),
    genre: movie.genre_ids?.map((id) => genreNames.get(id)).filter(Boolean).join(' / ') || 'Film',
    description: movie.overview || 'No overview is available yet.',
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : fallbackPoster,
    duration: 'Movie',
    source: null,
  };
}

async function searchMovies({ apiKey, query, fallbackMovies, fetchImpl = fetch }) {
  const normalizedQuery = query.trim();
  const localFallback = normalizedQuery
    ? fallbackMovies.filter((movie) => `${movie.title} ${movie.genre} ${movie.description}`.toLowerCase().includes(normalizedQuery.toLowerCase()))
    : fallbackMovies;

  if (!apiKey) return { movies: localFallback, source: 'mock' };

  const url = new URL(normalizedQuery
    ? 'https://api.themoviedb.org/3/search/movie'
    : 'https://api.themoviedb.org/3/movie/popular');
  url.searchParams.set('api_key', apiKey);
  if (normalizedQuery) url.searchParams.set('query', normalizedQuery);

  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(`TMDB request failed with status ${response.status}; serving local movie data.`);
      return { movies: localFallback, source: 'mock', notice: 'Movie metadata is temporarily unavailable; showing local picks.' };
    }
    const payload = await response.json();
    return {
      movies: (payload.results || []).map((movie) => mapTmdbMovie(movie, fallbackMovies[0].poster)),
      source: 'tmdb',
    };
  } catch (error) {
    console.warn('TMDB request failed; serving local movie data:', error.message);
    return { movies: localFallback, source: 'mock', notice: 'Movie metadata is temporarily unavailable; showing local picks.' };
  }
}

module.exports = { mapTmdbMovie, searchMovies };
