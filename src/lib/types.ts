export type SakeRecord = {
  id: string;
  name: string;
  photo: string | null;
  restaurant: string;
  origin: string;
  date: string;
  rating: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type SakeRecordInput = Omit<SakeRecord, "id" | "createdAt" | "updatedAt">;

export interface SakeStorage {
  getAll(): Promise<SakeRecord[]>;
  getById(id: string): Promise<SakeRecord | null>;
  create(input: SakeRecordInput): Promise<SakeRecord>;
  update(id: string, input: Partial<SakeRecordInput>): Promise<SakeRecord>;
  delete(id: string): Promise<void>;
}
