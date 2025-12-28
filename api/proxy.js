const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // --- LOGIKA AUTHENTICATION ---
  // Action 'getSettings' boleh diakses tanpa token (Public)
  const isPublicAction = req.body.action === 'getSettings';

  if (!isPublicAction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing Token' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ status: 'error', message: 'Invalid Token' });
    }
  }

  // --- PROXY KE GOOGLE APPS SCRIPT ---
  const GAS_URL = process.env.GAS_URL;
  const PROXY_SECRET = process.env.PROXY_SECRET;

  try {
    const payload = {
      ...req.body,
      proxySecret: PROXY_SECRET
    };

    const gasResponse = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Cek Error HTML dari Google (Biasanya karena URL salah)
    const contentType = gasResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
        return res.status(500).json({ status: 'error', message: 'Database Error (GAS returned HTML)' });
    }

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}