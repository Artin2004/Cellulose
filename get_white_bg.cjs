const https = require('https');

const terms = ['Radish white background', 'Broccoli white background', 'Dill white background'];

const options = { headers: { 'User-Agent': 'CelluloseApp/1.0' } };

async function getImg(term) {
  return new Promise((resolve) => {
    const p = encodeURIComponent(term);
    https.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${p}&utf8=&format=json`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Results for ${term}:`, json.query.search.slice(0,3).map(x=>x.title));
        } catch(e) { console.error(e.message) }
        resolve();
      });
    });
  });
}

(async () => {
  for (let t of terms) await getImg(t);
})();
