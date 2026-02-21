"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SakeCard } from "@/components/SakeCard";
import { RatingFilter } from "@/components/RatingFilter";
import { AlcoholTypeFilter } from "@/components/AlcoholTypeFilter";
import { EmptyState } from "@/components/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";
import { useSakeRecords } from "@/hooks/useSakeRecords";
import type { AlcoholType } from "@/lib/types";

export default function HomePage() {
  const { records, loading } = useSakeRecords();
  const [selectedRatings, setSelectedRatings] = useState<Set<number>>(
    new Set()
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<AlcoholType>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const hasFilter =
    selectedRatings.size > 0 || selectedTypes.size > 0 || selectedTags.size > 0;

  const filteredRecords = useMemo(() => {
    let result = records;
    if (selectedRatings.size > 0) {
      result = result.filter((r) => selectedRatings.has(r.rating));
    }
    if (selectedTypes.size > 0) {
      result = result.filter((r) => r.alcoholType && selectedTypes.has(r.alcoholType));
    }
    if (selectedTags.size > 0) {
      result = result.filter((r) =>
        r.tags.some((tag) => selectedTags.has(tag))
      );
    }
    return result;
  }, [records, selectedRatings, selectedTypes, selectedTags]);

  const clearAll = () => {
    setSelectedRatings(new Set());
    setSelectedTypes(new Set());
    setSelectedTags(new Set());
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="さけラベラー" />

        {!loading && records.length > 0 && (
          <div className="flex items-start gap-2 px-4 py-2 max-w-lg mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-1"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <div className="flex flex-col gap-1.5 flex-1">
              <AlcoholTypeFilter
                selectedTypes={selectedTypes}
                onChange={setSelectedTypes}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
              <RatingFilter
                selectedRatings={selectedRatings}
                onChange={setSelectedRatings}
              />
            </div>
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline shrink-0 pt-1"
                aria-label="絞り込みを解除"
              >
                クリア
              </button>
            )}
          </div>
        )}

        <main className="px-4 py-4 pb-24 max-w-lg mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <EmptyState />
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              該当する記録がありません
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRecords.map((record) => (
                <SakeCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </main>

        <Link
          href="/new"
          className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl font-light hover:bg-violet-700 active:bg-violet-800 active:scale-95 transition-all"
          aria-label="新しい記録を追加"
        >
          +
        </Link>
      </div>
    </AuthGuard>
  );
}
