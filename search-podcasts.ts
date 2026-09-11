async function run(term) {
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=vn&entity=podcast&limit=5`);
  const data = await res.json();
  data.results.forEach((r) => {
    console.log(r.collectionName, '->', r.feedUrl);
  });
}
run('HIEU.TV');
run('Better Version');
