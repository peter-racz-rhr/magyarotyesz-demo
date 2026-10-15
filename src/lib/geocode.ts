/*
  Address search for Budapest, from OpenStreetMap data. Two free services,
  tried in turn so one being busy or down doesn't leave you with nothing:
  Photon first (fast, finds places as you type), then Nominatim.
  Used to sort toilets by distance from an address you type.
*/

export type Place = { id: string; label: string; detail: string; latitude: number; longitude: number };

// Budapest's bounding box.
const WEST = 18.92;
const SOUTH = 47.35;
const EAST = 19.34;
const NORTH = 47.62;
// Without a location to go by, results lean towards Deák Ferenc tér.
const CENTRE = { lat: 47.4979, lon: 19.0402 };

/** What people type is shorter than what maps say: "Fő u.", "Bajcsy krt". */
export function normalizeQuery(query: string) {
  return query
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bu\.(?=\s|$)/gi, "utca")
    .replace(/\bu(?=\s+\d|$)/gi, "utca")
    .replace(/\bkrt\.?(?=\s|$)/gi, "körút")
    .replace(/\bsgt\.?(?=\s|$)/gi, "sétány");
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
  };
};

type NominatimItem = {
  place_id?: number;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    suburb?: string;
    city_district?: string;
    postcode?: string;
  };
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  // A service that doesn't answer shouldn't hold the other one up for long.
  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), 7000);
  const forward = () => timeout.abort();
  signal?.addEventListener("abort", forward);
  try {
    const response = await fetch(url, { signal: timeout.signal });
    if (!response.ok) throw new Error(`Address search failed (${response.status})`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", forward);
  }
}

async function photon(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&bbox=${WEST},${SOUTH},${EAST},${NORTH}&lat=${CENTRE.lat}&lon=${CENTRE.lon}`;
  const data = await getJson<{ features?: PhotonFeature[] }>(url, signal);
  return (data.features ?? []).map((f, i) => {
    const p = f.properties;
    const street = [p.street, p.housenumber].filter(Boolean).join(" ");
    const label = p.name ?? (street || "");
    const detail = [p.name ? street : "", p.district ?? p.suburb, p.postcode].filter(Boolean).join(", ");
    return {
      id: `p${p.osm_id ?? i}-${i}`,
      label,
      detail: detail || "Budapest",
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    };
  });
}

// Nominatim asks for at most one request a second.
let lastNominatim = 0;

async function nominatim(q: string, signal?: AbortSignal): Promise<Place[]> {
  const wait = lastNominatim + 1100 - Date.now();
  if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
  lastNominatim = Date.now();
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=hu` +
    `&viewbox=${WEST},${NORTH},${EAST},${SOUTH}&bounded=1&accept-language=hu&q=${encodeURIComponent(q)}`;
  const data = await getJson<NominatimItem[]>(url, signal);
  return data.map((item, i) => {
    const a = item.address ?? {};
    const street = [a.road ?? a.pedestrian, a.house_number].filter(Boolean).join(" ");
    const label = item.name || street || (item.display_name ?? "").split(",")[0] || "";
    const detail = [item.name ? street : "", a.city_district ?? a.suburb, a.postcode].filter(Boolean).join(", ");
    return {
      id: `n${item.place_id ?? i}-${i}`,
      label,
      detail: detail || "Budapest",
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    };
  });
}

const inBudapest = (p: Place) =>
  Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= SOUTH && p.latitude <= NORTH && p.longitude >= WEST && p.longitude <= EAST;

/** Same name in the same district (a street comes back as many pieces) is one result. */
function tidy(places: Place[]) {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const place of places) {
    if (!place.label || !inBudapest(place)) continue;
    const key = `${place.label.toLowerCase()}|${place.detail.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out.slice(0, 5);
}

const cache = new Map<string, Place[]>();

/**
 * Addresses and places matching what was typed. Rejects only when neither
 * service could be reached; "found nothing" is an empty list.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = normalizeQuery(query);
  if (q.length < 2) return [];
  const cached = cache.get(q.toLowerCase());
  if (cached) return cached;

  let answered = false;
  let failure: unknown = null;
  for (const service of [photon, nominatim]) {
    try {
      const found = tidy(await service(q, signal));
      answered = true;
      if (found.length > 0) {
        cache.set(q.toLowerCase(), found);
        return found;
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      failure = error;
    }
  }
  if (!answered) throw failure ?? new Error("Address search failed");
  return [];
}
