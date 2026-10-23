-- 任意の醸造所名。既存の記録と旧クライアントは空文字の既定値で互換性を維持する。
ALTER TABLE public.sake_records
  ADD COLUMN brewery text NOT NULL DEFAULT '';
