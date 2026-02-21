"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import type { SakeStorage } from "@/lib/types";

export type SharingContext =
  | { type: "own" }
  | { type: "shared"; ownerId: string };

const STORAGE_KEY = "sakelabeler:sharingContext";

function loadSharingContext(): SharingContext {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.type === "own" || (parsed.type === "shared" && parsed.ownerId)) {
        return parsed;
      }
    }
  } catch {}
  return { type: "own" };
}

function saveSharingContext(ctx: SharingContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {}
}

type StorageContextType = {
  storage: SakeStorage;
  sharingContext: SharingContext;
  switchToOwn: () => void;
  switchToShared: (ownerId: string) => void;
};

const StorageContext = createContext<StorageContextType>({
  storage: new SupabaseSakeStorage(),
  sharingContext: { type: "own" },
  switchToOwn: () => {},
  switchToShared: () => {},
});

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [sharingContext, setSharingContext] = useState<SharingContext>(
    () => loadSharingContext()
  );

  const storage = useMemo<SakeStorage>(() => {
    if (sharingContext.type === "shared") {
      return new SupabaseSakeStorage(sharingContext.ownerId);
    }
    return new SupabaseSakeStorage();
  }, [sharingContext]);

  const switchToOwn = useCallback(() => {
    const ctx: SharingContext = { type: "own" };
    saveSharingContext(ctx);
    setSharingContext(ctx);
  }, []);

  const switchToShared = useCallback((ownerId: string) => {
    const ctx: SharingContext = { type: "shared", ownerId };
    saveSharingContext(ctx);
    setSharingContext(ctx);
  }, []);

  return (
    <StorageContext.Provider
      value={{ storage, sharingContext, switchToOwn, switchToShared }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}
