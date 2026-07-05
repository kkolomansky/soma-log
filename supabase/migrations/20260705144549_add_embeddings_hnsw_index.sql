-- Indeks HNSW (cosine) na kolumnie embedding — szybkie wyszukiwanie najbliższych sąsiadów.
-- Osobna migracja (jak na produkcji), tworzona po dodaniu kolumny embedding w add_embeddings.
create index if not exists soma_entries_embedding_idx
  on public.soma_entries using hnsw (embedding vector_cosine_ops);
