async function run() {
  const res = await fetch('https://itunes.apple.com/search?term=ph%C3%A1t%20tri%E1%BB%83n%20b%E1%BA%A3n%20th%C3%A2n&country=vn&entity=podcast&limit=10');
  const data = await res.json();
  data.results.forEach((r: any) => {
    console.log(r.collectionName, '->', r.feedUrl);
  });
}
run();
