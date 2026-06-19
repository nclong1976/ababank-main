const { put } = require('@vercel/blob');

const IMAGES = [
  { name: 'images/regenerated_image_1781076270907.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781076270907.png' },
  { name: 'images/regenerated_image_1781076349758.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781076349758.png' },
  { name: 'images/regenerated_image_1781076351185.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781076351185.png' },
  { name: 'images/regenerated_image_1781076471454.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781076471454.png' },
  { name: 'images/regenerated_image_1781076472059.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781076472059.png' },
  { name: 'images/regenerated_image_1781188262145.png', url: 'https://raw.githubusercontent.com/nclong1976/ababank/main/src/assets/images/regenerated_image_1781188262145.png' }
];

module.exports = async function handler(req, res) {
  const secret = req.headers['x-upload-secret'] || req.query.secret;
  if (secret !== process.env.UPLOAD_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const token = process.env.ASSETS_READ_WRITE_TOKEN;
  const results = {};
  const errors = [];
  for (const image of IMAGES) {
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch ' + image.url);
      const buffer = await response.arrayBuffer();
      const blob = await put(image.name, buffer, { access: 'public', contentType: 'image/png', addRandomSuffix: false, token });
      results[image.name] = blob.url;
    } catch (err) {
      errors.push({ name: image.name, error: err.message });
    }
  }
  return res.status(200).json({ success: true, uploaded: results, errors });
};
