-- ============================================================
-- DB共有機能: db_shares テーブル + has_share_access() + RLS更新
-- ============================================================

-- 1. db_shares テーブル作成
CREATE TABLE public.db_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, invitee_id)
);

ALTER TABLE public.db_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares" ON public.db_shares
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = invitee_id);
CREATE POLICY "Owner can create shares" ON public.db_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Both can delete shares" ON public.db_shares
  FOR DELETE USING (auth.uid() = owner_id OR auth.uid() = invitee_id);

CREATE INDEX idx_db_shares_lookup ON public.db_shares(owner_id, invitee_id);

-- 2. has_share_access() ヘルパー関数
CREATE OR REPLACE FUNCTION public.has_share_access(record_user_id uuid)
RETURNS boolean AS $$
  SELECT auth.uid() = record_user_id
    OR EXISTS (
      SELECT 1 FROM public.db_shares
      WHERE owner_id = record_user_id AND invitee_id = auth.uid()
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. 既存RLSポリシー削除 (sake_records)
DROP POLICY "Users can view own records" ON public.sake_records;
DROP POLICY "Users can insert own records" ON public.sake_records;
DROP POLICY "Users can update own records" ON public.sake_records;
DROP POLICY "Users can delete own records" ON public.sake_records;

-- 4. 新RLSポリシー作成 (sake_records)
CREATE POLICY "Users can view accessible records" ON public.sake_records
  FOR SELECT USING (public.has_share_access(user_id));
CREATE POLICY "Users can insert accessible records" ON public.sake_records
  FOR INSERT WITH CHECK (public.has_share_access(user_id));
CREATE POLICY "Users can update accessible records" ON public.sake_records
  FOR UPDATE USING (public.has_share_access(user_id));
CREATE POLICY "Users can delete accessible records" ON public.sake_records
  FOR DELETE USING (public.has_share_access(user_id));

-- 5. 既存RLSポリシー削除 (sake_photos)
DROP POLICY "Users can view own photos" ON public.sake_photos;
DROP POLICY "Users can insert own photos" ON public.sake_photos;
DROP POLICY "Users can update own photos" ON public.sake_photos;
DROP POLICY "Users can delete own photos" ON public.sake_photos;

-- 6. 新RLSポリシー作成 (sake_photos)
CREATE POLICY "Users can view accessible photos" ON public.sake_photos
  FOR SELECT USING (public.has_share_access(user_id));
CREATE POLICY "Users can insert accessible photos" ON public.sake_photos
  FOR INSERT WITH CHECK (public.has_share_access(user_id));
CREATE POLICY "Users can update accessible photos" ON public.sake_photos
  FOR UPDATE USING (public.has_share_access(user_id));
CREATE POLICY "Users can delete accessible photos" ON public.sake_photos
  FOR DELETE USING (public.has_share_access(user_id));

-- 7. 既存Storageポリシー削除
DROP POLICY "Users can upload own photos" ON storage.objects;
DROP POLICY "Users can view own photos" ON storage.objects;
DROP POLICY "Users can delete own photos" ON storage.objects;

-- 8. 新Storageポリシー作成
CREATE POLICY "Users can upload accessible photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sake-photos' AND
    public.has_share_access((string_to_array(name, '/'))[1]::uuid)
  );
CREATE POLICY "Users can view accessible photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sake-photos' AND
    public.has_share_access((string_to_array(name, '/'))[1]::uuid)
  );
CREATE POLICY "Users can delete accessible photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sake-photos' AND
    public.has_share_access((string_to_array(name, '/'))[1]::uuid)
  );
