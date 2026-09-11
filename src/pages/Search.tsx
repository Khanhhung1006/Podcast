import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchPodcasts } from '../api';
import { Search as SearchIcon, Play, Pause, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlayerStore, Episode } from '../store/playerStore';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { play, togglePlay, isPlaying, currentEpisode } = usePlayerStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchPodcasts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const handlePlayEpisode = (episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      togglePlay();
    } else {
      play(episode, results?.episodes || []);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl pb-4 pt-2 -mx-6 px-6 md:-mx-8 md:px-8">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-surface border border-border-color rounded-2xl text-fg placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Bạn muốn nghe gì hôm nay?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8">
        {!debouncedQuery ? (
          <div className="text-center py-20 text-muted">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Nhập tên podcast, tác giả hoặc tập để tìm kiếm</p>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-surface rounded-2xl" />
            <div className="h-32 bg-surface rounded-2xl" />
          </div>
        ) : results && (results.podcasts.length > 0 || results.episodes.length > 0) ? (
          <div className="space-y-10">
            {/* Podcasts Results */}
            {results.podcasts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Podcast</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.podcasts.map((podcast: any) => (
                    <Link to={`/podcast/${podcast.id}`} key={podcast.id} className="group bg-surface hover:bg-surface-hover p-4 rounded-xl transition-all duration-300">
                      <div className="aspect-square rounded-lg bg-gray-800 mb-4 overflow-hidden shadow-lg group-hover:shadow-2xl transition">
                        {podcast.image && <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover" loading="lazy" />}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{podcast.title}</h3>
                      <p className="text-xs text-muted truncate mt-1">{podcast.author}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Episodes Results */}
            {results.episodes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Tập Podcast</h2>
                <div className="flex flex-col gap-2">
                  {results.episodes.map((episode: any) => {
                    const isActive = currentEpisode?.id === episode.id;
                    return (
                      <div 
                        key={episode.id} 
                        onClick={() => handlePlayEpisode(episode)}
                        className={`group flex items-center gap-4 p-4 rounded-xl transition cursor-pointer border border-transparent hover:bg-surface ${isActive ? 'bg-surface-hover' : ''}`}
                      >
                        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                          {episode.image && <img src={episode.image} alt={episode.title} className="w-full h-full object-cover" loading="lazy" />}
                          <button className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition ${isActive ? 'opacity-100' : ''}`}>
                            {isActive && isPlaying ? <Pause className="fill-white w-6 h-6" /> : <Play className="fill-white w-6 h-6 ml-1" />}
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-base mb-1 truncate ${isActive ? 'text-primary' : 'text-fg'}`}>{episode.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted">
                            <span className="truncate max-w-[150px]">{episode.podcastTitle}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(episode.pubDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <p className="text-lg">Không tìm thấy kết quả nào cho "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
