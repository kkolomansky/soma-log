import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, ENTRIES_TABLE } from '../lib/supabase';

function fromRow(row) {
  return {
    id: row.id,
    timestamp: row.created_at, // używane przez TrendChart
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entryDate: row.entry_date, // 'YYYY-MM-DD' (data dnia, niezależna od strefy)
    sleep: row.sleep,
    energy: row.energy,
    motivation: row.motivation,
    fatigue: row.fatigue,
    doms: row.doms,
    stress: row.stress,
    note: row.note ?? '',
  };
}

export function useEntries(userId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = useCallback(async () => {
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

  // O(1) lookup: entry_date ('YYYY-MM-DD') → wpis dnia. Jeden wpis na dzień (unique w bazie).
  const entriesByDate = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!map.has(e.entryDate)) map.set(e.entryDate, e);
    }
    return map;
  }, [entries]);

  // Upsert po (user_id, entry_date): zapis danego dnia aktualizuje istniejący wpis zamiast
  // tworzyć duplikat. updated_at jest aktualizowany triggerem w bazie.
  const saveEntry = useCallback(async (dateStr, entry) => {
    if (!userId) return null;
    const { sleep, energy, motivation, fatigue, doms, stress, note } = entry;
    const { data, error } = await supabase
      .from(ENTRIES_TABLE)
      .upsert(
        { user_id: userId, entry_date: dateStr, sleep, energy, motivation, fatigue, doms, stress, note: note ?? '' },
        { onConflict: 'user_id,entry_date' }
      )
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    const saved = fromRow(data);
    setEntries(prev => {
      const without = prev.filter(e => e.entryDate !== saved.entryDate);
      return [saved, ...without].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return saved;
  }, [userId]);

  const deleteEntry = useCallback(async (id) => {
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

  return { entries, entriesByDate, saveEntry, deleteEntry, loading, error, reload: loadEntries };
}
