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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [metadataSource, setMetadataSource] = useState<'tmdb' | 'mock'>('mock');
  const [queueMovie, setQueueMovie] = useState<Movie | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
      setMovies(fallbackMovies);
      setMetadataSource('mock');
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
    <main className="space-y-10 py-4">
      <section className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#101116] lg:grid-cols-[0.85fr,1.15fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <p className="eyebrow">The discovery room</p>
          <h1 className="editorial-title mt-4 text-4xl leading-tight sm:text-6xl">Find your next <span className="editorial-serif text-[#c4baff]">favorite.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">Browse ideas for your next shared watch. Movie pages are metadata; add a title to your room playlist and bring a supported video source to play.</p>
          <div className="mt-7 flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal className="h-4 w-4 text-violet-200" />
            {metadataSource === 'tmdb' ? 'Movie metadata · TMDB' : 'Movie metadata · local picks'}
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden sm:min-h-[370px]">
          {movies[0] ? (
            <Image src={movies[0].poster} alt={`${movies[0].title} featured artwork`} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#101116] via-[#101116]/40 to-transparent lg:bg-gradient-to-l" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:inset-y-0 lg:flex lg:max-w-[60%] lg:flex-col lg:justify-end">
            {movies[0] ? (
              <>
                <p className="eyebrow">Featured pick</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{movies[0].title}</h2>
                <p className="mt-2 text-sm text-slate-200">{movies[0].genre} · {movies[0].year} <span className="px-1 text-white/40">/</span> <span className="inline-flex items-center gap-1 text-amber-200"><Star className="h-3 w-3 fill-current" /> {movies[0].rating}</span></p>
                <p className="mt-3 line-clamp-2 max-w-md text-sm leading-6 text-slate-300">{movies[0].description}</p>
                <button type="button" onClick={() => { setQueueMovie(movies[0]); setError(''); }} className="btn-primary mt-5 w-fit">Add to a room playlist <ArrowRight className="ml-2 h-4 w-4" /></button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-7">
        <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input aria-label="Search movie titles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movie titles" className="input pl-11" />
          </div>
          <button type="submit" className="btn-primary min-w-32" disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter by genre">
          {['All', ...recommendedGenres].map((genre) => (
            <button
              key={genre}
              type="button"
              aria-pressed={selectedGenre === genre}
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-full border px-4 py-2 text-xs transition ${selectedGenre === genre ? 'border-violet-200/50 bg-violet-200/10 text-violet-100' : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/30 hover:text-white'}`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {notice ? <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">{notice}</div> : null}
      {error ? <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void searchMovies(query)} className="w-fit underline underline-offset-4">Try again</button></div> : null}

      {queueMovie ? (
        <form onSubmit={queueInRoom} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label htmlFor="queue-room-code" className="text-sm text-slate-300">Add <strong className="text-white">{queueMovie.title}</strong> to a room</label>
              <button type="button" onClick={() => setQueueMovie(null)} className="text-slate-400 hover:text-white" aria-label="Cancel queue"><X className="h-4 w-4" /></button>
            </div>
            <input id="queue-room-code" className="input mt-2 uppercase tracking-[0.2em]" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))} placeholder="Enter room code" maxLength={6} required />
          </div>
          <button type="submit" className="btn-primary">Add to playlist <ArrowRight className="ml-2 h-4 w-4" /></button>
        </form>
      ) : null}

      {isLoading && movies.length === 0 ? (
        <div aria-label="Loading movie titles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="aspect-[2/3] animate-pulse bg-white/[0.06]" /><div className="space-y-3 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" /><div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" /></div></div>)}
        </div>
      ) : null}
      {!isLoading && filteredMovies.length === 0 ? (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No movies found</h2>
          <p className="mt-2 text-sm text-slate-400">Try another search or choose a different genre.</p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredMovies.map((movie) => (
          <article key={movie.id} className="card-hover group overflow-hidden rounded-2xl border border-white/10 bg-[#101116] transition duration-300">
            <div className="relative aspect-[2/3] overflow-hidden bg-black">
              <Image src={movie.poster} alt={`${movie.title} poster`} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
            </div>
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
              <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-400">{movie.description}</p>
              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-500">
                <span>{movie.duration}</span>
                <button type="button" onClick={() => { setQueueMovie(movie); setError(''); }} className="text-xs font-medium text-violet-200 transition hover:text-white">Add to playlist <ArrowRight className="ml-1 inline h-3 w-3" /></button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <p className="border-t border-white/10 pt-5 text-center text-xs leading-5 text-slate-500">Movie suggestions are metadata only, not playable streams. The host must provide a supported direct video URL to start playback.</p>
    </main>
  );
}
