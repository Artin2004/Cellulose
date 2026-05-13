const https = require('https');
const options = { headers: { 'User-Agent': 'CelluloseApp/1.0 (gardening-app)' } };

const searchTerms = {
  radish: 'Radishes bunch',
  broccoli: 'Broccoli floret',
  parsley: 'Parsley leaves',
  dill: 'Dill herb fresh',
  zucchini: 'Zucchini garden',
};

async function search(key, term) {
  return new Promise((resolve) => {
    const p = encodeURIComponent(term);
    https.get(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${p}&srnamespace=6&utf8=&format=json&srlimit=3`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const titles = json.query.search.map(s => s.title);
          console.log(`\n--- ${key} (${term}) ---`);
          titles.forEach((t, i) => console.log(`${i+1}. ${t}`));
          resolve(titles[0]); // Return the first hit
        } catch(e) { resolve(null); }
      });
    });
  });
}

async function getUrl(title) {
  if (!title) return;
  return new Promise((resolve) => {
    const p = encodeURIComponent(title);
    https.get(`https://commons.wikimedia.org/w/api.php?action=query&titles=${p}&prop=imageinfo&iiprop=url&format=json`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          console.log(`URL: ${pages[pageId].imageinfo[0].url}`);
        } catch(e) { }
        resolve();
      });
    });
  });
}

(async () => {
  for (const [key, term] of Object.entries(searchTerms)) {
    const firstTitle = await search(key, term);
    await getUrl(firstTitle);
    await new Promise(r => setTimeout(r, 500));
  }
})();
