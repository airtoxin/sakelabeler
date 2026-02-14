"use client";

import { ALCOHOL_TYPES } from "@/lib/alcohol-types";
import type { AlcoholType } from "@/lib/types";

type AlcoholTypeFilterProps = {
  selectedTypes: Set<AlcoholType>;
  onChange: (types: Set<AlcoholType>) => void;
};

export function AlcoholTypeFilter({
  selectedTypes,
  onChange,
}: AlcoholTypeFilterProps) {
  const toggle = (key: AlcoholType) => {
    const next = new Set(selectedTypes);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  return (
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
  );
}
