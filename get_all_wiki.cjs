const https = require('https');

// Map of plant key -> Wikipedia page title
const plants = {
  tomato: 'Tomato',
  basil: 'Basil',
  carrot: 'Carrot',
  lettuce: 'Lettuce',
  pepper: 'Bell pepper',
  strawberry: 'Strawberry',
  cucumber: 'Cucumber',
  sunflower: 'Sunflower',
  mint: 'Mentha',
  lavender: 'Lavandula',
  potato: 'Potato',
  spinach: 'Spinach',
  watermelon: 'Watermelon',
  kale: 'Kale',
  radish: 'Radish',
  broccoli: 'Broccoli',
  onion: 'Onion',
  corn: 'Maize',
  parsley: 'Parsley',
  celery: 'Celery',
  squash: 'Butternut squash',
  pansy: 'Pansy',
  dahlia: 'Dahlia',
  lemon: 'Lemon',
  grape: 'Grape',
  beet: 'Beetroot',
  asparagus: 'Asparagus',
  melon: 'Cantaloupe',
  dill: 'Dill',
  zucchini: 'Zucchini',
  rosemary: 'Rosemary',
  marigold: 'Tagetes',
  garlic: 'Garlic',
  cilantro: 'Coriander',
  pea: 'Pea',
  rose: 'Rose',
  thyme: 'Thyme',
  sage: 'Salvia officinalis',
  oregano: 'Oregano',
  'sweet-potato': 'Sweet potato',
  chili: 'Chili pepper',
  pumpkin: 'Pumpkin',
  eggplant: 'Eggplant',
  bean: 'Green bean',
  'cherry-tomato': 'Cherry tomato',
  zinnia: 'Zinnia',
  petunia: 'Petunia',
  turnip: 'Turnip',
  blueberry: 'Blueberry',
};

const options = { headers: { 'User-Agent': 'CelluloseApp/1.0 (gardening-app)' } };

async function getImg(key, title) {
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
            console.log(`${key}: ${pages[pageId].thumbnail.source}`);
          } else {
            console.log(`${key}: NO_IMAGE`);
          }
        } catch(e) { console.error(`${key}: ERROR ${e.message}`) }
        resolve();
      });
    }).on('error', (e) => {
      console.error(`${key}: NETWORK_ERROR ${e.message}`);
      resolve();
    });
  });
}

(async () => {
  const entries = Object.entries(plants);
  for (const [key, title] of entries) {
    await getImg(key, title);
    await new Promise(r => setTimeout(r, 300));
  }
})();
