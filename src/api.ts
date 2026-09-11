import { STATIC_PODCASTS } from './data/podcastsData';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

let cachedPodcasts: any[] | null = null;

async function getAllPodcasts(): Promise<any[]> {
  if (cachedPodcasts && cachedPodcasts.length > 0) {
    return cachedPodcasts;
  }

  // Thử tải từ file podcasts.json hoặc API nếu có
  const urls = ['./podcasts.json', '/podcasts.json', `${API_URL}/podcasts`];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedPodcasts = data;
          return data;
        }
      }
    } catch (e) {}
  }

  // Dữ liệu tĩnh luôn sẵn sàng đảm bảo 100% hiển thị đầy đủ kênh!
  cachedPodcasts = STATIC_PODCASTS;
  return STATIC_PODCASTS;
}

export async function fetchPodcasts() {
  const all = await getAllPodcasts();
  return all.map(({ episodes, ...rest }) => rest);
}

// Nạp nhanh RSS trực tiếp trên trình duyệt khi mở kênh
async function parseRssClient(feedUrl: string) {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    const xmlText = await res.text();
    
    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
    return itemMatches.map((itemXml, index) => {
      const title = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')?.trim() || `Tập ${index + 1}`;
      const desc = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<[^>]*>?/gm, '')?.trim() || '';
      let audioUrl = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i)?.[1] || '';
      const pubDateStr = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || '';
      const epImg = itemXml.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)?.[1] || '';

      return {
        id: `ep-${index}-${Date.now()}`,
        title,
        description: desc,
        audioUrl,
        duration: '',
        pubDate: pubDateStr ? new Date(pubDateStr).getTime() : 0,
        image: epImg,
      };
    }).filter(ep => !!ep.audioUrl);
  } catch (e) {
    return [];
  }
}

export async function fetchPodcast(id: string) {
  try {
    const res = await fetch(`${API_URL}/podcasts/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.episodes && data.episodes.length > 0) {
        return data;
      }
    }
  } catch (e) {}

  const all = await getAllPodcasts();
  const found = all.find((p) => p.id === id);
  if (found) {
    if (found.episodes && found.episodes.length > 0) {
      return found;
    }
    if (found.feedUrl) {
      const eps = await parseRssClient(found.feedUrl);
      if (eps.length > 0) {
        found.episodes = eps;
        return { ...found };
      }
    }
    return found;
  }

  throw new Error('Podcast not found');
}

export async function fetchLatestEpisodes(limit = 20) {
  try {
    const res = await fetch(`${API_URL}/episodes/latest?limit=${limit}`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const all = await getAllPodcasts();
  const allEpisodes = all.flatMap((p) => p.episodes || []);
  if (allEpisodes.length > 0) {
    allEpisodes.sort((a, b) => b.pubDate - a.pubDate);
    return allEpisodes.slice(0, limit);
  }
  return [];
}

export async function searchPodcasts(query: string) {
  if (!query) return { podcasts: [], episodes: [] };
  
  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const all = await getAllPodcasts();
  const q = query.toLowerCase();
  
  const podcasts = all
    .filter((p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    .map(({ episodes, ...rest }) => rest);

  const episodes = all
    .flatMap((p) => p.episodes || [])
    .filter((e) => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));

  return { podcasts, episodes };
}
