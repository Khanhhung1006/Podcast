import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPodcasts, fetchLatestEpisodes } from '../api';
import { usePlayerStore, Episode } from '../store/playerStore';
import { Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { STATIC_PODCASTS } from '../data/podcastsData';

export default function Home() {
  const { data: podcastsData, isLoading: loadingPodcasts } = useQuery({
    queryKey: ['podcasts'],
    queryFn: fetchPodcasts,
  });

  const { data: latestEpisodes, isLoading: loadingEpisodes } = useQuery({
    queryKey: ['latestEpisodes'],
    queryFn: () => fetchLatestEpisodes(10),
  });

  const { play, togglePlay, isPlaying, currentEpisode } = usePlayerStore();

  // Luôn đảm bảo có dữ liệu 8 kênh podcast ngay cả khi offline hay chưa có API
  const podcasts = (podcastsData && podcastsData.length > 0) ? podcastsData : STATIC_PODCASTS;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      togglePlay();
    } else {
      play(episode, latestEpisodes || []);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
        <PWAInstallButton />
      </header>

      {/* Featured Podcasts */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Podcast Nổi Bật</h2>
        {loadingPodcasts && (!podcasts || podcasts.length === 0) ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-surface animate-pulse rounded-xl aspect-square" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {podcasts?.map((podcast: any) => (
              <Link
                to={`/podcast/${podcast.id}`}
                key={podcast.id}
                className="group bg-surface hover:bg-surface-hover p-4 rounded-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="aspect-square rounded-lg bg-gray-800 mb-4 overflow-hidden shadow-lg group-hover:shadow-2xl transition">
                  {podcast.image && (
                    <img
                      src={podcast.image}
                      alt={podcast.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm truncate">{podcast.title}</h3>
                  <p className="text-xs text-muted truncate mt-1">{podcast.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Latest Episodes */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Mới Cập Nhật</h2>
        {loadingEpisodes && (!latestEpisodes || latestEpisodes.length === 0) ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface animate-pulse rounded-xl h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {latestEpisodes && latestEpisodes.length > 0 ? (
              latestEpisodes.map((episode: any) => {
                const isActive = currentEpisode?.id === episode.id;
                return (
                  <div
                    key={episode.id}
                    className="group flex items-center gap-4 bg-surface hover:bg-surface-hover p-3 rounded-xl transition cursor-pointer"
                  >
                    <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      {episode.image && (
                        <img
                          src={episode.image}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEpisode(episode);
                        }}
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition ${
                          isActive ? 'opacity-100' : ''
                        }`}
                      >
                        {isActive && isPlaying ? (
                          <Pause className="fill-white w-6 h-6" />
                        ) : (
                          <Play className="fill-white w-6 h-6 ml-1" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handlePlayEpisode(episode)}>
                      <h3
                        className={`font-semibold text-sm sm:text-base truncate ${
                          isActive ? 'text-primary' : 'text-fg'
                        }`}
                      >
                        {episode.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted truncate mt-1">
                        {episode.podcastTitle}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">Chọn một kênh podcast ở trên để bắt đầu nghe.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
