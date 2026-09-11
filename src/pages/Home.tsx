import React, { useEffect, useState } from 'react';
import { Podcast, Episode } from '../types';
import { PodcastCard } from '../components/PodcastCard';
import { EpisodeCard } from '../components/EpisodeCard';
import { TrendingUp, Radio } from 'lucide-react';
import { STATIC_PODCASTS } from '../data/podcastsData';

export const Home: React.FC = () => {
  const [featuredPodcasts, setFeaturedPodcasts] = useState<Podcast[]>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // 1. Chuyển đổi STATIC_PODCASTS sang format Podcast chuẩn của giao diện
      const formattedPodcasts: Podcast[] = STATIC_PODCASTS.map((p) => ({
        id: p.id,
        title: p.title,
        author: p.author || 'Tác giả',
        description: p.description || '',
        coverUrl: p.image,
        feedUrl: p.feedUrl,
        category: p.categories?.[0] || 'Podcast',
        episodeCount: p.episodes?.length || 0,
      }));

      // Luôn hiển thị ngay 8 kênh podcast lập tức, không đợi API
      setFeaturedPodcasts(formattedPodcasts);

      // 2. Thử nạp từ backend API hoặc podcasts.json nếu có
      try {
        const res = await fetch('./podcasts.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const allEps = data.flatMap((p: any) =>
              (p.episodes || []).map((ep: any) => ({
                id: ep.id,
                podcastId: p.id,
                podcastTitle: p.title,
                podcastCover: p.image,
                title: ep.title,
                description: ep.description || '',
                audioUrl: ep.audioUrl,
                duration: 1800,
                publishedAt: ep.pubDate ? new Date(ep.pubDate).toISOString() : new Date().toISOString(),
              }))
            );
            if (allEps.length > 0) {
              setRecentEpisodes(allEps.slice(0, 10));
            }
          }
        }
      } catch (e) {}

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {getGreeting()}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Lắng nghe những câu chuyện và kiến thức mới mỗi ngày
          </p>
        </div>
      </div>

      {/* Featured Podcasts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Podcast Nổi Bật
          </h2>
        </div>

        {loading && featuredPodcasts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featuredPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Episodes */}
      {recentEpisodes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Mới Cập Nhật
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEpisodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
