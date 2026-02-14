"use client";

import { ALCOHOL_TYPES, getAlcoholTypeConfig } from "@/lib/alcohol-types";
import type { AlcoholType } from "@/lib/types";

type FlavorTagPickerProps = {
  alcoholType: AlcoholType;
  onAlcoholTypeChange: (type: AlcoholType) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
};

export function FlavorTagPicker({
  alcoholType,
  onAlcoholTypeChange,
  selectedTags,
  onTagsChange,
}: FlavorTagPickerProps) {
  const config = getAlcoholTypeConfig(alcoholType);

  const handleTypeSelect = (key: AlcoholType) => {
    if (alcoholType === key) {
      onAlcoholTypeChange("");
      onTagsChange([]);
    } else {
      onAlcoholTypeChange(key);
      onTagsChange([]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-sm font-medium">お酒の種類</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {ALCOHOL_TYPES.map((type) => {
            const isActive = alcoholType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => handleTypeSelect(type.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isActive ? type.activeColor : type.color
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {config && (
        <div>
          <span className="text-sm font-medium">特徴</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {config.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isSelected ? config.activeColor : config.color
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
