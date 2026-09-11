import { createClient } from '@libsql/client';
import Parser from 'rss-parser';

const db = createClient({ url: 'file:local.db' });
const parser = new Parser();

async function run() {
  const rsstolist = [
    { url: 'https://feeds.sbs.com.au/sbs-vietnamese', cat: ['Thời sự', 'Trò chuyện'] },
    { url: 'https://www3.nhk.or.jp/rj/podcast/rss/vietnamese.xml', cat: ['Tin tức', 'Thời sự'] },
    { url: 'https://feeds.megaphone.fm/VMP5705694065', cat: ['Kinh doanh', 'Quốc tế'] },
    { url: 'https://feeds.transistor.fm/th-vi-n-sach-noi', cat: ['Sách', 'Phát triển bản thân'] },
    { url: 'https://feeds.transistor.fm/phat-tri-n-b-n-than', cat: ['Phát triển bản thân', 'Kỹ năng sống'] },
    { url: 'https://anchor.fm/s/4cfb55bc/podcast/rss', cat: ['Đầu tư', 'Tài chính', 'Phát triển bản thân'] }, // HIEU.TV
    { url: 'https://anchor.fm/s/6d0b6694/podcast/rss', cat: ['Kỹ năng sống', 'Tư duy'] }, // Better Version
  ];

  await db.execute(`
    CREATE TABLE IF NOT EXISTS podcasts (
      id TEXT PRIMARY KEY,
      title TEXT,
      author TEXT,
      description TEXT,
      image TEXT,
      categories TEXT,
      feedUrl TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      podcastId TEXT,
      title TEXT,
      description TEXT,
      pubDate TEXT,
      audioUrl TEXT,
      image TEXT,
      duration TEXT,
      FOREIGN KEY (podcastId) REFERENCES podcasts (id)
    )
  `);

  for (const item of rsstolist) {
    try {
      console.log('Fetching', item.url);
      const feed = await parser.parseURL(item.url);
      const podcastId = Buffer.from(item.url).toString('base64');
      
      const image = feed.image?.url || feed.itunes?.image || '';
      
      await db.execute({
        sql: 'INSERT OR IGNORE INTO podcasts (id, title, author, description, image, categories, feedUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          podcastId, 
          feed.title || '', 
          feed.itunes?.author || '', 
          feed.description || '', 
          image,
          JSON.stringify(item.cat),
          item.url
        ]
      });

      for (const ep of feed.items || []) {
        const epId = ep.guid || ep.link || ep.title;
        if (!epId) continue;
        const epImage = ep.itunes?.image || image;
        
        await db.execute({
          sql: 'INSERT OR IGNORE INTO episodes (id, podcastId, title, description, pubDate, audioUrl, image, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            epId,
            podcastId,
            ep.title || '',
            ep.contentSnippet || ep.content || '',
            ep.isoDate || ep.pubDate || '',
            ep.enclosure?.url || '',
            epImage,
            ep.itunes?.duration || ''
          ]
        });
      }
      console.log('Added', feed.title);
    } catch(err) {
      console.error('Failed to process', item.url, err);
    }
  }
}
run();
