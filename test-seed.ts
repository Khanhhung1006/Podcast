import Parser from 'rss-parser';
const parser = new Parser();
async function test() {
  try {
    const feed = await parser.parseURL('https://feeds.megaphone.fm/VMP5705694065');
    console.log('Title 1:', feed.title);
  } catch(e) {
    console.error('Error 1:', e.message);
  }
}
test();
