import { createClient } from '@libsql/client';
import Parser from 'rss-parser';
import crypto from 'crypto';

const db = createClient({ url: 'file:local.db' });
const parser = new Parser({
  customFields: {
    item: [
      ['itunes:image', 'itunesImage'],
      ['itunes:duration', 'itunesDuration']
    ]
  }
});

async function addPodcast(feedUrl: string) {
  const feed = await parser.parseURL(feedUrl);
  
  for (const item of feed.items) {
    if (!item.enclosure?.url) continue;

    const args = [
        'id', 'pid',
        item.title || '',
        item.contentSnippet || item.content || (item as any).description || '',
        item.enclosure.url,
        (item as any).itunesDuration || '',
        new Date(item.pubDate || '').getTime(),
        (item as any).itunesImage?.href || (item as any).itunesImage || ''
    ];
    
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] !== 'string' && typeof args[i] !== 'number' && typeof args[i] !== 'bigint' && args[i] !== null && !Buffer.isBuffer(args[i])) {
            console.error('Invalid arg at index', i, args[i], typeof args[i]);
            return;
        }
    }
  }
  console.log('All valid for', feedUrl);
}

addPodcast('https://feeds.sbs.com.au/sbs-vietnamese');
addPodcast('https://www3.nhk.or.jp/rj/podcast/rss/vietnamese.xml');
