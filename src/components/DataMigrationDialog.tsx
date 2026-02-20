"use client";

import { useState } from "react";
import { IDBSakeStorage } from "@/lib/storage-idb";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { SakeRecord } from "@/lib/types";

type DataMigrationDialogProps = {
  idbRecords: SakeRecord[];
  onComplete: () => void;
  onDismiss: () => void;
};

type ErrorDetails = {
  message: string;
  failedRecord?: {
    name: string;
    date: string;
  };
  step?: string;
  fullError?: string;
};

export function DataMigrationDialog({
  idbRecords,
  onComplete,
  onDismiss,
}: DataMigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [done, setDone] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const total = idbRecords.length;

  const getErrorMessage = (err: unknown, context?: string): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === "string") {
      return err;
    }
    return context || "Unknown error occurred";
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);

    console.log(`[Migration] Starting migration of ${total} records`);

    // Pre-flight validation
    try {
      console.log("[Migration] Running pre-flight checks...");

      // Check Supabase configuration
      if (!isSupabaseConfigured) {
        const errorMsg =
          "Supabaseが設定されていません。環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。";
        console.error("[Migration]", errorMsg);
        setError({
          message: errorMsg,
          step: "設定確認",
          fullError: errorMsg,
        });
        setMigrating(false);
        return;
      }

      // Check authentication by attempting to get user ID
      console.log("[Migration] Checking authentication status...");
      const supabaseStorage = new SupabaseSakeStorage();
      try {
        // Trigger early auth check by calling getAll which requires getUserId internally
        await supabaseStorage.getAll();
      } catch (authErr) {
        const authError = getErrorMessage(
          authErr,
          "認証に失敗しました"
        );
        console.error("[Migration] Auth check failed:", authError);
        setError({
          message: "認証が無効です。もう一度ログインしてください。",
          step: "認証確認",
          fullError: authError,
        });
        setMigrating(false);
        return;
      }

      // Validate record structure
      console.log("[Migration] Validating record structures...");
      for (let i = 0; i < idbRecords.length; i++) {
        const record = idbRecords[i];
        if (!Array.isArray(record.photos)) {
          const displayName = record.name || "（名前なし）";
          const errorMsg = `レコード「${displayName}」の写真データが不正です`;
          console.error("[Migration]", errorMsg);
          setError({
            message: errorMsg,
            step: "レコード検証",
            failedRecord: {
              name: displayName,
              date: record.date,
            },
            fullError: errorMsg,
          });
          setMigrating(false);
          return;
        }
      }

      console.log("[Migration] Pre-flight checks passed. Starting migration...");
    } catch (preflightErr) {
      const errorMsg = getErrorMessage(
        preflightErr,
        "事前チェック中にエラーが発生しました"
      );
      console.error("[Migration] Pre-flight check error:", errorMsg);
      setError({
        message: errorMsg,
        step: "事前チェック",
        fullError: errorMsg,
      });
      setMigrating(false);
      return;
    }

    const supabaseStorage = new SupabaseSakeStorage();
    const idbStorage = new IDBSakeStorage();

    try {
      // Migrate records
      for (let i = 0; i < idbRecords.length; i++) {
        const record = idbRecords[i];
        const stepLabel = `${i + 1}/${total}: ${record.name || "（名前なし）"}`;

        try {
          console.log(`[Migration] Uploading record ${stepLabel}...`);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, updatedAt, ...input } = record;
          await supabaseStorage.create({ ...input, name: input.name || "" });
          console.log(`[Migration] Successfully uploaded ${stepLabel}`);
          setProgress(i + 1);
        } catch (recordErr) {
          const errorMsg = getErrorMessage(
            recordErr,
            `レコード「${record.name || "（名前なし）"}」の転送に失敗しました`
          );
          console.error(
            `[Migration] Error uploading record ${stepLabel}:`,
            recordErr
          );
          setError({
            message: errorMsg,
            failedRecord: {
              name: record.name || "（名前なし）",
              date: record.date,
            },
            step: "レコードアップロード",
            fullError:
              recordErr instanceof Error
                ? `${recordErr.message}\n${recordErr.stack}`
                : String(recordErr),
          });
          setMigrating(false);
          return;
        }
      }

      // Delete migrated records from IndexedDB
      console.log("[Migration] Deleting migrated records from IndexedDB...");
      for (const record of idbRecords) {
        try {
          await idbStorage.delete(record.id);
        } catch (delErr) {
          console.warn(
            `[Migration] Warning: Failed to delete ${record.id} from IndexedDB:`,
            delErr
          );
          // Non-blocking error for IndexedDB deletion
        }
      }

      console.log("[Migration] Migration completed successfully!");
      setDone(true);
    } catch (err) {
      const errorMsg = getErrorMessage(
        err,
        "移行中にエラーが発生しました"
      );
      console.error("[Migration] Unexpected error:", err);
      setError({
        message: errorMsg,
        step: "移行処理",
        fullError:
          err instanceof Error
            ? `${err.message}\n${err.stack}`
            : String(err),
      });
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
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg mb-4">
            <div className="font-medium mb-2">{error.message}</div>
            {error.failedRecord && (
              <div className="text-xs text-red-500 dark:text-red-300 mb-2">
                <div>レコード: 「{error.failedRecord.name}」</div>
                <div>日付: {error.failedRecord.date}</div>
              </div>
            )}
            {error.step && (
              <div className="text-xs text-red-500 dark:text-red-300 mb-2">
                失敗ステップ: {error.step}
              </div>
            )}
            {error.fullError && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-red-500 dark:text-red-300 hover:underline"
                >
                  {showDetails ? "詳細を隠す" : "詳細を表示"}
                </button>
                {showDetails && (
                  <div className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded font-mono overflow-auto max-h-40">
                    {error.fullError}
                  </div>
                )}
              </div>
            )}
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
