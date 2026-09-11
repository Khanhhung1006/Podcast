import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:local.db' });
async function run() {
  const res = await db.execute({
    sql: 'SELECT title FROM podcasts WHERE title LIKE ?',
    args: ['%việt%']
  });
  console.log('Search lowercase:', res.rows);
  const res2 = await db.execute({
    sql: 'SELECT title FROM podcasts WHERE title LIKE ?',
    args: ['%Việt%']
  });
  console.log('Search uppercase:', res2.rows);
}
run();
