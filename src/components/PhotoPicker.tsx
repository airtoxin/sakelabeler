"use client";

import { useRef } from "react";
import { resizeImage } from "@/lib/utils";
import type { SakePhoto } from "@/lib/types";

type PhotoPickerProps = {
  value: SakePhoto[];
  onChange: (photos: SakePhoto[]) => void;
};

export function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const newPhoto: SakePhoto = {
      url: resized,
      isCover: value.length === 0,
    };
    onChange([...value, newPhoto]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
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
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
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
              {!photo.isCover && value.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleSetCover(index)}
                  className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  カバーに設定
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                aria-label="写真を削除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
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
        <span className="text-xs">写真を追加</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
