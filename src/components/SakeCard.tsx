"use client";

import Link from "next/link";
import { StarRating } from "./StarRating";
import { formatDate } from "@/lib/utils";
import type { SakeRecord } from "@/lib/types";

type SakeCardProps = {
  record: SakeRecord;
};

export function SakeCard({ record }: SakeCardProps) {
  return (
    <Link
      href={`/${record.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="flex">
        {record.photo && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={record.photo}
              alt={record.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <h3 className="font-bold text-base truncate">{record.name}</h3>
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
