const Parser = require('rss-parser');
const parser = new Parser();
parser.parseURL('https://vnexpress.net/rss/podcast.rss').then(feed => {
  console.log(feed.items[0]);
});
