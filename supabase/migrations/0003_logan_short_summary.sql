-- Krótki wyciąg analizy Logana (wyświetlany obok zegara regeneracji).
-- Pełna, rozbudowana analiza pozostaje w soma_entries.ai_summary.
alter table public.soma_entries add column if not exists ai_summary_short text;
