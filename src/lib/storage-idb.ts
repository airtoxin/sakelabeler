import { openDB, type IDBPDatabase } from "idb";
import type { SakeRecord, SakeRecordInput, SakeStorage } from "./types";

const DB_NAME = "sakelabeler";
const DB_VERSION = 3;
const STORE_NAME = "records";

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }

      // Migrate photo -> photos
      if (oldVersion < 2) {
        const store = transaction.objectStore(STORE_NAME);
        store.openCursor().then(function iterate(cursor): Promise<void> | void {
          if (!cursor) return;
          const record = cursor.value;
          if ("photo" in record && !("photos" in record)) {
            const photos = record.photo
              ? [{ url: record.photo, isCover: true }]
              : [];
            delete record.photo;
            record.photos = photos;
            cursor.update(record);
          }
          return cursor.continue().then(iterate);
        });
      }

      // Add alcoholType and tags fields
      if (oldVersion < 3) {
        const store = transaction.objectStore(STORE_NAME);
        store.openCursor().then(function iterate(cursor): Promise<void> | void {
          if (!cursor) return;
          const record = cursor.value;
          let changed = false;
          if (!("alcoholType" in record)) {
            record.alcoholType = "";
            changed = true;
          }
          if (!("tags" in record)) {
            record.tags = [];
            changed = true;
          }
          if (changed) cursor.update(record);
          return cursor.continue().then(iterate);
        });
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
