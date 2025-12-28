const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // 1. Verifikasi Token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Missing Token' });
  }

  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ status: 'error', message: 'Invalid or Expired Token' });
  }

  // 2. Kirim ke Google Apps Script
  const GAS_URL = process.env.GAS_URL;
  const PROXY_SECRET = process.env.PROXY_SECRET;

  if (!GAS_URL || !PROXY_SECRET) {
    return res.status(500).json({ status: 'error', message: 'Server Misconfiguration (Missing Env)' });
  }

  try {
    // Inject Secret
    const payload = {
      ...req.body,
      proxySecret: PROXY_SECRET
    };

    const gasResponse = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Cek jika GAS mengembalikan HTML (Error)
    const contentType = gasResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
        const text = await gasResponse.text();
        console.error("GAS Error HTML:", text);
        return res.status(500).json({ status: 'error', message: 'Database Error (GAS returned HTML)' });
    }

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}