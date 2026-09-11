import fs from 'fs';
import path from 'path';

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

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function extractXmlTag(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match ? match[1].trim() : '';
}

function extractXmlAttr(xml: string, tag: string, attr: string): string {
  const match = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i').exec(xml);
  return match ? match[1] : '';
}

function parseRss(xmlText: string, feedUrl: string, categories: string[]) {
  const podcastId = hashString(feedUrl);
  const cleanXml = xmlText.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  
  const channelTitle = extractXmlTag(cleanXml, 'title') || 'Podcast';
  const channelDesc = extractXmlTag(cleanXml, 'description').replace(/<[^>]*>?/gm, '') || '';
  
  let channelImg = extractXmlAttr(cleanXml, 'itunes:image', 'href');
  if (!channelImg) {
    const imgBlock = extractXmlTag(cleanXml, 'image');
    channelImg = extractXmlTag(imgBlock, 'url');
  }

  const items: any[] = [];
  const itemMatches = cleanXml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = extractXmlTag(itemXml, 'title') || '';
    const description = extractXmlTag(itemXml, 'description').replace(/<[^>]*>?/gm, '') || '';
    const guid = extractXmlTag(itemXml, 'guid') || title;
    const pubDateStr = extractXmlTag(itemXml, 'pubDate') || '';
    const pubDate = pubDateStr ? new Date(pubDateStr).getTime() : 0;
    
    let audioUrl = extractXmlAttr(itemXml, 'enclosure', 'url');
    if (!audioUrl) {
      audioUrl = extractXmlTag(itemXml, 'link');
    }

    let epImg = extractXmlAttr(itemXml, 'itunes:image', 'href') || channelImg;

    if (audioUrl) {
      items.push({
        id: hashString(guid || title),
        podcastId,
        podcastTitle: channelTitle,
        podcastImage: channelImg,
        title,
        description,
        audioUrl,
        duration: '',
        pubDate: isNaN(pubDate) ? 0 : pubDate,
        image: epImg,
      });
    }
  }

  return {
    id: podcastId,
    title: channelTitle,
    description: channelDesc,
    image: channelImg,
    author: extractXmlTag(cleanXml, 'itunes:author') || extractXmlTag(cleanXml, 'author') || '',
    feedUrl,
    categories,
    lastUpdated: Date.now(),
    episodes: items,
  };
}

async function run() {
  console.log('🚀 Đang tải toàn bộ dữ liệu RSS của tất cả các kênh podcast...');
  const podcasts: any[] = [];

  for (const item of DEFAULT_PODCASTS) {
    try {
      console.log(`📡 Đang tải: ${item.feedUrl}`);
      const res = await fetch(item.feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!res.ok) {
        console.warn(`⚠️ Không tải được ${item.feedUrl}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const podcast = parseRss(xml, item.feedUrl, item.categories);
      console.log(`✅ Kênh "${podcast.title}": Tải thành công ${podcast.episodes.length} tập!`);
      podcasts.push(podcast);
    } catch (e: any) {
      console.error(`❌ Lỗi khi tải ${item.feedUrl}:`, e?.message || e);
    }
  }

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'podcasts.json');
  fs.writeFileSync(outputPath, JSON.stringify(podcasts, null, 2), 'utf-8');
  console.log(`🎉 Đã lưu toàn bộ ${podcasts.length} kênh và tất cả các tập vào: ${outputPath}`);
}

run();
