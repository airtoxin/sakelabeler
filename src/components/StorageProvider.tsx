"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { IDBSakeStorage } from "@/lib/storage-idb";
import { SupabaseSakeStorage } from "@/lib/storage-supabase";
import type { SakeStorage } from "@/lib/types";

const StorageContext = createContext<SakeStorage>(new IDBSakeStorage());

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const storage = useMemo<SakeStorage>(() => {
    if (user) {
      return new SupabaseSakeStorage();
    }
    return new IDBSakeStorage();
  }, [user]);

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}
