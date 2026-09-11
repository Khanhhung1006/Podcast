export const API_URL = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_PODCASTS = [
  {
    feedUrl: 'https://feed.podbean.com/nhkworldvietnamese/feed.xml',
    categories: ['Tin tức', 'Nhật Bản'],
  },
  {
    feedUrl: 'https://anchor.fm/s/e8a760b0/podcast/rss',
    categories: ['Tin tức', 'Học tập'],
  },
  {
    feedUrl: 'https://feeds.simplecast.com/qm_9M23r',
    categories: ['Văn hóa', 'Đời sống'],
  },
  {
    feedUrl: 'https://sbs-vietnamese.libsyn.com/rss',
    categories: ['Tin tức', 'Úc'],
  },
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
  
  // Try direct RSS XML parsing first via CORS proxy to get ALL episodes (up to 100+)
  try {
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`
    ];
    
    let xmlText = '';
    for (const pUrl of proxyUrls) {
      try {
        const res = await fetch(pUrl);
        if (res.ok) {
          xmlText = await res.text();
          if (xmlText && xmlText.includes('<item>')) break;
        }
      } catch (e) {}
    }

    if (xmlText) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const channel = xmlDoc.querySelector('channel');
      
      const feedTitle = channel?.querySelector('title')?.textContent || 'Podcast';
      const feedDesc = channel?.querySelector('description')?.textContent || '';
      
      let feedImage = channel?.querySelector('image > url')?.textContent || '';
      if (!feedImage) {
        const itunesImg = xmlDoc.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'image')[0] || xmlDoc.querySelector('image');
        feedImage = itunesImg?.getAttribute('href') || feedImage;
      }

      const itemNodes = Array.from(xmlDoc.querySelectorAll('item'));
      if (itemNodes.length > 0) {
        const episodes = await Promise.all(
          itemNodes.map(async (item) => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const guid = item.querySelector('guid')?.textContent || link || title;
            const description = (item.querySelector('description')?.textContent || '').replace(/<[^>]*>?/gm, '');
            
            const enclosure = item.querySelector('enclosure');
            const audioUrl = enclosure?.getAttribute('url') || link || '';
            
            const pubDateStr = item.querySelector('pubDate')?.textContent || '';
            const pubDate = pubDateStr ? new Date(pubDateStr).getTime() : 0;
            
            const itunesImg = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'image')[0];
            const epImage = itunesImg?.getAttribute('href') || feedImage;
            
            const epId = await hashString(guid);
            
            return {
              id: epId,
              podcastId,
              podcastTitle: feedTitle,
              podcastImage: feedImage,
              title,
              description,
              audioUrl,
              duration: '',
              pubDate: isNaN(pubDate) ? 0 : pubDate,
              image: epImage
            };
          })
        );

        // Filter valid audio episodes
        const validEpisodes = episodes.filter(e => e.audioUrl);

        return {
          id: podcastId,
          title: feedTitle,
          description: feedDesc,
          image: feedImage,
          author: channel?.querySelector('author')?.textContent || '',
          feedUrl,
          categories,
          lastUpdated: Date.now(),
          episodes: validEpisodes
        };
      }
    }
  } catch (err) {
    console.warn('DOMParser RSS fetch failed, falling back to rss2json:', err);
  }

  // Fallback to rss2json with count=100
  const apiUrl = `https://api.rss2json.com/v1/api.json?count=100&rss_url=${encodeURIComponent(feedUrl)}`;
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
