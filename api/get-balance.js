import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = request.query;

  if (!userId) {
    return response.status(400).json({ error: 'User ID is required' });
  }

  try {
    // HGET returns the value associated with a field in the hash stored at a key.
    const balance = await kv.hget(`user:${userId}`, 'balance');
    const finalBalance = balance || 0;
    return response.status(200).json({ balance: finalBalance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return response.status(500).json({ error: 'Failed to fetch balance' });
  }
}