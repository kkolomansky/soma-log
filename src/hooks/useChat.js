import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { chatWithAgent } from '../lib/agent';

const CHAT_TABLE = 'soma_chat_messages';

// Wątek rozmowy z agentem dla wybranego dnia. Wiadomości zapisywane pod RLS użytkownika.
export function useChat(userId, entryDate) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId || !entryDate) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from(CHAT_TABLE)
      .select('id, role, content, created_at')
      .eq('entry_date', entryDate)
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    else {
      setError(null);
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [userId, entryDate]);

  useEffect(() => { load(); }, [load]);

  const sendMessage = useCallback(async (text) => {
    const content = text.trim();
    if (!content || !userId || !entryDate || sending) return;
    setSending(true);
    setError(null);

    // 1. Zapis wiadomości użytkownika (optymistycznie + DB).
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', content };
    const history = [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content }];
    setMessages(prev => [...prev, optimistic]);

    const { data: savedUser } = await supabase
      .from(CHAT_TABLE)
      .insert({ user_id: userId, entry_date: entryDate, role: 'user', content })
      .select('id, role, content, created_at')
      .single();
    if (savedUser) {
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? savedUser : m)));
    }

    // 2. Odpowiedź agenta → zapis.
    try {
      const reply = await chatWithAgent({ entryDate, history });
      const { data: savedAssistant } = await supabase
        .from(CHAT_TABLE)
        .insert({ user_id: userId, entry_date: entryDate, role: 'assistant', content: reply })
        .select('id, role, content, created_at')
        .single();
      setMessages(prev => [...prev, savedAssistant ?? { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }, [messages, userId, entryDate, sending]);

  return { messages, loading, sending, error, sendMessage, reload: load };
}
