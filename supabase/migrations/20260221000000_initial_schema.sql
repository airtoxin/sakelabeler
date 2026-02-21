-- 初期スキーマ: sake_records, sake_photos テーブル作成

CREATE TABLE IF NOT EXISTS public.sake_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  alcohol_type text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  restaurant text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  location_lat double precision,
  location_lng double precision,
  location_text text,
  date text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 3,
  memo text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sake_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.sake_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  is_cover boolean NOT NULL DEFAULT false,
  gps_lat double precision,
  gps_lng double precision,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
