-- Additive reconciliation between the original Supabase schema and the fields
-- used by the current frontend entities. No existing rows are removed or changed.

ALTER TABLE timeline_events ADD COLUMN description TEXT;
ALTER TABLE timeline_events ADD COLUMN image_url TEXT;
ALTER TABLE timeline_events ADD COLUMN category TEXT;
ALTER TABLE timeline_events ADD COLUMN icon TEXT;
ALTER TABLE timeline_events ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timeline_events ADD COLUMN updated_at TEXT;

ALTER TABLE memories ADD COLUMN author_id TEXT;
ALTER TABLE memories ADD COLUMN author_name TEXT;
ALTER TABLE memories ADD COLUMN media_type TEXT;
ALTER TABLE memories ADD COLUMN context TEXT;
ALTER TABLE memories ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memories ADD COLUMN collection_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE memories ADD COLUMN location TEXT;
ALTER TABLE memories ADD COLUMN metadata TEXT;
ALTER TABLE memories ADD COLUMN updated_at TEXT;

ALTER TABLE love_letters ADD COLUMN updated_at TEXT;

ALTER TABLE journal_entries ADD COLUMN title TEXT;
ALTER TABLE journal_entries ADD COLUMN content_html TEXT;
ALTER TABLE journal_entries ADD COLUMN type TEXT;
ALTER TABLE journal_entries ADD COLUMN time TEXT;
ALTER TABLE journal_entries ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE journal_entries ADD COLUMN author_id TEXT;
ALTER TABLE journal_entries ADD COLUMN author_name TEXT;
ALTER TABLE journal_entries ADD COLUMN author TEXT;
ALTER TABLE journal_entries ADD COLUMN location TEXT;
ALTER TABLE journal_entries ADD COLUMN location_name TEXT;
ALTER TABLE journal_entries ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN metadata TEXT;
ALTER TABLE journal_entries ADD COLUMN updated_at TEXT;

ALTER TABLE mood_entries ADD COLUMN updated_at TEXT;

ALTER TABLE bucket_list_items ADD COLUMN updated_at TEXT;

ALTER TABLE anniversaries ADD COLUMN type TEXT;
ALTER TABLE anniversaries ADD COLUMN notes TEXT;
ALTER TABLE anniversaries ADD COLUMN reminder_days INTEGER;
ALTER TABLE anniversaries ADD COLUMN updated_at TEXT;

ALTER TABLE map_locations ADD COLUMN address TEXT;
ALTER TABLE map_locations ADD COLUMN updated_at TEXT;

ALTER TABLE songs ADD COLUMN artwork_url TEXT;
ALTER TABLE songs ADD COLUMN updated_at TEXT;

ALTER TABLE gifts ADD COLUMN updated_at TEXT;

ALTER TABLE messages ADD COLUMN updated_at TEXT;

-- Helpful lookup indexes for the canonical fields.
CREATE INDEX IF NOT EXISTS idx_timeline_category ON timeline_events(category);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date);
