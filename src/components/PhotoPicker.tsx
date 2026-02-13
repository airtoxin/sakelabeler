"use client";

import { useRef } from "react";
import { resizeImage } from "@/lib/utils";

type PhotoPickerProps = {
  value: string | null;
  onChange: (photo: string | null) => void;
};

export function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    onChange(resized);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="選択した写真"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/70"
            aria-label="写真を削除"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
          >
            <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
            <path
              fillRule="evenodd"
              d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.2.32.56.521.95.521h.674c1.606 0 2.91 1.254 2.91 2.807v8.088c0 1.553-1.304 2.806-2.91 2.806H4.567c-1.606 0-2.91-1.253-2.91-2.806V9.106c0-1.553 1.304-2.807 2.91-2.807h.674c.39 0 .75-.2.95-.52l.82-1.318a2.693 2.693 0 012.333-1.39z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">写真を追加</span>
        </button>
      )}
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
