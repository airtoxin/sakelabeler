import { supabase } from "./supabase";
import type {
  SakeRecord,
  SakeRecordInput,
  SakeStorage,
  SakePhoto,
  AlcoholType,
} from "./types";

type DbRecord = {
  id: string;
  user_id: string;
  name: string;
  alcohol_type: string;
  tags: string[];
  restaurant: string;
  origin: string;
  location_lat: number | null;
  location_lng: number | null;
  location_text: string | null;
  date: string;
  rating: number;
  memo: string;
  created_at: string;
  updated_at: string;
};

type DbPhoto = {
  id: string;
  record_id: string;
  user_id: string;
  storage_path: string;
  is_cover: boolean;
  gps_lat: number | null;
  gps_lng: number | null;
  sort_order: number;
  created_at: string;
};

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

function isBase64DataUrl(url: string): boolean {
  return url.startsWith("data:");
}

function storagePathToUrl(path: string): string {
  const { data } = supabase.storage.from("sake-photos").getPublicUrl(path);
  return data.publicUrl;
}

function extractStoragePath(url: string): string | null {
  const bucket = "sake-photos";
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export class SupabaseSakeStorage implements SakeStorage {
  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  private toSakeRecord(row: DbRecord, photos: DbPhoto[]): SakeRecord {
    return {
      id: row.id,
      name: row.name,
      photos: photos
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => {
          const photo: SakePhoto = {
            url: storagePathToUrl(p.storage_path),
            isCover: p.is_cover,
          };
          if (p.gps_lat != null && p.gps_lng != null) {
            photo.gpsLocation = { lat: p.gps_lat, lng: p.gps_lng };
          }
          return photo;
        }),
      alcoholType: row.alcohol_type as AlcoholType,
      tags: row.tags,
      restaurant: row.restaurant,
      origin: row.origin,
      location:
        row.location_lat != null && row.location_lng != null
          ? { lat: row.location_lat, lng: row.location_lng }
          : null,
      locationText: row.location_text,
      date: row.date,
      rating: row.rating,
      memo: row.memo,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async uploadPhoto(
    userId: string,
    recordId: string,
    photo: SakePhoto,
    sortOrder: number
  ): Promise<DbPhoto> {
    const photoId = crypto.randomUUID();
    const storagePath = `${userId}/${recordId}/${photoId}.jpg`;

    if (isBase64DataUrl(photo.url)) {
      const blob = base64ToBlob(photo.url);
      const { error } = await supabase.storage
        .from("sake-photos")
        .upload(storagePath, blob, { contentType: "image/jpeg" });
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from("sake_photos")
      .insert({
        record_id: recordId,
        user_id: userId,
        storage_path: storagePath,
        is_cover: photo.isCover,
        gps_lat: photo.gpsLocation?.lat ?? null,
        gps_lng: photo.gpsLocation?.lng ?? null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error("Failed to insert photo");
    return data as DbPhoto;
  }

  async getAll(): Promise<SakeRecord[]> {
    const userId = await this.getUserId();

    const { data: records, error } = await supabase
      .from("sake_records")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!records || records.length === 0) return [];

    const recordIds = records.map((r: DbRecord) => r.id);
    const { data: photos } = await supabase
      .from("sake_photos")
      .select("*")
      .in("record_id", recordIds);

    const photosByRecord = new Map<string, DbPhoto[]>();
    for (const photo of (photos ?? []) as DbPhoto[]) {
      const existing = photosByRecord.get(photo.record_id) ?? [];
      existing.push(photo);
      photosByRecord.set(photo.record_id, existing);
    }

    return records.map((r: DbRecord) =>
      this.toSakeRecord(r, photosByRecord.get(r.id) ?? [])
    );
  }

  async getById(id: string): Promise<SakeRecord | null> {
    const { data: record, error } = await supabase
      .from("sake_records")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !record) return null;

    const { data: photos } = await supabase
      .from("sake_photos")
      .select("*")
      .eq("record_id", id);

    return this.toSakeRecord(record as DbRecord, (photos ?? []) as DbPhoto[]);
  }

  async create(input: SakeRecordInput): Promise<SakeRecord> {
    const userId = await this.getUserId();

    const { data: record, error } = await supabase
      .from("sake_records")
      .insert({
        user_id: userId,
        name: input.name,
        alcohol_type: input.alcoholType,
        tags: input.tags,
        restaurant: input.restaurant,
        origin: input.origin,
        location_lat: input.location?.lat ?? null,
        location_lng: input.location?.lng ?? null,
        location_text: input.locationText ?? null,
        date: input.date,
        rating: input.rating,
        memo: input.memo,
      })
      .select()
      .single();

    if (error || !record) throw error ?? new Error("Failed to create record");

    for (let i = 0; i < input.photos.length; i++) {
      await this.uploadPhoto(userId, record.id, input.photos[i], i);
    }

    const result = await this.getById(record.id);
    if (!result) throw new Error("Failed to retrieve created record");
    return result;
  }

  async update(
    id: string,
    input: Partial<SakeRecordInput>
  ): Promise<SakeRecord> {
    const userId = await this.getUserId();

    // Update record fields (excluding photos)
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.alcoholType !== undefined)
      updateData.alcohol_type = input.alcoholType;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.restaurant !== undefined) updateData.restaurant = input.restaurant;
    if (input.origin !== undefined) updateData.origin = input.origin;
    if (input.location !== undefined) {
      updateData.location_lat = input.location?.lat ?? null;
      updateData.location_lng = input.location?.lng ?? null;
    }
    if (input.locationText !== undefined)
      updateData.location_text = input.locationText;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.memo !== undefined) updateData.memo = input.memo;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("sake_records")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    }

    // Handle photo changes
    if (input.photos !== undefined) {
      // Get existing photos
      const { data: existingPhotos } = await supabase
        .from("sake_photos")
        .select("*")
        .eq("record_id", id);

      const oldPhotos = (existingPhotos ?? []) as DbPhoto[];

      // Determine which existing photos are kept (by matching storage URL)
      const newPhotoUrls = new Set(input.photos.map((p) => p.url));
      const keptPaths = new Set<string>();

      for (const oldPhoto of oldPhotos) {
        const oldUrl = storagePathToUrl(oldPhoto.storage_path);
        if (newPhotoUrls.has(oldUrl)) {
          keptPaths.add(oldPhoto.storage_path);
        }
      }

      // Delete removed photos from storage and DB
      const removedPhotos = oldPhotos.filter(
        (p) => !keptPaths.has(p.storage_path)
      );
      if (removedPhotos.length > 0) {
        const pathsToRemove = removedPhotos.map((p) => p.storage_path);
        await supabase.storage.from("sake-photos").remove(pathsToRemove);
        await supabase
          .from("sake_photos")
          .delete()
          .in(
            "id",
            removedPhotos.map((p) => p.id)
          );
      }

      // Update kept photos (isCover, sort_order may have changed)
      for (let i = 0; i < input.photos.length; i++) {
        const photo = input.photos[i];

        if (isBase64DataUrl(photo.url)) {
          // New photo — upload
          await this.uploadPhoto(userId, id, photo, i);
        } else {
          // Existing photo — update metadata
          const storagePath = extractStoragePath(photo.url);
          if (storagePath) {
            await supabase
              .from("sake_photos")
              .update({
                is_cover: photo.isCover,
                sort_order: i,
                gps_lat: photo.gpsLocation?.lat ?? null,
                gps_lng: photo.gpsLocation?.lng ?? null,
              })
              .eq("storage_path", storagePath);
          }
        }
      }
    }

    const result = await this.getById(id);
    if (!result) throw new Error("Failed to retrieve updated record");
    return result;
  }

  async delete(id: string): Promise<void> {
    // Get photos to delete from storage
    const { data: photos } = await supabase
      .from("sake_photos")
      .select("storage_path")
      .eq("record_id", id);

    if (photos && photos.length > 0) {
      const paths = photos.map((p: { storage_path: string }) => p.storage_path);
      await supabase.storage.from("sake-photos").remove(paths);
    }

    // Delete record (cascade will delete sake_photos rows)
    const { error } = await supabase
      .from("sake_records")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
