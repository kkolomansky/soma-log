import { useState, useEffect, useCallback } from 'react';
import { supabase, ENTRIES_TABLE } from '../lib/supabase';

/**
 * Wpisy aplikacji przechowywane są w bazie Supabase (tabela `soma_entries`),
 * a nie lokalnie w przeglądarce. Rekord z bazy mapujemy na kształt używany
 * przez UI (m.in. created_at -> timestamp).
 */
function fromRow(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    mood: row.mood,
    recovery: row.recovery,
    sleep: row.sleep,
    doms: row.doms,
    note: row.note ?? '',
  };
}

export function useEntries(userId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = useCallback(async () => {
    // Bez zalogowanego użytkownika nie odpytujemy bazy (RLS i tak nic nie zwróci).
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from(ENTRIES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setEntries(data.map(fromRow));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry) => {
    const { mood, recovery, sleep, doms, note } = entry;
    const { data, error } = await supabase
      .from(ENTRIES_TABLE)
      .insert({ mood, recovery, sleep, doms, note: note ?? '' })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    const newEntry = fromRow(data);
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    // Optymistyczne usunięcie z UI, z przywróceniem w razie błędu
    const prev = entries;
    setEntries(prev.filter(e => e.id !== id));

    const { error } = await supabase
      .from(ENTRIES_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      setEntries(prev);
    }
  }, [entries]);

  return { entries, addEntry, deleteEntry, loading, error, reload: loadEntries };
}
