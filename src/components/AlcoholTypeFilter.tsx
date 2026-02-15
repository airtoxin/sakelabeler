"use client";

import { ALCOHOL_TYPES } from "@/lib/alcohol-types";
import type { AlcoholType } from "@/lib/types";

type AlcoholTypeFilterProps = {
  selectedTypes: Set<AlcoholType>;
  onChange: (types: Set<AlcoholType>) => void;
  selectedTags: Set<string>;
  onTagsChange: (tags: Set<string>) => void;
};

export function AlcoholTypeFilter({
  selectedTypes,
  onChange,
  selectedTags,
  onTagsChange,
}: AlcoholTypeFilterProps) {
  const toggle = (key: AlcoholType) => {
    const next = new Set(selectedTypes);
    if (next.has(key)) {
      next.delete(key);
      // Remove tags belonging to this type (unless shared with another selected type)
      const removedConfig = ALCOHOL_TYPES.find((t) => t.key === key);
      if (removedConfig) {
        const remainingTags = new Set<string>();
        for (const t of ALCOHOL_TYPES) {
          if (next.has(t.key)) {
            for (const tag of t.tags) remainingTags.add(tag);
          }
        }
        const nextTags = new Set(selectedTags);
        for (const tag of removedConfig.tags) {
          if (!remainingTags.has(tag)) {
            nextTags.delete(tag);
          }
        }
        if (nextTags.size !== selectedTags.size) {
          onTagsChange(nextTags);
        }
      }
    } else {
      next.add(key);
    }
    onChange(next);
  };

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    onTagsChange(next);
  };

  // Collect tags for all selected types, preserving order and tracking which type each tag belongs to
  const availableTags: { tag: string; config: (typeof ALCOHOL_TYPES)[number] }[] = [];
  const seen = new Set<string>();
  for (const type of ALCOHOL_TYPES) {
    if (selectedTypes.has(type.key)) {
      for (const tag of type.tags) {
        if (!seen.has(tag)) {
          seen.add(tag);
          availableTags.push({ tag, config: type });
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5 flex-wrap">
        {ALCOHOL_TYPES.map((type) => {
          const active = selectedTypes.has(type.key);
          return (
            <button
              key={type.key}
              type="button"
              onClick={() => toggle(type.key)}
              className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                active ? type.activeColor : type.color
              }`}
              aria-label={`${type.label}で絞り込み`}
              aria-pressed={active}
            >
              {type.label}
            </button>
          );
        })}
      </div>
      {availableTags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {availableTags.map(({ tag, config }) => {
            const active = selectedTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
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
      )}
    </div>
  );
}
