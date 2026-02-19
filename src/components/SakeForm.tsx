"use client";

import { useState } from "react";
import { PhotoPicker } from "./PhotoPicker";
import { StarRating } from "./StarRating";
import { FlavorTagPicker } from "./FlavorTagPicker";
import { LocationPicker } from "./LocationPicker";
import { todayString } from "@/lib/utils";
import type { SakeRecordInput, SakePhoto, AlcoholType, Location } from "@/lib/types";

type SakeFormProps = {
  initialValues?: Partial<SakeRecordInput>;
  onSubmit: (values: SakeRecordInput) => Promise<void>;
  submitLabel?: string;
};

export function SakeForm({
  initialValues,
  onSubmit,
  submitLabel = "保存する",
}: SakeFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [photos, setPhotos] = useState<SakePhoto[]>(
    initialValues?.photos ?? []
  );
  const [alcoholType, setAlcoholType] = useState<AlcoholType>(
    initialValues?.alcoholType ?? ""
  );
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [restaurant, setRestaurant] = useState(
    initialValues?.restaurant ?? ""
  );
  const [origin, setOrigin] = useState(initialValues?.origin ?? "");
  const [location, setLocation] = useState<Location | null>(
    initialValues?.location ?? null
  );
  const [date, setDate] = useState(initialValues?.date ?? todayString());
  const [rating, setRating] = useState(initialValues?.rating ?? 3);
  const [memo, setMemo] = useState(initialValues?.memo ?? "");
  const [submitting, setSubmitting] = useState(false);

  const hasAnyInput =
    name.trim() || photos.length > 0 || restaurant.trim() || origin.trim() || memo.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyInput || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        photos,
        alcoholType,
        tags,
        restaurant: restaurant.trim(),
        origin: origin.trim(),
        location,
        date,
        rating,
        memo: memo.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PhotoPicker value={photos} onChange={setPhotos} />

      <FlavorTagPicker
        alcoholType={alcoholType}
        onAlcoholTypeChange={setAlcoholType}
        selectedTags={tags}
        onTagsChange={setTags}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">お酒の名前</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：獺祭 純米大吟醸"
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">お店の名前</span>
        <input
          type="text"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          placeholder="例：寿司処 花月"
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </label>

      <LocationPicker value={location} onChange={setLocation} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">産地</span>
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="例：山口県"
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">日付</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">評価</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">メモ</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="味の感想など..."
          rows={3}
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
        />
      </label>

      <button
        type="submit"
        disabled={!hasAnyInput || submitting}
        className="mt-2 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
