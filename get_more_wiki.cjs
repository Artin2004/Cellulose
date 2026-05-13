const https = require('https');

const plants = ['Sweet potato', 'Chili pepper', 'Eggplant', 'Green bean', 'Cherry tomato', 'Zinnia', 'Petunia', 'Turnip', 'Dill'];

const options = {
  headers: { 'User-Agent': 'CelluloseApp/1.0' }
};

async function getImg(plant) {
  return new Promise((resolve) => {
    const p = encodeURIComponent(plant);
    https.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${p}&prop=pageimages&format=json&pithumbsize=960`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            console.log(plant + ':', pages[pageId].thumbnail.source);
          } else {
            console.log(plant + ': no image');
          }
        } catch(e) { console.error(e.message) }
        resolve();
      });
    });
  });
}

(async () => {
  for (let p of plants) await getImg(p);
})();
