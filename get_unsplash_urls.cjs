const https = require('https');

const urls = [
  'https://unsplash.com/photos/green-and-brown-plant-on-black-textile-pbdj5YkTTRk',
  'https://unsplash.com/photos/green-plant-in-close-up-photography-N73L0EzbJ8Y',
  'https://unsplash.com/photos/a-group-of-bananas-3o72hSvigbk',
  'https://unsplash.com/photos/aerial-view-of-fresh-celery-on-wooden-background-sP8jBZftNHM',
  'https://unsplash.com/photos/a-close-up-of-a-bunch-of-green-grass-kgb34f0HRSc'
];

async function fetchMetaImage(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="([^"]+)"/);
        if (match) {
          console.log(match[1]);
        } else {
          console.log(`Failed for ${url}`);
        }
        resolve();
      });
    }).on('error', () => resolve());
  });
}

(async () => {
  for (const url of urls) {
    await fetchMetaImage(url);
  }
})();
