import { IDBSakeStorage } from "./storage-idb";
import type { SakeStorage } from "./types";

function createStorage(): SakeStorage {
  return new IDBSakeStorage();
}

export const storage = createStorage();
