-- ============================================
-- さけラベラー Supabase スキーマ
-- ============================================

-- 1. テーブル作成
-- --------------------------------------------

create table sake_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  alcohol_type text not null default '',
  tags text[] not null default '{}',
  restaurant text not null default '',
  origin text not null default '',
  location_lat double precision,
  location_lng double precision,
  location_text text,
  date text not null default '',
  rating integer not null default 3,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sake_records_user_id on sake_records(user_id);
create index idx_sake_records_created_at on sake_records(user_id, created_at desc);

create table sake_photos (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references sake_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  gps_lat double precision,
  gps_lng double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_sake_photos_record_id on sake_photos(record_id, sort_order);

-- 2. updated_at 自動更新トリガー
-- --------------------------------------------

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sake_records_updated_at
  before update on sake_records
  for each row execute function update_updated_at();

-- 3. RLS (Row Level Security)
-- --------------------------------------------

alter table sake_records enable row level security;

create policy "Users can read own records"
  on sake_records for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own records"
  on sake_records for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own records"
  on sake_records for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own records"
  on sake_records for delete
  to authenticated
  using (user_id = auth.uid());

alter table sake_photos enable row level security;

create policy "Users can read own photos"
  on sake_photos for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own photos"
  on sake_photos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own photos"
  on sake_photos for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own photos"
  on sake_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- 4. Storage バケット
-- --------------------------------------------

insert into storage.buckets (id, name, public)
values ('sake-photos', 'sake-photos', true);

create policy "Users can upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sake-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'sake-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sake-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
