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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get total conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, status, created_at');

    if (convError) throw convError;

    // Get total messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, sender_type, timestamp');

    if (msgError) throw msgError;

    // Calculate metrics
    const totalConversations = conversations.length;
    const activeChats = conversations.filter(c => c.status === 'active').length;
    const aiMessages = messages.filter(m => m.sender_type === 'ai').length;
    const customerMessages = messages.filter(m => m.sender_type === 'customer').length;
    
    // Calculate AI resolution rate (conversations with AI responses)
    const conversationsWithAI = new Set(
      messages.filter(m => m.sender_type === 'ai').map(m => m.conversation_id)
    ).size;
    const aiResolutionRate = totalConversations > 0 ? 
      Math.round((conversationsWithAI / totalConversations) * 100) : 0;

    // Average response time (mock calculation for demo)
    const avgResponseTime = 2.3;

    // Average satisfaction score (mock for demo)
    const avgSatisfactionScore = 4.2;

    // Sentiment data for chart
    const sentimentData = [
      { name: 'Positive', value: 65, fill: '#10b981' },
      { name: 'Neutral', value: 25, fill: '#f59e0b' },
      { name: 'Negative', value: 10, fill: '#ef4444' }
    ];

    const stats = {
      totalConversations,
      activeChats,
      avgResponseTime,
      aiResolutionRate,
      avgSatisfactionScore,
      sentimentData
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
