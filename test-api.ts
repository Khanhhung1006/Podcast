async function run() {
  const res = await fetch('http://localhost:3000/api/search?q=' + encodeURIComponent('việt'));
  const data = await res.json();
  console.log('Podcasts:', data.podcasts.map(p => p.title));
  console.log('Episodes:', data.episodes.map(e => e.title));
}
run();
