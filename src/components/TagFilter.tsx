"use client";

import { ALCOHOL_TYPES } from "@/lib/alcohol-types";
import type { AlcoholType } from "@/lib/types";

type TagFilterProps = {
  selectedTypes: Set<AlcoholType>;
  selectedTags: Set<string>;
  onChange: (tags: Set<string>) => void;
};

export function TagFilter({ selectedTypes, selectedTags, onChange }: TagFilterProps) {
  if (selectedTypes.size === 0) return null;

  const availableTags = ALCOHOL_TYPES
    .filter((t) => selectedTypes.has(t.key))
    .flatMap((t) => t.tags.map((tag) => ({ tag, config: t })));

  // Deduplicate tags (e.g. "辛口" appears in both nihonshu and wine)
  const seen = new Set<string>();
  const uniqueTags = availableTags.filter(({ tag }) => {
    if (seen.has(tag)) return false;
    seen.add(tag);
    return true;
  });

  if (uniqueTags.length === 0) return null;

  const toggle = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    onChange(next);
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {uniqueTags.map(({ tag, config }) => {
        const active = selectedTags.has(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              active ? config.activeColor : config.color
            }`}
            aria-label={`${tag}で絞り込み`}
            aria-pressed={active}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
