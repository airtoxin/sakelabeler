"use client";

import Link from "next/link";
import { StarRating } from "./StarRating";
import { formatDate } from "@/lib/utils";
import { getCoverPhoto } from "@/lib/types";
import type { SakeRecord } from "@/lib/types";

type SakeCardProps = {
  record: SakeRecord;
};

export function SakeCard({ record }: SakeCardProps) {
  const coverPhoto = getCoverPhoto(record.photos);

  return (
    <Link
      href={`/${record.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="flex">
        {coverPhoto && (
          <div className="w-24 h-24 flex-shrink-0 relative">
            <img
              src={coverPhoto}
              alt={record.name}
              className="w-full h-full object-cover"
            />
            {record.photos.length > 1 && (
              <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 bg-black/60 text-white rounded-full flex items-center gap-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909-4.22-4.22a.75.75 0 00-1.06 0L2.5 11.06zm6.5-4.56a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {record.photos.length}
              </span>
            )}
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <h3 className="font-bold text-base truncate">
            {record.name || (
              <span className="text-gray-400 dark:text-gray-500">
                （名称未入力）
              </span>
            )}
          </h3>
          {record.restaurant && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {record.restaurant}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <StarRating value={record.rating} size="sm" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(record.date)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
