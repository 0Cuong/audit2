-- Additive reconciliation for the PostgreSQL backup discovered in
-- db_cluster-03-10-2026@23-05-37.backup.
-- No DROP/TRUNCATE/DELETE operations are used. Existing D1 rows are preserved.

ALTER TABLE timeline_events ADD COLUMN from_partner TEXT DEFAULT 'partner1';
ALTER TABLE bucket_list_items ADD COLUMN from_partner TEXT DEFAULT 'partner1';

ALTER TABLE journal_entries ADD COLUMN sender_name TEXT;
ALTER TABLE journal_entries ADD COLUMN sender_avatar TEXT;
ALTER TABLE journal_entries ADD COLUMN response_content TEXT;
ALTER TABLE journal_entries ADD COLUMN response_sender_name TEXT;
ALTER TABLE journal_entries ADD COLUMN response_sender_avatar TEXT;
ALTER TABLE journal_entries ADD COLUMN response_date TEXT;

ALTER TABLE songs ADD COLUMN cover_url TEXT;
ALTER TABLE songs ADD COLUMN lyrics TEXT;

CREATE TABLE IF NOT EXISTS bucket_list_replies (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bucket_item_id TEXT NOT NULL,
  content TEXT NOT NULL,
  from_partner TEXT NOT NULL DEFAULT 'partner1'
);

CREATE TABLE IF NOT EXISTS couple_invites (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couple_members (
  couple_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'partner',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (couple_id, user_id)
);

CREATE TABLE IF NOT EXISTS listening_history (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  played_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS love_letter_replies (
  id TEXT PRIMARY KEY,
  letter_id TEXT,
  content TEXT NOT NULL,
  from_partner TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_event_replies (
  id INTEGER PRIMARY KEY,
  event_id TEXT NOT NULL,
  from_partner TEXT NOT NULL DEFAULT 'partner2',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bucket_replies_item ON bucket_list_replies(bucket_item_id);
CREATE INDEX IF NOT EXISTS idx_couple_members_user ON couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_couple_invites_couple ON couple_invites(couple_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_song ON listening_history(song_id, played_at);
CREATE INDEX IF NOT EXISTS idx_letter_replies_letter ON love_letter_replies(letter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_replies_event ON timeline_event_replies(event_id);
