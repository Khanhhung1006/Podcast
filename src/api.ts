export const API_URL = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_PODCASTS = [
  {
    feedUrl: 'https://anchor.fm/s/19d07410/podcast/rss',
    categories: ['Thiền', 'Tâm lý', 'Cuộc sống'],
  },
  {
    feedUrl: 'https://feeds.soundcloud.com/users/soundcloud:users:341012174/sounds.rss',
    categories: ['Lối sống', 'Tâm sự'],
  },
  {
    feedUrl: 'https://anchor.fm/s/4cfb55bc/podcast/rss',
    categories: ['Đầu tư', 'Tài chính', 'Phát triển bản thân'],
  },
  {
    feedUrl: 'https://anchor.fm/s/6d0b6694/podcast/rss',
    categories: ['Kỹ năng sống', 'Tư duy'],
  },
  {
    feedUrl: 'https://feeds.transistor.fm/th-vi-n-sach-noi',
    categories: ['Sách', 'Phát triển bản thân'],
  },
  {
    feedUrl: 'https://feeds.transistor.fm/phat-tri-n-b-n-than',
    categories: ['Phát triển bản thân', 'Kỹ năng sống'],
  },
];

async function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

async function fetchRssFeedClient(feedUrl: string, categories: string[] = []) {
  const podcastId = await hashString(feedUrl);
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Failed to parse RSS feed: ${feedUrl}`);
  const data = await res.json();
  
  if (data.status !== 'ok') throw new Error(`RSS feed error: ${feedUrl}`);

  const feed = data.feed;
  const items = data.items || [];

  const podcast = {
    id: podcastId,
    title: feed.title || 'Podcast',
    description: feed.description || '',
    image: feed.image || feed.thumbnail || '',
    author: feed.author || '',
    feedUrl,
    categories,
    lastUpdated: Date.now(),
    episodes: [] as any[],
  };

  podcast.episodes = await Promise.all(
    items.map(async (item: any) => {
      const epId = await hashString(item.guid || item.link || item.enclosure?.link || item.title);
      return {
        id: epId,
        podcastId,
        podcastTitle: podcast.title,
        podcastImage: podcast.image,
        title: item.title || '',
        description: item.description?.replace(/<[^>]*>?/gm, '') || '',
        audioUrl: item.enclosure?.link || item.link || '',
        duration: item.duration || '',
        pubDate: item.pubDate ? new Date(item.pubDate).getTime() : 0,
        image: item.thumbnail || item.enclosure?.thumbnail || podcast.image,
      };
    })
  );

  return podcast;
}

async function fetchStaticFallbackAll() {
  const podcasts = await Promise.allSettled(
    DEFAULT_PODCASTS.map((p) => fetchRssFeedClient(p.feedUrl, p.categories))
  );

  const validPodcasts = podcasts
    .filter((p): p is PromiseFulfilledResult<any> => p.status === 'fulfilled')
    .map((p) => p.value);

  return validPodcasts;
}

export async function fetchPodcasts() {
  try {
    const res = await fetch(`${API_URL}/podcasts`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend unreachable, switching to client RSS mode');
  }

  const all = await fetchStaticFallbackAll();
  return all.map(({ episodes, ...rest }) => rest);
}

export async function fetchPodcast(id: string) {
  try {
    const res = await fetch(`${API_URL}/podcasts/${id}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend unreachable, switching to client RSS mode');
  }

  const all = await fetchStaticFallbackAll();
  const found = all.find((p) => p.id === id);
  if (!found) throw new Error('Podcast not found');
  return found;
}

export async function fetchLatestEpisodes(limit = 20) {
  try {
    const res = await fetch(`${API_URL}/episodes/latest?limit=${limit}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend unreachable, switching to client RSS mode');
  }

  const all = await fetchStaticFallbackAll();
  const allEpisodes = all.flatMap((p) => p.episodes);
  allEpisodes.sort((a, b) => b.pubDate - a.pubDate);
  return allEpisodes.slice(0, limit);
}

export async function searchPodcasts(query: string) {
  if (!query) return { podcasts: [], episodes: [] };
  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend unreachable, switching to client RSS mode');
  }

  const all = await fetchStaticFallbackAll();
  const q = query.toLowerCase();
  
  const podcasts = all
    .filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .map(({ episodes, ...rest }) => rest);

  const episodes = all
    .flatMap((p) => p.episodes)
    .filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));

  return { podcasts, episodes };
}

