import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL_CRM,
  process.env.SUPABASE_ANON_KEY_CRM
);

function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, process.env.JWT_SECRET_CRM);
}

export default async function handler(req, res) {
  try {
    const decoded = verifyToken(req);

    if (req.method === 'GET') {
      // Get dashboard statistics
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, status, created_at');

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_type, timestamp');

      if (convError || msgError) {
        throw new Error('Database query failed');
      }

      const stats = {
        totalConversations: conversations.length,
        activeChats: conversations.filter(c => c.status === 'active').length,
        avgResponseTime: 45, // seconds
        aiResolutionRate: 78, // percentage
        avgSatisfactionScore: 4.2
      };

      res.status(200).json(stats);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
