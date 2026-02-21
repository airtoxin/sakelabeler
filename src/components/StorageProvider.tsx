"use client";

import { createContext, useContext, useMemo } from "react";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import type { SakeStorage } from "@/lib/types";

const StorageContext = createContext<SakeStorage>(new SupabaseSakeStorage());

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const storage = useMemo<SakeStorage>(() => {
    return new SupabaseSakeStorage();
  }, []);

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}
