// api/blob-upload.js - Vercel Serverless Function for file upload to Vercel Blob
const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.ASSETS_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Blob storage not configured' });
  }

  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).json({ error: 'filename query parameter required' });
  }

  // Validate file type from Content-Type header
  const contentType = req.headers['content-type'] || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image uploads are allowed' });
  }

  try {
    // Collect body buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const blob = await put(filename, buffer, {
      access: 'public',
      token,
      contentType,
    });

    return res.json({ url: blob.url, ok: true });
  } catch (err) {
    console.error('Blob upload error:', err);
    return res.status(500).json({ error: err.message });
  }
};
