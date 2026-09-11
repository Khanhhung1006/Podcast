import Parser from 'rss-parser';
const parser = new Parser();
async function test(url) {
  try {
    const feed = await parser.parseURL(url);
    console.log('SUCCESS:', feed.title);
  } catch(e) {
    console.error('FAIL:', url, e.message);
  }
}
test('https://feeds.transistor.fm/th-vi-n-sach-noi');
test('https://feeds.transistor.fm/phat-tri-n-b-n-than');
test('https://pinecast.com/feed/vu-cao-cuong');
