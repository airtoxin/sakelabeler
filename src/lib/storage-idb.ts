import { openDB, type IDBPDatabase } from "idb";
import type { SakeRecord, SakeRecordInput, SakeStorage } from "./types";

const DB_NAME = "sakelabeler";
const DB_VERSION = 1;
const STORE_NAME = "records";

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

export class IDBSakeStorage implements SakeStorage {
  async getAll(): Promise<SakeRecord[]> {
    const db = await getDB();
    const records = await db.getAll(STORE_NAME);
    return records.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<SakeRecord | null> {
    const db = await getDB();
    const record = await db.get(STORE_NAME, id);
    return record ?? null;
  }

  async create(input: SakeRecordInput): Promise<SakeRecord> {
    const now = new Date().toISOString();
    const record: SakeRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDB();
    await db.add(STORE_NAME, record);
    return record;
  }

  async update(
    id: string,
    input: Partial<SakeRecordInput>
  ): Promise<SakeRecord> {
    const db = await getDB();
    const existing = await db.get(STORE_NAME, id);
    if (!existing) throw new Error("Record not found");
    const updated: SakeRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORE_NAME, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  }
}
