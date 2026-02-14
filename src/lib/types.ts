export type SakePhoto = {
  url: string;
  isCover: boolean;
};

export type SakeRecord = {
  id: string;
  name: string;
  photos: SakePhoto[];
  restaurant: string;
  origin: string;
  date: string;
  rating: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type SakeRecordInput = Omit<SakeRecord, "id" | "createdAt" | "updatedAt">;

export function getCoverPhoto(photos: SakePhoto[]): string | null {
  if (photos.length === 0) return null;
  const cover = photos.find((p) => p.isCover);
  return cover ? cover.url : photos[0].url;
}

export interface SakeStorage {
  getAll(): Promise<SakeRecord[]>;
  getById(id: string): Promise<SakeRecord | null>;
  create(input: SakeRecordInput): Promise<SakeRecord>;
  update(id: string, input: Partial<SakeRecordInput>): Promise<SakeRecord>;
  delete(id: string): Promise<void>;
}
