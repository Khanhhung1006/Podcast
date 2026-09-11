export const API_URL = import.meta.env.VITE_API_URL || '/api';

let cachedPodcasts: any[] | null = null;

async function getStaticPodcasts(): Promise<any[]> {
  if (cachedPodcasts && cachedPodcasts.length > 0) {
    return cachedPodcasts;
  }

  // Tải trực tiếp từ static podcasts.json (chứa 100% tất cả các tập của tất cả các kênh)
  try {
    const res = await fetch('./podcasts.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedPodcasts = data;
        return data;
      }
    }
  } catch (e) {}

  try {
    const res = await fetch('/podcasts.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedPodcasts = data;
        return data;
      }
    }
  } catch (e) {}

  return [];
}

export async function fetchPodcasts() {
  try {
    const res = await fetch(`${API_URL}/podcasts`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {}

  const all = await getStaticPodcasts();
  return all.map(({ episodes, ...rest }) => rest);
}

export async function fetchPodcast(id: string) {
  try {
    const res = await fetch(`${API_URL}/podcasts/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.episodes && data.episodes.length > 10) {
        return data;
      }
    }
  } catch (e) {}

  const all = await getStaticPodcasts();
  const found = all.find((p) => p.id === id);
  if (found) {
    return found;
  }

  throw new Error('Podcast not found');
}

export async function fetchLatestEpisodes(limit = 20) {
  try {
    const res = await fetch(`${API_URL}/episodes/latest?limit=${limit}`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const all = await getStaticPodcasts();
  const allEpisodes = all.flatMap((p) => p.episodes);
  allEpisodes.sort((a, b) => b.pubDate - a.pubDate);
  return allEpisodes.slice(0, limit);
}

export async function searchPodcasts(query: string) {
  if (!query) return { podcasts: [], episodes: [] };
  
  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const all = await getStaticPodcasts();
  const q = query.toLowerCase();
  
  const podcasts = all
    .filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .map(({ episodes, ...rest }) => rest);

  const episodes = all
    .flatMap((p) => p.episodes)
    .filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));

  return { podcasts, episodes };
}
