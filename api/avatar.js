// api/avatar.js - Vercel Serverless Function for user avatar management
const { put } = require('@vercel/blob');
const db = require('../db');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlParts = req.url.split('/');
  const userId = urlParts[urlParts.length - 2]; // /api/avatar/{userId}

  if (req.method === 'PATCH') {
    try {
      const { avatar_url } = req.body;
      if (!avatar_url) {
        return res.status(400).json({ error: 'avatar_url is required' });
      }
      // Validate it's a URL
      try { new URL(avatar_url); } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      await db.query(
        'UPDATE users SET avatar_url = $1 WHERE id = $2',
        [avatar_url, userId]
      );

      const userResult = await db.query(
        'SELECT id, name, email, phone, role, avatar_url, is_locked FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows || userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ ok: true, user: userResult.rows[0] });
    } catch (err) {
      console.error('Avatar update error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
