import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL_CRM,
  process.env.SUPABASE_ANON_KEY_CRM
);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY_CRM 
});

function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, process.env.JWT_SECRET_CRM);
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);

    if (req.method === 'GET') {
      const { conversationId } = req.query;
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      res.status(200).json(messages);
    }

    else if (req.method === 'POST') {
      const { conversationId, content, senderType, senderName } = req.body;

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_type: senderType,
          sender_name: senderName || 'User'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Generate AI response for customer messages
      if (senderType === 'customer') {
        try {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are a helpful customer support assistant. Provide clear, professional responses to customer inquiries."
              },
              {
                role: "user",
                content: content
              }
            ],
            max_tokens: 300
          });

          // Save AI response
          const { data: aiMessage, error: aiError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              content: aiResponse.choices[0].message.content,
              sender_type: 'ai',
              sender_name: 'AI Assistant'
            })
            .select()
            .single();

          if (aiError) throw aiError;

          res.status(201).json({ userMessage, aiMessage });
        } catch (aiError) {
          console.error('AI response error:', aiError);
          res.status(201).json({ userMessage });
        }
      } else {
        res.status(201).json({ userMessage });
      }
    }

    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
