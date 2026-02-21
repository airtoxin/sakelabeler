"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { SakeForm } from "@/components/SakeForm";
import { StarRating } from "@/components/StarRating";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AuthGuard } from "@/components/AuthGuard";
import { useStorage } from "@/components/StorageProvider";
import { formatDate } from "@/lib/utils";
import { getAlcoholTypeConfig } from "@/lib/alcohol-types";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { reverseGeocode } from "@/lib/geocoding";
import type { SakeRecord, SakeRecordInput } from "@/lib/types";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
  ),
});

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storage = useStorage();
  const id = params.id as string;

  const [record, setRecord] = useState<SakeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    storage.getById(id).then((r) => {
      setRecord(r);
      setLoading(false);
    });
  }, [id, storage]);

  useEffect(() => {
    if (record && record.location && !record.locationText) {
      reverseGeocode(record.location).then((text) => {
        if (text) {
          storage.update(record.id, { locationText: text }).then((updated) => {
            setRecord(updated);
          });
        }
      });
    }
  }, [record?.id, record?.location, record?.locationText, storage]);

  const handleUpdate = async (values: SakeRecordInput) => {
    await storage.update(id, values);
    const updated = await storage.getById(id);
    setRecord(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    await storage.delete(id);
    router.push("/");
  };

  if (loading) {
    return (
      <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="読み込み中..." showBack />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      </div>
      </AuthGuard>
    );
  }

  if (!record) {
    return (
      <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="エラー" showBack />
        <div className="px-4 py-20 text-center text-gray-500">
          記録が見つかりませんでした
        </div>
      </div>
      </AuthGuard>
    );
  }

  if (editing) {
    return (
      <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="記録を編集" showBack />
        <main className="px-4 py-4 max-w-lg mx-auto">
          <SakeForm
            initialValues={record}
            onSubmit={handleUpdate}
            submitLabel="更新する"
          />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="w-full mt-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
        </main>
      </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-background">
      <Header title={record.name || "（名称未入力）"} showBack />

      <main className="max-w-lg mx-auto relative z-0">
        {record.photos.length > 0 && (
          <PhotoCarousel photos={record.photos} alt={record.name || "お酒の写真"} />
        )}

        <div className="px-4 py-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {record.name || (
                  <span className="text-gray-400 dark:text-gray-500">
                    （名称未入力）
                  </span>
                )}
              </h2>
              {record.alcoholType && (() => {
                const typeConfig = getAlcoholTypeConfig(record.alcoholType);
                return typeConfig ? (
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                ) : null;
              })()}
            </div>
            <StarRating value={record.rating} size="sm" />
            {record.tags && record.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {record.tags.map((tag) => {
                  const typeConfig = record.alcoholType ? getAlcoholTypeConfig(record.alcoholType) : undefined;
                  return (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig ? typeConfig.color : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {record.restaurant && (
              <div className="flex gap-2">
                <span className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">
                  お店
                </span>
                <span>{record.restaurant}</span>
              </div>
            )}
            {record.origin && (
              <div className="flex gap-2">
                <span className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">
                  産地
                </span>
                <span>{record.origin}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">
                日付
              </span>
              <span>{formatDate(record.date)}</span>
            </div>
          </div>

          {record.location && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">
                  場所
                </span>
                <div className="flex flex-col">
                  {record.locationText && (
                    <span>{record.locationText}</span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {record.location.lat.toFixed(6)},{" "}
                    {record.location.lng.toFixed(6)}
                  </span>
                </div>
              </div>
              <div className="h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <LocationMap
                  center={[record.location.lat, record.location.lng]}
                  marker={[record.location.lat, record.location.lng]}
                  interactive={false}
                  zoom={15}
                />
              </div>
            </div>
          )}

          {record.memo && (
            <div>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                メモ
              </span>
              <p className="mt-1 text-sm whitespace-pre-wrap">{record.memo}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors"
            >
              編集する
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="py-3 px-5 rounded-lg border border-red-300 dark:border-red-800 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      </main>

      {showDeleteConfirm && (
        <ConfirmDialog
          message="この記録を削除しますか？この操作は取り消せません。"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
    </AuthGuard>
  );
}
