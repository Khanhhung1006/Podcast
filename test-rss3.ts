import Parser from 'rss-parser';
const parser = new Parser();
parser.parseURL('https://feed.podbean.com/hieutv/feed.xml').then(feed => {
  console.log(feed.items[0].enclosure);
});
