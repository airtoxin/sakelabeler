-- sake_records: RLS有効化とポリシー設定
ALTER TABLE public.sake_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON public.sake_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON public.sake_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON public.sake_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON public.sake_records
  FOR DELETE USING (auth.uid() = user_id);

-- sake_photos: RLS有効化とポリシー設定
ALTER TABLE public.sake_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos" ON public.sake_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON public.sake_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.sake_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.sake_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Storage: sake-photosバケットのポリシー設定
-- ストレージパスは "{user_id}/{record_id}/{photo_id}.jpg" 形式
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sake-photos' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sake-photos' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sake-photos' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );
