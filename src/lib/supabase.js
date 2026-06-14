import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Brak konfiguracji Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w pliku .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Nazwa dedykowanej tabeli na wpisy aplikacji
export const ENTRIES_TABLE = 'soma_entries';
