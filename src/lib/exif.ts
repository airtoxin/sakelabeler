import ExifReader from "exifreader";
import type { Location } from "./types";

export async function extractGpsLocation(
  file: File
): Promise<Location | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    const gps = tags.gps;
    if (!gps || gps.Latitude == null || gps.Longitude == null) {
      return null;
    }

    const lat = gps.Latitude;
    const lng = gps.Longitude;

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
