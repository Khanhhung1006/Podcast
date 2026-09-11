import { createClient } from '@libsql/client';
import Parser from 'rss-parser';
import crypto from 'crypto';

const db = createClient({ url: 'file:local.db' });
const parser = new Parser();

function generateId(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

async function addPodcast(feedUrl: string) {
  const feed = await parser.parseURL(feedUrl);
  const podcastId = generateId(feedUrl);
  
  for (const item of feed.items) {
    if (!item.enclosure?.url) continue;

    const episodeId = generateId(item.guid || item.link || item.enclosure.url);
    
    const args = [
        episodeId,
        podcastId,
        item.title || '',
        item.contentSnippet || item.content || (item as any).description || '',
        item.enclosure.url,
        (item as any).itunesDuration || '',
        item.pubDate ? new Date(item.pubDate).getTime() : 0,
        ''
    ];
    
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO episodes (id, podcastId, title, description, audioUrl, duration, pubDate, image)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args
      });
    } catch(e) {
      console.error('Failed on args:', args, e.message);
      break;
    }
  }
}

addPodcast('https://feeds.sbs.com.au/sbs-vietnamese');
