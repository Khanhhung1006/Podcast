import { createClient } from '@libsql/client';
import Parser from 'rss-parser';
import crypto from 'crypto';

const db = createClient({ url: 'file:local.db' });
const parser = new Parser();

function generateId(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

async function run() {
  const feed = await parser.parseURL('https://feeds.sbs.com.au/sbs-vietnamese');
  console.log('Total items:', feed.items.length);
  for (const item of feed.items) {
      if (!item.enclosure?.url) continue;
      if (!item.enclosure.type?.startsWith('audio') && !item.enclosure.url.match(/\.(mp3|m4a|aac|wav)(\?|$)/i)) {
        continue;
      }
      console.log('Valid item:', item.title);
  }
}
run();
