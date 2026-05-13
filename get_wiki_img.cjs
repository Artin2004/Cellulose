const https = require('https');

const plants = ['Rosemary', 'Zucchini', 'Tagetes', 'Garlic', 'Coriander', 'Pea', 'Rose'];

const options = {
  headers: {
    'User-Agent': 'CelluloseApp/1.0 (artin@example.com)'
  }
};

async function getImg(plant) {
  return new Promise((resolve) => {
    https.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${plant}&prop=pageimages&format=json&pithumbsize=600`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            console.log(plant.toLowerCase() + ':', pages[pageId].thumbnail.source);
          } else {
            console.log(plant.toLowerCase() + ': no image');
          }
        } catch(e) { console.error(e.message) }
        resolve();
      });
    }).on('error', (e) => {
      console.error(e);
      resolve();
    });
  });
}

(async () => {
  for (let p of plants) await getImg(p);
})();
