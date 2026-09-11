import Parser from 'rss-parser';
const parser = new Parser();
parser.parseURL('https://feeds.megaphone.fm/VMP5705694065').then(feed => {
  console.log(feed.items[0].enclosure);
}).catch(e => console.error(e));
