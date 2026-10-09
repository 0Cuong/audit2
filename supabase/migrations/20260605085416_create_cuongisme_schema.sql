/*
# Create CUONGISME Database Schema (Fully Fixed & Optimized)

1. Purpose
   Single-tenant romantic relationship platform. One couple, all data shared.
   No auth required — uses anon key for simplicity.

2. Fixed Items
   - Added nullable `couple_id` referencing `couple_profile(id)` on delete cascade to all user-owned tables
     to match the frontend queries (e.g., .eq('couple_id', profile.id)) and prevent app crashes.
   - Added `image_url` column to `bucket_list_items` for target goal previews.
   - Embedded `photo_url` directly inside `anniversaries` creation script.
*/

-- 1. Couple Profile (Bảng cha cần tạo đầu tiên để làm khóa ngoại)
CREATE TABLE IF NOT EXISTS couple_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner1_name text NOT NULL DEFAULT '',
  partner1_avatar text NOT NULL DEFAULT '',
  partner1_gender text NOT NULL DEFAULT '',
  partner1_birthday date,
  partner2_name text NOT NULL DEFAULT '',
  partner2_avatar text NOT NULL DEFAULT '',
  partner2_gender text NOT NULL DEFAULT '',
  partner2_birthday date,
  relationship_status text NOT NULL DEFAULT 'dating',
  relationship_start date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  date date NOT NULL,
  event_type text NOT NULL DEFAULT 'custom',
  story text DEFAULT '',
  photos text[] DEFAULT '{}',
  location text DEFAULT '',
  mood text DEFAULT '',
  tags text[] DEFAULT '{}',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Memories
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  category text NOT NULL DEFAULT 'photo',
  url text NOT NULL DEFAULT '',
  description text DEFAULT '',
  is_favorite boolean DEFAULT false,
  date date DEFAULT CURRENT_DATE,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. Love Letters
CREATE TABLE IF NOT EXISTS love_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  from_partner text NOT NULL DEFAULT 'partner1',
  to_partner text NOT NULL DEFAULT 'partner2',
  is_draft boolean DEFAULT true,
  is_locked boolean DEFAULT false,
  scheduled_at timestamptz,
  is_future boolean DEFAULT false,
  reaction text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

-- 5. Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL DEFAULT '',
  mood text DEFAULT '',
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 6. Mood Entries
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  mood text NOT NULL,
  note text DEFAULT '',
  partner text DEFAULT 'partner1',
  created_at timestamptz DEFAULT now()
);

-- 7. Bucket List Items
CREATE TABLE IF NOT EXISTS bucket_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  category text NOT NULL DEFAULT 'travel',
  description text DEFAULT '',
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  image_url text DEFAULT '', -- Đã sửa: Bổ sung trường ảnh minh họa theo code frontend
  created_at timestamptz DEFAULT now()
);

-- 8. Anniversaries
CREATE TABLE IF NOT EXISTS anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  date date NOT NULL,
  anniversary_type text NOT NULL DEFAULT 'custom',
  recurrence text DEFAULT 'yearly',
  photo_url text, -- Đã sửa: Đưa trực tiếp vào cấu trúc bảng ban đầu
  created_at timestamptz DEFAULT now()
);

-- 9. Map Locations
CREATE TABLE IF NOT EXISTS map_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  description text DEFAULT '',
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  location_type text NOT NULL DEFAULT 'date',
  photos text[] DEFAULT '{}',
  memory_id uuid REFERENCES memories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. Songs
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  url text DEFAULT '',
  is_favorite boolean DEFAULT false,
  is_background boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 11. Gifts
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  title text NOT NULL,
  description text DEFAULT '',
  url text DEFAULT '',
  image_url text DEFAULT '',
  category text DEFAULT 'wishlist',
  occasion text DEFAULT '',
  price_range text DEFAULT '',
  is_received boolean DEFAULT false,
  for_partner text DEFAULT 'partner2',
  created_at timestamptz DEFAULT now()
);

-- 12. Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'note',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 13. Settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couple_profile(id) ON DELETE CASCADE, -- Khóa ngoại liên kết
  language text NOT NULL DEFAULT 'en',
  theme text NOT NULL DEFAULT 'dark',
  contact_links jsonb DEFAULT '[]'::jsonb,
  privacy_mode boolean DEFAULT false,
  password_hash text DEFAULT '',
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kích hoạt RLS (Row Level Security) cho toàn bộ các bảng
ALTER TABLE couple_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Cấu hình Dynamic Policies: Cấp quyền đầy đủ cho cả anonymous + authenticated (single-tenant)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'couple_profile', 'timeline_events', 'memories', 'love_letters',
    'journal_entries', 'mood_entries', 'bucket_list_items', 'anniversaries',
    'map_locations', 'songs', 'gifts', 'messages', 'settings'
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

-- Khởi tạo dữ liệu mặc định ban đầu
INSERT INTO couple_profile (partner1_name, partner2_name) VALUES ('Cuong', 'Love');
INSERT INTO settings (language, theme) VALUES ('en', 'dark');

-- ===================================================
-- CẤU HÌNH SUPABASE STORAGE & PHÂN QUYỀN TRUY CẬP FILE
-- ===================================================

-- 1. Khởi tạo các Buckets công khai
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('memories', 'memories', true),
  ('photos', 'photos', true),
  ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Kích hoạt RLS cho bảng quản lý đối tượng lưu trữ
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Xóa các cấu hình chính sách cũ để tránh trùng lặp
DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- 4. Thiết lập chính sách bảo mật cho phép tải lên, chỉnh sửa và xem tệp tin tự do (anon & authenticated)
CREATE POLICY "Allow public select" ON storage.objects 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert" ON storage.objects 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update" ON storage.objects 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete" ON storage.objects 
  FOR DELETE TO anon, authenticated USING (true);

-- 5. Cấp toàn bộ quyền thao tác hệ thống trên schema lưu trữ
GRANT ALL ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated, service_role;