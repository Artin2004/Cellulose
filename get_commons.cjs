const https = require('https');

const terms = ['Radish', 'Dill'];
const options = { headers: { 'User-Agent': 'CelluloseApp/1.0' } };

async function search(term) {
  return new Promise((resolve) => {
    https.get(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${term}&srnamespace=6&utf8=&format=json&srlimit=5`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`Results for ${term}:`);
        json.query.search.forEach(item => console.log(item.title));
        resolve(json.query.search.map(i => i.title));
      });
    });
  });
}

async function getUrl(title) {
  return new Promise((resolve) => {
    const p = encodeURIComponent(title);
    https.get(`https://commons.wikimedia.org/w/api.php?action=query&titles=${p}&prop=imageinfo&iiprop=url&format=json`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        const pages = json.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pages[pageId].imageinfo) {
          console.log(title, pages[pageId].imageinfo[0].url);
        }
        resolve();
      });
    });
  });
}

(async () => {
  for (let t of terms) {
    const titles = await search(t);
    for (let title of titles) await getUrl(title);
  }
})();
