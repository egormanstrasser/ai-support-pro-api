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
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            sender_type,
            sender_name,
            timestamp
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      res.status(200).json(conversations);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
