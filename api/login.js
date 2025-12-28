const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { username, password } = req.body;
  
  const GAS_URL = process.env.GAS_URL;
  const PROXY_SECRET = process.env.PROXY_SECRET;
  const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

  try {
    // Tanya ke GAS: Valid gak user ini?
    const gasResponse = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        proxySecret: PROXY_SECRET,
        username: username,
        password: password
      })
    });

    const gasResult = await gasResponse.json();

    if (gasResult.status === 'success') {
      // Buat Token JWT
      const token = jwt.sign({ 
        user: username, 
        name: gasResult.user.name 
      }, JWT_SECRET, { expiresIn: '4h' });
      
      return res.status(200).json({ status: 'success', token, user: gasResult.user });
    } else {
      return res.status(401).json({ status: 'error', message: gasResult.message });
    }

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}