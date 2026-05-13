const https = require('https');
const queries = ['marigold flower', 'rosemary herb', 'zucchini vegetable', 'garlic cloves', 'fresh cilantro'];

async function getImg(query) {
  return new Promise((resolve) => {
    https.get('https://unsplash.com/s/photos/' + encodeURIComponent(query), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/src="https:\/\/images\.unsplash\.com\/(photo-[a-zA-Z0-9-]+)\?/g);
        if (matches) {
          console.log(query + ':', matches[0].replace('src="https://images.unsplash.com/', '').replace('?', ''));
        } else {
          console.log(query + ': no matches');
        }
        resolve();
      });
    });
  });
}

(async () => {
  for (let q of queries) await getImg(q);
})();
