-- sake-photosバケットを作成（公開バケット: getPublicUrlで画像を表示するため）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sake-photos',
  'sake-photos',
  true,
  5242880,  -- 5MB（画像は800pxにリサイズ済みなので十分）
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
