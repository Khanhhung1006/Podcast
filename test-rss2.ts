import Parser from 'rss-parser';
const parser = new Parser();
parser.parseURL('https://anchor.fm/s/1f78e478/podcast/rss').then(feed => {
  console.log(feed.items[0]);
});
