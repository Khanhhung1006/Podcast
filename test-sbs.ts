import Parser from 'rss-parser';
const parser = new Parser();
async function test() {
  try {
    const feed = await parser.parseURL('https://feeds.sbs.com.au/sbs-vietnamese');
    console.log('Title:', feed.title);
    console.log('Item 0:', feed.items[0].title);
    console.log('Enclosure:', feed.items[0].enclosure);
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
