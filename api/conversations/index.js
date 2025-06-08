import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, process.env.JWT_SECRET);
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);

    if (req.method === 'GET') {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            sender_type,
            timestamp
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedConversations = conversations.map(conv => ({
        ...conv,
        lastMessage: conv.messages?.[0]?.content || 'No messages yet',
        messageCount: conv.messages?.length || 0
      }));

      res.status(200).json(processedConversations);
    }

    else if (req.method === 'POST') {
      const { customerName, customerEmail, subject } = req.body;

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail,
          subject: subject || 'New Support Request',
          status: 'active',
          priority: 'medium',
          assigned_agent_id: user.userId
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(conversation);
    }

    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conversations API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
