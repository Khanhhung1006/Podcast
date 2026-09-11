import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import path from 'path';
import Parser from 'rss-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = createClient({
  url: 'file:local.db',
});

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:image', 'itunesImage'] as any,
      ['itunes:duration', 'itunesDuration'] as any,
      ['itunes:author', 'itunesAuthor'] as any,
      ['itunes:summary', 'itunesSummary'] as any,
    ],
    feed: [
      ['itunes:image', 'itunesImage'] as any
    ]
  }
});

// Setup Database Schema
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS podcasts (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      image TEXT,
      author TEXT,
      feedUrl TEXT UNIQUE,
      categories TEXT,
      lastUpdated INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      podcastId TEXT,
      title TEXT,
      description TEXT,
      audioUrl TEXT,
      duration TEXT,
      pubDate INTEGER,
      image TEXT,
      FOREIGN KEY (podcastId) REFERENCES podcasts(id)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS history (
      episodeId TEXT PRIMARY KEY,
      progress INTEGER,
      duration INTEGER,
      lastListened INTEGER
    )
  `);
}

// Helper to generate IDs
import crypto from 'crypto';

function generateId(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// Add a podcast via RSS
async function addPodcast(feedUrl: string, categories: string[] = []) {
  try {
    const feed = await parser.parseURL(feedUrl);
    const podcastId = generateId(feedUrl);
    
    let imageUrl = feed.image?.url;
    if (!imageUrl && feed.itunesImage) {
      imageUrl = feed.itunesImage.href || feed.itunesImage;
    }
    
    await db.execute({
      sql: `INSERT INTO podcasts (id, title, description, image, author, feedUrl, categories, lastUpdated) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(feedUrl) DO UPDATE SET 
            title=excluded.title, description=excluded.description, image=excluded.image, author=excluded.author, lastUpdated=excluded.lastUpdated`,
      args: [
        podcastId, 
        feed.title || '', 
        feed.description || '', 
        imageUrl || '',
        feed.itunes?.author || feed.author || '',
        feedUrl,
        JSON.stringify(categories),
        Date.now()
      ]
    });

    // Add episodes
    for (const item of feed.items) {
      if (!item.enclosure?.url) continue; // Skip if no enclosure
      if (!item.enclosure.type?.startsWith('audio') && !item.enclosure.url.match(/\.(mp3|m4a|aac|wav)(\?|$)/i)) {
        continue; // Skip if not an audio file
      }

      const episodeId = generateId(item.guid || item.link || item.enclosure.url);
      
      let epImageUrl = '';
      if ((item as any).itunesImage) {
        epImageUrl = (item as any).itunesImage?.$?.href || (item as any).itunesImage?.href || (typeof (item as any).itunesImage === 'string' ? (item as any).itunesImage : '');
      }
      if (!epImageUrl) epImageUrl = imageUrl;
      
      let pubDate = 0;
      if (item.pubDate) {
        pubDate = new Date(item.pubDate).getTime();
        if (isNaN(pubDate)) pubDate = 0;
      }

      await db.execute({
        sql: `INSERT OR IGNORE INTO episodes (id, podcastId, title, description, audioUrl, duration, pubDate, image)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          episodeId,
          podcastId,
          item.title || '',
          item.contentSnippet || item.content || (item as any).description || '',
          item.enclosure.url,
          item.itunesDuration || '',
          pubDate,
          epImageUrl || ''
        ]
      });
    }
    
    return true;
  } catch (err) {
    console.error('Error adding podcast:', err);
    return false;
  }
}

// Initial Data Seeding
async function seedData() {
  const rsstolist = [
    { url: 'https://anchor.fm/s/4cfb55bc/podcast/rss', cat: ['Đầu tư', 'Tài chính', 'Phát triển bản thân'] }, // HIEU.TV
    { url: 'https://anchor.fm/s/6d0b6694/podcast/rss', cat: ['Kỹ năng sống', 'Tư duy'] }, // Better Version
    { url: 'https://anchor.fm/s/19d07410/podcast/rss', cat: ['Thiền', 'Tâm lý', 'Cuộc sống'] }, // Minh Niệm
    { url: 'https://feeds.soundcloud.com/users/soundcloud:users:341012174/sounds.rss', cat: ['Lối sống', 'Tâm sự'] }, // Giang Ơi Radio
    { url: 'https://feeds.transistor.fm/th-vi-n-sach-noi', cat: ['Sách', 'Phát triển bản thân'] }, // Thư viện Sách Nói
    { url: 'https://feeds.transistor.fm/phat-tri-n-b-n-than', cat: ['Phát triển bản thân', 'Kỹ năng sống'] }, // Phát triển bản thân
  ];
  
  // Clean up unwanted podcasts (SBS, NHK, Today Explained)
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

  const res = await db.execute('SELECT count(*) as count FROM podcasts');
  if (res.rows[0].count < rsstolist.length) {
    console.log('Seeding podcasts...');
    for (const p of rsstolist) {
      await addPodcast(p.url, p.cat);
    }
  }
}

// API Routes
app.get('/api/podcasts', async (req, res) => {
  const result = await db.execute('SELECT * FROM podcasts ORDER BY lastUpdated DESC');
  res.json(result.rows.map(r => ({...r, categories: JSON.parse(r.categories as string)})));
});

app.get('/api/podcasts/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({ sql: 'SELECT * FROM podcasts WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return res.status(404).json({error: 'Not found'});
  
  const episodesResult = await db.execute({ sql: 'SELECT * FROM episodes WHERE podcastId = ? ORDER BY pubDate DESC', args: [id] });
  
  res.json({
    ...result.rows[0],
    categories: JSON.parse(result.rows[0].categories as string),
    episodes: episodesResult.rows
  });
});

app.get('/api/episodes/latest', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await db.execute({
    sql: `SELECT e.*, p.title as podcastTitle 
          FROM episodes e 
          JOIN podcasts p ON e.podcastId = p.id 
          ORDER BY e.pubDate DESC LIMIT ?`,
    args: [limit]
  });
  res.json(result.rows);
});

app.get('/api/search', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.json({ podcasts: [], episodes: [] });
  
  const searchPattern = `%${q}%`;
  
  const podcastResults = await db.execute({
    sql: `SELECT * FROM podcasts WHERE title LIKE ? OR author LIKE ? OR description LIKE ? LIMIT 10`,
    args: [searchPattern, searchPattern, searchPattern]
  });
  
  const episodeResults = await db.execute({
    sql: `SELECT e.*, p.title as podcastTitle 
          FROM episodes e 
          JOIN podcasts p ON e.podcastId = p.id 
          WHERE e.title LIKE ? OR e.description LIKE ? 
          ORDER BY e.pubDate DESC LIMIT 20`,
    args: [searchPattern, searchPattern]
  });

  res.json({
    podcasts: podcastResults.rows.map(r => ({...r, categories: JSON.parse(r.categories as string)})),
    episodes: episodeResults.rows
  });
});

// Vite Middleware for development
if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (vite) => {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

initDb().then(() => seedData()).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
