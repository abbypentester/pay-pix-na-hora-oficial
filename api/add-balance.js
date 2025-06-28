import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, amount } = request.body;

  if (!userId || !amount) {
    return response.status(400).json({ error: 'User ID and amount are required' });
  }

  try {
    // HINCRBY atomically increments the value of a hash field by the given number.
    const newBalance = await kv.hincrby(`user:${userId}`, 'balance', amount);
    return response.status(200).json({ success: true, newBalance });
  } catch (error) {
    console.error('Error updating balance:', error);
    return response.status(500).json({ error: 'Failed to update balance' });
  }
}