import { createClient } from '@libsql/client';
import Parser from 'rss-parser';
import crypto from 'crypto';

const db = createClient({ url: 'file:local.db' });
const parser = new Parser({ customFields: { item: ['itunes:duration', 'itunes:image'] } });

function generateId(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

async function addPodcast(feedUrl: string, categories: string[] = []) {
  try {
    const feed = await parser.parseURL(feedUrl);
    const podcastId = generateId(feedUrl);
    let imageUrl = feed.image?.url || '';
    if (!imageUrl && feed.itunes?.image) imageUrl = feed.itunes.image;
    if (typeof imageUrl !== 'string') imageUrl = '';

    await db.execute({
      sql: 'INSERT INTO podcasts (id, title, description, image, author, feedUrl, categories, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description, image=excluded.image, author=excluded.author, lastUpdated=excluded.lastUpdated',
      args: [podcastId, feed.title || '', String(feed.description || ''), String(imageUrl || ''), String(feed.itunes?.author || feed.author || ''), feedUrl, JSON.stringify(categories), Date.now()]
    });

    for (const item of feed.items) {
      if (!item.enclosure?.url) continue;
      const episodeId = generateId(item.guid || item.link || item.enclosure.url);
      let epImageUrl = '';
      if ((item as any)['itunes:image']) {
        const i = (item as any)['itunes:image'];
        epImageUrl = i?.$?.href || i?.href || (typeof i === 'string' ? i : '');
      }
      if (!epImageUrl) epImageUrl = imageUrl || '';
      let pubDate = 0;
      if (item.pubDate) {
        pubDate = new Date(item.pubDate).getTime();
        if (isNaN(pubDate)) pubDate = 0;
      }
      let duration = (item as any)['itunes:duration'] || '';
      if (typeof duration !== 'string') duration = String(duration);

      await db.execute({
        sql: 'INSERT OR IGNORE INTO episodes (id, podcastId, title, description, audioUrl, duration, pubDate, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [episodeId, podcastId, String(item.title || ''), String(item.contentSnippet || item.content || (item as any).description || ''), String(item.enclosure.url), duration, pubDate, String(epImageUrl)]
      });
    }
    console.log('Added:', feed.title);
  } catch(e: any) {
    console.error('Error:', feedUrl, e.message);
  }
}

async function run() {
  const removeUrls = [
    'https://feeds.sbs.com.au/sbs-vietnamese',
    'https://www3.nhk.or.jp/rj/podcast/rss/vietnamese.xml',
    'https://feeds.megaphone.fm/VMP5705694065'
  ];
  for (const url of removeUrls) {
    const id = generateId(url);
    await db.execute({ sql: 'DELETE FROM episodes WHERE podcastId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM podcasts WHERE id = ?', args: [id] });
  }

  await addPodcast('https://anchor.fm/s/19d07410/podcast/rss', ['Thiền', 'Tâm lý', 'Cuộc sống']);
  await addPodcast('https://feeds.soundcloud.com/users/soundcloud:users:341012174/sounds.rss', ['Lối sống', 'Tâm sự']);
  console.log('Seeding finished.');
}
run();
