const https = require('https');
const options = { headers: { 'User-Agent': 'CelluloseApp/1.0 (gardening-app)' } };

async function getImg(title) {
  return new Promise((resolve) => {
    const p = encodeURIComponent(title);
    https.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${p}&prop=pageimages&format=json&pithumbsize=800`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            console.log(pages[pageId].thumbnail.source);
          } else {
            console.log('NO_IMAGE');
          }
        } catch(e) { console.error('ERROR') }
        resolve();
      });
    });
  });
}

(async () => {
  await getImg('Zucchini');
})();
