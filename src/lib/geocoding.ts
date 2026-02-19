import type { Location } from "./types";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";
const MIN_REQUEST_INTERVAL_MS = 1100;

let lastRequestTime = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();
}

function formatAddress(data: {
  address?: Record<string, string>;
  display_name?: string;
}): string | null {
  const addr = data.address;
  if (!addr) {
    if (data.display_name) {
      const parts = data.display_name.split(",").map((s) => s.trim());
      return parts.slice(0, 2).join(", ");
    }
    return null;
  }

  const locality =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.city_district ||
    addr.suburb ||
    addr.municipality;

  const region = addr.county || addr.state || addr.country;

  if (locality && region && locality !== region) {
    return `${locality}, ${region}`;
  }
  if (locality) return locality;
  if (region) return region;

  if (data.display_name) {
    const parts = data.display_name.split(",").map((s) => s.trim());
    return parts.slice(0, 2).join(", ");
  }
  return null;
}

export async function reverseGeocode(
  location: Location
): Promise<string | null> {
  try {
    await throttle();

    const url = new URL(NOMINATIM_BASE);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(location.lat));
    url.searchParams.set("lon", String(location.lng));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "ja,en");
    url.searchParams.set("zoom", "16");

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    return formatAddress(data);
  } catch {
    return null;
  }
}
