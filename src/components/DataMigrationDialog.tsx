"use client";

import { useState } from "react";
import { IDBSakeStorage } from "@/lib/storage-idb";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import type { SakeRecord } from "@/lib/types";

type DataMigrationDialogProps = {
  idbRecords: SakeRecord[];
  onComplete: () => void;
  onDismiss: () => void;
};

export function DataMigrationDialog({
  idbRecords,
  onComplete,
  onDismiss,
}: DataMigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = idbRecords.length;

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);

    const supabaseStorage = new SupabaseSakeStorage();
    const idbStorage = new IDBSakeStorage();

    try {
      for (let i = 0; i < idbRecords.length; i++) {
        const record = idbRecords[i];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...input } = record;
        await supabaseStorage.create(input);
        setProgress(i + 1);
      }

      // Delete migrated records from IndexedDB
      for (const record of idbRecords) {
        await idbStorage.delete(record.id);
      }

      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "移行中にエラーが発生しました"
      );
      setMigrating(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
          <h3 className="text-lg font-bold mb-2">移行完了</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {total}件のデータをクラウドに移行しました。
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="w-full py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-lg font-bold mb-2">データの移行</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          このデバイスに{total}件の記録があります。
          クラウドに移行しますか？
        </p>

        {migrating && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>移行中...</span>
              <span>
                {progress}/{total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!migrating && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleMigrate}
              className="flex-1 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
            >
              移行する
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              今はしない
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
