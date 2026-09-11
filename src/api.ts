import { Podcast, Episode } from './types';

export const PODCAST_FEEDS = [
  {
    url: 'https://feed.podbean.com/nhkworldvietnamese/feed.xml',
    categories: ['Tin tức', 'Nhật Bản']
  },
  {
    url: 'https://anchor.fm/s/e8a760b0/podcast/rss',
    categories: ['Tin tức', 'Học tập']
  },
  {
    url: 'https://feeds.simplecast.com/qm_9M23r',
    categories: ['Văn hóa', 'Đời sống']
  },
  {
    url: 'https://sbs-vietnamese.libsyn.com/rss',
    categories: ['Tin tức', 'Úc']
  }
];

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

export async function fetchPodcasts(): Promise<Podcast[]> {
  try {
    const response = await fetch('/api/podcasts');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Backend API unavailable, falling back to client-side fetching', e);
  }

  const podcasts = await Promise.all(
    PODCAST_FEEDS.map(feed => fetchRssFeedClient(feed.url, feed.categories).catch(err => {
      console.error(`Failed to fetch ${feed.url}:`, err);
      return null;
    }))
  );

  return podcasts.filter((p): p is Podcast => p !== null);
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

  if (data.status !== 'ok') {
    throw new Error(`RSS conversion failed: ${data.message}`);
  }

  const episodes: Episode[] = await Promise.all(
    (data.items || []).map(async (item: any) => {
      const audioUrl = item.enclosure?.link || item.link;
      const id = await hashString(item.guid || item.link || item.title);
      return {
        id,
        podcastId,
        podcastTitle: data.feed.title,
        podcastImage: data.feed.image || item.thumbnail,
        title: item.title,
        description: item.description?.replace(/<[^>]*>?/gm, '') || '',
        audioUrl,
        duration: '',
        pubDate: new Date(item.pubDate).getTime(),
        image: item.thumbnail || data.feed.image
      };
    })
  );

  return {
    id: podcastId,
    title: data.feed.title,
    description: data.feed.description || '',
    image: data.feed.image,
    author: data.feed.author || '',
    feedUrl,
    categories,
    lastUpdated: Date.now(),
    episodes: episodes.filter(e => e.audioUrl)
  };
}

export async function fetchPodcastById(id: string): Promise<Podcast | null> {
  const podcasts = await fetchPodcasts();
  return podcasts.find(p => p.id === id) || null;
}

export async function searchPodcasts(query: string): Promise<Podcast[]> {
  const podcasts = await fetchPodcasts();
  const q = query.toLowerCase();
  return podcasts.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q) ||
    p.categories.some(c => c.toLowerCase().includes(q))
  );
}
