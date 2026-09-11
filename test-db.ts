import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:local.db' });
async function run() {
  const podcasts = await db.execute('SELECT title FROM podcasts;');
  console.log('Podcasts:', podcasts.rows);
  const search = await db.execute({
    sql: 'SELECT title FROM podcasts WHERE title LIKE ? OR title LIKE ?',
    args: ['%vietnam%', '%Vietnam%']
  });
  console.log('Search:', search.rows);
}
run();
