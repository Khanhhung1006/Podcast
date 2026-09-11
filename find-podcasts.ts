async function run() {
  const res = await fetch('https://itunes.apple.com/search?term=s%C3%A1ch&country=vn&entity=podcast&limit=10');
  const data = await res.json();
  data.results.forEach((r: any) => {
    console.log(r.collectionName, '->', r.feedUrl);
  });
}
run();
