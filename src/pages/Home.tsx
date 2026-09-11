import React from 'react';
import { usePlayerStore, Episode } from '../store/playerStore';
import { Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { STATIC_PODCASTS } from '../data/podcastsData';

export default function Home() {
  const { play, togglePlay, isPlaying, currentEpisode } = usePlayerStore();

  // Dữ liệu podcast luôn có sẵn 100%
  const podcasts = STATIC_PODCASTS;

  // Lấy danh sách các tập mới nhất từ các kênh podcast có sẵn
  const latestEpisodes: Episode[] = STATIC_PODCASTS.flatMap((p: any) =>
    (p.episodes || []).map((ep: any) => ({
      id: ep.id,
      podcastId: p.id,
      podcastTitle: p.title,
      title: ep.title,
      description: ep.description || '',
      audioUrl: ep.audioUrl,
      duration: ep.duration ? Number(ep.duration) : 1800,
      pubDate: ep.pubDate || Date.now(),
      image: ep.image || p.image,
    }))
  ).slice(0, 15);

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
      play(episode, latestEpisodes);
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {podcasts.map((podcast: any) => (
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
      </section>

      {/* Latest Episodes */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Mới Cập Nhật</h2>
        <div className="flex flex-col gap-2">
          {latestEpisodes.map((episode: any) => {
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
          })}
        </div>
      </section>
    </div>
  );
}
