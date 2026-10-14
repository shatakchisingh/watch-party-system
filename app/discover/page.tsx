'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { Movie, movies as fallbackMovies, recommendedGenres } from '@/lib/movies/catalog';

type MovieResponse = {
  movies: Movie[];
  source: 'tmdb' | 'mock';
  notice?: string;
};

export default function DiscoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [movies, setMovies] = useState<Movie[]>(fallbackMovies);
  const [metadataSource, setMetadataSource] = useState<'tmdb' | 'mock'>('mock');
  const [queueMovie, setQueueMovie] = useState<Movie | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchSequence = useRef(0);

  async function searchMovies(searchQuery: string) {
    const sequence = ++searchSequence.current;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/movies?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) throw new Error('Movie search is unavailable right now.');
      const payload = (await response.json()) as MovieResponse;
      if (sequence !== searchSequence.current) return;
      setMovies(payload.movies);
      setMetadataSource(payload.source);
      setNotice(payload.notice || '');
    } catch (searchError) {
      if (sequence !== searchSequence.current) return;
      setError(searchError instanceof Error ? searchError.message : 'Movie search is unavailable right now.');
      setNotice('');
    } finally {
      if (sequence === searchSequence.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    void searchMovies('');
  }, []);

  const filteredMovies = useMemo(() => movies.filter((movie) => (
    selectedGenre === 'All' || movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
  )), [movies, selectedGenre]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchMovies(query);
  }

  function queueInRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!queueMovie) return;
    const code = roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError('Enter the six-character code for your watch room.');
      return;
    }
    router.push(`/room/${code}?suggest=${encodeURIComponent(queueMovie.id)}&title=${encodeURIComponent(queueMovie.title)}`);
  }

  return (
    <main className="space-y-8 py-4">
      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Discovery</p>
            <h1 className="mt-2 text-4xl font-black text-white">Find your next watch party</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Explore movie picks, then invite your room to vote on what to watch.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
            <SlidersHorizontal className="h-4 w-4" />
            {metadataSource === 'tmdb' ? 'TMDB movie metadata' : 'Local movie picks'}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movies and titles" className="input pl-10" />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {['All', ...recommendedGenres].map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${selectedGenre === genre ? 'border-brand-500 bg-brand-500/10 text-brand-100' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-brand-400 hover:text-white'}`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {notice ? <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">{notice}</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      {queueMovie ? (
        <form onSubmit={queueInRoom} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label htmlFor="queue-room-code" className="text-sm text-slate-300">Add <strong className="text-white">{queueMovie.title}</strong> to a room</label>
              <button type="button" onClick={() => setQueueMovie(null)} className="text-slate-400 hover:text-white" aria-label="Cancel queue"><X className="h-4 w-4" /></button>
            </div>
            <input id="queue-room-code" className="input mt-2 uppercase tracking-[0.2em]" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))} placeholder="Enter room code" maxLength={6} required />
          </div>
          <button type="submit" className="btn-primary">Suggest to room <ArrowRight className="ml-2 h-4 w-4" /></button>
        </form>
      ) : null}

      {isLoading && movies.length === 0 ? <div className="card animate-pulse p-8 text-center text-slate-400">Finding movie picks…</div> : null}
      {!isLoading && filteredMovies.length === 0 ? (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No movies found</h2>
          <p className="mt-2 text-sm text-slate-400">Try another search or choose a different genre.</p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {filteredMovies.map((movie) => (
          <article key={movie.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
            <Image src={movie.poster} alt={`${movie.title} poster`} width={900} height={900} className="h-72 w-full object-cover" />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{movie.title}</h2>
                  <p className="text-sm text-slate-400">{movie.genre}{movie.year ? ` · ${movie.year}` : ''}</p>
                </div>
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {movie.rating}
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-400">{movie.description}</p>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-slate-500">
                <span>{movie.duration}</span>
                <button type="button" onClick={() => { setQueueMovie(movie); setError(''); }} className="btn-secondary px-3 py-2">Suggest to room</button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <p className="text-center text-sm text-slate-500">Movie suggestions are metadata only. To play a video, the host must provide a supported direct video URL.</p>
    </main>
  );
}
