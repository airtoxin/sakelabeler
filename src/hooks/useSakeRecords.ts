"use client";

import { useState, useEffect, useCallback } from "react";
import { useStorage } from "@/components/StorageProvider";
import type { SakeRecord, SakeRecordInput } from "@/lib/types";

export function useSakeRecords() {
  const storage = useStorage();
  const [records, setRecords] = useState<SakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await storage.getAll();
    setRecords(data);
    setLoading(false);
  }, [storage]);

  useEffect(() => {
    let cancelled = false;
    storage.getAll().then((data) => {
      if (!cancelled) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const create = async (input: SakeRecordInput) => {
    const record = await storage.create(input);
    await refresh();
    return record;
  };

  const update = async (id: string, input: Partial<SakeRecordInput>) => {
    const record = await storage.update(id, input);
    await refresh();
    return record;
  };

  const remove = async (id: string) => {
    await storage.delete(id);
    await refresh();
  };

  return { records, loading, create, update, remove, refresh };
}
