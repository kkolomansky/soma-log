import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, ENTRIES_TABLE } from '../lib/supabase';

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

  // O(1) lookup: date string ('YYYY-MM-DD' in local time) → most recent entry for that day
  const entriesByDate = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const dateKey = new Date(e.timestamp).toLocaleDateString('en-CA');
      if (!map.has(dateKey)) map.set(dateKey, e); // entries sorted newest first; keep first
    }
    return map;
  }, [entries]);

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

  return { entries, entriesByDate, addEntry, deleteEntry, loading, error, reload: loadEntries };
}
