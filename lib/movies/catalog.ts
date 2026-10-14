import fallbackMovies from './catalog.json';

export type Movie = {
  id: string;
  title: string;
  year: number;
  rating: number | string;
  genre: string;
  description: string;
  poster: string;
  duration: string;
  source: string | null;
};

export const movies: Movie[] = fallbackMovies;
export const recommendedGenres = ['Action', 'Adventure', 'Sci-Fi', 'Thriller', 'Animation', 'Drama'];
