const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  // Handle CORS Preflight (Double check)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  
  // Ambil credentials dari Environment Variables Vercel
  const VALID_USER = process.env.LOGIN_USER || 'intern';
  const VALID_PASS = process.env.LOGIN_PASS || 'magang2025';
  const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

  if (username === VALID_USER && password === VALID_PASS) {
    // Buat Token (Expired 2 jam)
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '2h' });
    return res.status(200).json({ status: 'success', token });
  }

  return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
}