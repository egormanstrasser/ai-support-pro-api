export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const stats = {
      totalConversations: 156,
      activeChats: 23,
      avgResponseTime: 45,
      aiResolutionRate: 78,
      avgSatisfactionScore: 4.2
    };

    return res.status(200).json(stats);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
