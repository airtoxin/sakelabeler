"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Location } from "@/lib/types";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm text-gray-400">
      地図を読み込み中...
    </div>
  ),
});

type LocationPickerProps = {
  value: Location | null;
  locationText?: string | null;
  onChange: (location: Location | null) => void;
};

export function LocationPicker({ value, locationText, onChange }: LocationPickerProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("お使いのブラウザは位置情報に対応していません");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLoading(false);
        setMapOpen(false);
      },
      (error) => {
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("位置情報の使用が許可されていません");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("位置情報を取得できませんでした");
            break;
          case error.TIMEOUT:
            setGeoError("位置情報の取得がタイムアウトしました");
            break;
          default:
            setGeoError("位置情報の取得に失敗しました");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setMapOpen(false);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">場所</span>

      {value && !mapOpen ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <div className="h-32">
            <LocationMap
              center={[value.lat, value.lng]}
              marker={[value.lat, value.lng]}
              interactive={false}
              zoom={15}
            />
          </div>
          <div className="px-3 py-2 flex items-center justify-between bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {locationText || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                変更
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-500 hover:underline"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ) : !mapOpen ? (
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">場所を設定</span>
        </button>
      ) : null}

      {mapOpen && (
        <div className="flex flex-col gap-2">
          <div className="h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <LocationMap
              center={
                value ? [value.lat, value.lng] : [35.6812, 139.7671]
              }
              marker={value ? [value.lat, value.lng] : null}
              interactive={true}
              zoom={value ? 15 : 5}
              onLocationSelect={(lat, lng) => {
                onChange({ lat, lng });
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="flex-1 py-2 rounded-lg border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors disabled:opacity-50"
            >
              {geoLoading ? "取得中..." : "現在地を使用"}
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                削除
              </button>
            )}
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              閉じる
            </button>
          </div>

          {geoError && <p className="text-xs text-red-500">{geoError}</p>}
        </div>
      )}
    </div>
  );
}
