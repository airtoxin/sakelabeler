"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { SakeCard } from "@/components/SakeCard";
import { EmptyState } from "@/components/EmptyState";
import { useSakeRecords } from "@/hooks/useSakeRecords";

export default function HomePage() {
  const { records, loading } = useSakeRecords();

  return (
    <div className="min-h-screen bg-background">
      <Header title="さけラベラー" />

      <main className="px-4 py-4 pb-24 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {records.map((record) => (
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
  );
}
