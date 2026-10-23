"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/utils";
import { extractGpsLocation } from "@/lib/exif";
import type { SakePhoto, Location } from "@/lib/types";

type PhotoPickerProps = {
  value: SakePhoto[];
  onChange: (photos: SakePhoto[]) => void;
  onLocationExtracted?: (location: Location) => void;
  onLocationSelect?: (location: Location) => void;
  onProcessingChange: (processing: boolean) => void;
  disabled?: boolean;
};

export function PhotoPicker({ value, onChange, onLocationExtracted, onLocationSelect, onProcessingChange, disabled = false }: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = disabled || processing;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0 || busy) return;
    setError(null);
    setProcessing(true);
    onProcessingChange(true);

    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          const [resized, gpsLocation] = await Promise.all([
            resizeImage(file),
            extractGpsLocation(file),
          ]);
          return { resized, gpsLocation };
        }),
      );

      const firstGps = processed.find((p) => p.gpsLocation)?.gpsLocation;
      if (firstGps && onLocationExtracted) {
        onLocationExtracted(firstGps);
      }

      const newPhotos: SakePhoto[] = processed.map(({ resized, gpsLocation }, i) => ({
        url: resized,
        isCover: value.length === 0 && i === 0,
        ...(gpsLocation ? { gpsLocation } : {}),
      }));
      onChange([...value, ...newPhotos]);
    } catch {
      setError("写真を読み込めませんでした。別の画像を選んでください。");
    } finally {
      setProcessing(false);
      onProcessingChange(false);
    }
  };

  const handleRemove = (index: number) => {
    setError(null);
    const removed = value[index];
    const next = value.filter((_, i) => i !== index);
    // If removed photo was cover and there are remaining photos, make first one cover
    if (removed.isCover && next.length > 0) {
      next[0] = { ...next[0], isCover: true };
    }
    onChange(next);
  };

  const handleSetCover = (index: number) => {
    const next = value.map((p, i) => ({
      ...p,
      isCover: i === index,
    }));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">写真・カバー写真</p>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((photo, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={`写真 ${index + 1}`}
                  className={`w-full h-full object-cover rounded-lg ${
                    photo.isCover
                      ? "ring-2 ring-violet-500"
                      : ""
                  }`}
                />
                {photo.isCover && (
                  <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 bg-violet-600 text-white rounded-full">
                    カバー
                  </span>
                )}
                {photo.gpsLocation && onLocationSelect && (
                  <button
                    type="button"
                    onClick={() => onLocationSelect(photo.gpsLocation!)}
                    disabled={busy}
                    className="absolute top-1 left-1 w-6 h-6 bg-blue-600/80 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    aria-label="この写真の位置情報を使用"
                    title="この写真の位置情報を使用"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={busy}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                  aria-label="写真を削除"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleSetCover(index)}
                disabled={busy}
                aria-label={`写真 ${index + 1}をカバーに設定`}
                aria-pressed={photo.isCover}
                className={`min-h-11 px-1 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${photo.isCover
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-violet-300 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-gray-800"}`}
              >
                {photo.isCover ? "カバーに設定済み" : "カバーに設定"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
            <path
              fillRule="evenodd"
              d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.2.32.56.521.95.521h.674c1.606 0 2.91 1.254 2.91 2.807v8.088c0 1.553-1.304 2.806-2.91 2.806H4.567c-1.606 0-2.91-1.253-2.91-2.806V9.106c0-1.553 1.304-2.807 2.91-2.807h.674c.39 0 .75-.2.95-.52l.82-1.318a2.693 2.693 0 012.333-1.39z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">カメラで撮影</span>
        </button>

        <button
          type="button"
          onClick={() => libraryInputRef.current?.click()}
          disabled={busy}
          className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">ライブラリから選択</span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="カメラで写真を追加"
        disabled={busy}
        onChange={handleChange}
        className="hidden"
      />

      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label="ライブラリから写真を追加"
        disabled={busy}
        onChange={handleChange}
        className="hidden"
      />
      {processing && <p role="status" className="text-sm text-gray-500">写真を読み込み中...</p>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
