/*
  Address search with Photon (OpenStreetMap data, free, no key), kept to
  Budapest. Used to sort toilets by distance from an address you type.
*/

export type Place = { id: string; label: string; detail: string; latitude: number; longitude: number };

// Budapest's bounding box: west, south, east, north.
const BUDAPEST_BBOX = "18.92,47.35,19.34,47.62";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    postcode?: string;
  };
};

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=${BUDAPEST_BBOX}&lat=47.4979&lon=19.0402`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Address search failed (${response.status})`);
  const data = (await response.json()) as { features: PhotonFeature[] };
  return data.features.map((f, i) => {
    const p = f.properties;
    const street = [p.street, p.housenumber].filter(Boolean).join(" ");
    const label = p.name ?? (street || "Unnamed place");
    const detail = [p.name ? street : "", p.district, p.postcode].filter(Boolean).join(", ");
    return {
      id: `${p.osm_id ?? i}-${i}`,
      label,
      detail: detail || "Budapest",
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    };
  });
}
