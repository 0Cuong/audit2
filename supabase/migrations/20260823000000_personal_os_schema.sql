/*
# Create Personal OS & Infinite Personalization Database Schema

1. New Tables:
   - `user_personalization`: Holds active appearance, background, identity styling, navigation preferences.
   - `user_workspaces`: Multi-workspace configurations with responsive layout mode and block assignments.
   - `user_custom_pages`: Dynamic user-created pages with modular block configurations.
   - `user_assets`: Persistent media library (avatars, banners, backgrounds, stickers, photos).
   - `user_saved_views`: Saved filters, sorting and layout state for different views.
   - `user_rules`: User condition-action automation rules.
   - `user_presets`: User-saved design presets.
   - `user_config_revisions`: Snapshot history for undo, redo, and rollback.

2. Security:
   - Row Level Security (RLS) enabled on all tables.
   - Policies configured for anonymous and authenticated access.
*/

-- 1. User Personalization Master Table
CREATE TABLE IF NOT EXISTS user_personalization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  appearance jsonb NOT NULL DEFAULT '{}'::jsonb,
  background jsonb NOT NULL DEFAULT '{}'::jsonb,
  identity jsonb NOT NULL DEFAULT '{}'::jsonb,
  navigation jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_workspace_id text DEFAULT 'ws-main',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. User Workspaces
CREATE TABLE IF NOT EXISTS user_workspaces (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Heart',
  description text DEFAULT '',
  is_default boolean DEFAULT false,
  layout_mode text NOT NULL DEFAULT 'bento',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme_override jsonb,
  background_override jsonb,
  navigation_override jsonb,
  active_page_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. User Custom Pages
CREATE TABLE IF NOT EXISTS user_custom_pages (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  workspace_id text REFERENCES user_workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  icon text NOT NULL DEFAULT 'FileText',
  description text DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. User Media Assets Library
CREATE TABLE IF NOT EXISTS user_assets (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  thumbnail text,
  size bigint DEFAULT 0,
  mime_type text DEFAULT 'image/jpeg',
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Saved Views
CREATE TABLE IF NOT EXISTS user_saved_views (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Bookmark',
  description text DEFAULT '',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_by text,
  sort_order text DEFAULT 'desc',
  display_mode text DEFAULT 'grid',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Personal Automation Rules
CREATE TABLE IF NOT EXISTS user_rules (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger text NOT NULL,
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  action text NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. User Saved Presets & Templates
CREATE TABLE IF NOT EXISTS user_presets (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'Custom',
  author text DEFAULT 'User',
  version text DEFAULT '1.0.0',
  preview_thumbnail text,
  tags text[] DEFAULT '{}',
  appearance jsonb NOT NULL DEFAULT '{}'::jsonb,
  background jsonb NOT NULL DEFAULT '{}'::jsonb,
  navigation_style text DEFAULT 'floating_dock',
  identity_decoration jsonb DEFAULT '{}'::jsonb,
  sample_blocks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 8. Configuration Snapshots & Revision History
CREATE TABLE IF NOT EXISTS user_config_revisions (
  id text PRIMARY KEY,
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  label text NOT NULL DEFAULT 'Snapshot',
  snapshot jsonb NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config_revisions ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS policies for anonymous and authenticated access
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'user_personalization', 'user_workspaces', 'user_custom_pages',
    'user_assets', 'user_saved_views', 'user_rules', 'user_presets', 'user_config_revisions'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'anon_select_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'anon_insert_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'anon_update_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'anon_delete_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true)', 'anon_select_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', 'anon_insert_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', 'anon_update_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true)', 'anon_delete_' || t, t);
  END LOOP;
END $$;
