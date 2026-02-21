"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import type { SakeStorage } from "@/lib/types";

export type SharingContext =
  | { type: "own" }
  | { type: "shared"; ownerId: string };

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
  const [sharingContext, setSharingContext] = useState<SharingContext>({
    type: "own",
  });

  const storage = useMemo<SakeStorage>(() => {
    if (sharingContext.type === "shared") {
      return new SupabaseSakeStorage(sharingContext.ownerId);
    }
    return new SupabaseSakeStorage();
  }, [sharingContext]);

  const switchToOwn = useCallback(() => {
    setSharingContext({ type: "own" });
  }, []);

  const switchToShared = useCallback((ownerId: string) => {
    setSharingContext({ type: "shared", ownerId });
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
