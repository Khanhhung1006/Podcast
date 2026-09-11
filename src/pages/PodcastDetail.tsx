import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPodcast } from '../api';
import { usePlayerStore, Episode } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { Play, Pause, Clock, Calendar } from 'lucide-react';
import { formatTime } from '../lib/utils';

export default function PodcastDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: podcast, isLoading } = useQuery({ 
    queryKey: ['podcast', id], 
    queryFn: () => fetchPodcast(id!),
    enabled: !!id
  });

  const { play, togglePlay, isPlaying, currentEpisode } = usePlayerStore();
  const { isFollowed, followPodcast, unfollowPodcast } = useLibraryStore();

  const followed = podcast ? isFollowed(podcast.id) : false;

  const handleToggleFollow = () => {
    if (!podcast) return;
    if (followed) {
      unfollowPodcast(podcast.id);
    } else {
      followPodcast({
        id: podcast.id,
        title: podcast.title,
        author: podcast.author,
        image: podcast.image,
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse text-muted">Đang tải...</div>;
  }

  if (!podcast) {
    return <div className="p-8 text-muted">Không tìm thấy Podcast</div>;
  }

  const handlePlayEpisode = (episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      togglePlay();
    } else {
      const q = podcast.episodes.map((e: any) => ({ ...e, podcastTitle: podcast.title }));
      play({ ...episode, podcastTitle: podcast.title }, q);
    }
  };

  return (
    <div className="relative pb-8">
      {/* Header Background */}
      <div 
        className="absolute top-0 left-0 right-0 h-80 opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundImage: `url(${podcast.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      <div className="relative z-10 px-6 pt-12 md:px-8 md:pt-16 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10 items-end">
        <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-bg border border-border-color">
          {podcast.image && <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 pb-2">
          <p className="text-xs uppercase tracking-widest text-muted mb-2 font-semibold">Podcast</p>
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4 text-balance">
            {podcast.title}
          </h1>
          <p className="text-lg md:text-xl text-fg/80 font-medium">
            {podcast.author}
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 mt-10">
        <div className="flex gap-4 mb-10">
          <button 
            onClick={handleToggleFollow}
            className={`font-bold px-8 py-3 rounded-full hover:scale-105 transition active:scale-95 ${
              followed 
                ? "bg-surface text-fg border-2 border-primary" 
                : "bg-fg text-bg"
            }`}
          >
            {followed ? 'Đang theo dõi' : 'Theo Dõi'}
          </button>
        </div>
        
        <p className="text-muted text-sm md:text-base leading-relaxed max-w-3xl mb-12 line-clamp-3">
          {podcast.description?.replace(/<[^>]+>/g, '')}
        </p>

        <h2 className="text-2xl font-bold mb-6">Tất cả tập ({podcast.episodes.length})</h2>
        <div className="flex flex-col gap-2">
          {podcast.episodes.map((episode: any) => {
            const isActive = currentEpisode?.id === episode.id;
            return (
              <div 
                key={episode.id} 
                onClick={() => handlePlayEpisode(episode)}
                className={`group flex items-center gap-4 p-4 rounded-xl transition cursor-pointer border border-transparent hover:bg-surface ${isActive ? 'bg-surface-hover' : ''}`}
              >
                <button className="h-10 w-10 shrink-0 flex items-center justify-center text-muted group-hover:text-fg group-hover:bg-surface-hover rounded-full transition">
                  {isActive && isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-base mb-1 truncate ${isActive ? 'text-primary' : 'text-fg'}`}>{episode.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(episode.pubDate).toLocaleDateString('vi-VN')}</span>
                    {episode.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {episode.duration}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
