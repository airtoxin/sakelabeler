"use client";

import { useState, useEffect, useRef } from "react";
import { useStorage } from "@/components/StorageProvider";
import { getSharedWithMe, type DbShare } from "@/lib/sharing";

function shortenId(id: string): string {
  return id.substring(0, 7) + "...";
}

export function ContextSwitcher() {
  const { sharingContext, switchToOwn, switchToShared } = useStorage();
  const [shares, setShares] = useState<DbShare[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSharedWithMe().then(setShares).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (shares.length === 0) return null;

  const label =
    sharingContext.type === "own"
      ? "マイDB"
      : `共有DB (${shortenId(sharingContext.ownerId)})`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 active:bg-violet-700 transition-colors flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[160px] py-1 z-50">
          <button
            type="button"
            onClick={() => {
              switchToOwn();
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
              sharingContext.type === "own"
                ? "text-violet-600 dark:text-violet-400 font-medium"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            マイDB
          </button>
          {shares.map((share) => (
            <button
              key={share.id}
              type="button"
              onClick={() => {
                switchToShared(share.owner_id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                sharingContext.type === "shared" &&
                sharingContext.ownerId === share.owner_id
                  ? "text-violet-600 dark:text-violet-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              共有DB ({shortenId(share.owner_id)})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
