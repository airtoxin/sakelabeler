"use client";

type RatingFilterProps = {
  selectedRatings: Set<number>;
  onChange: (ratings: Set<number>) => void;
};

export function RatingFilter({ selectedRatings, onChange }: RatingFilterProps) {
  const toggle = (rating: number) => {
    const next = new Set(selectedRatings);
    if (next.has(rating)) {
      next.delete(rating);
    } else {
      next.add(rating);
    }
    onChange(next);
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = selectedRatings.has(rating);
        return (
          <button
            key={rating}
            type="button"
            onClick={() => toggle(rating)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-400"
                : "bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
            }`}
            aria-label={`${rating}星で絞り込み`}
            aria-pressed={active}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`w-3.5 h-3.5 ${
                active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
              }`}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {rating}
          </button>
        );
      })}
    </div>
  );
}
