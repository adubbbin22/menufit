import type { Place } from './types';

/**
 * Nearby restaurants and place search from OpenStreetMap. The public Overpass
 * servers are shared and often busy, so requests rotate through mirrors. For a
 * production launch, point these at your own instance or a commercial places API.
 */
const OVERPASS = (process.env.EXPO_PUBLIC_OVERPASS_URLS ?? 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter').split(',');
const NOMINATIM = process.env.EXPO_PUBLIC_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org';

// OpenStreetMap services reject requests that do not identify the app.
const HEADERS = { 'User-Agent': 'Tablewise/1.0 (restaurant finder app)' };

export class PlacesError extends Error {}

const CUISINE_EMOJI: [RegExp, string][] = [
  [/steak|bbq|barbecue|grill/, '🥩'], [/burger/, '🍔'], [/pizza/, '🍕'], [/mexican|taco|burrito|tex/, '🌮'], [/sushi|japanese|ramen/, '🍣'],
  [/chinese|asian|noodle|thai|vietnamese|korean/, '🥡'], [/italian|pasta/, '🍝'], [/indian|curry/, '🍛'],
  [/chicken|wings/, '🍗'], [/sandwich|sub|deli|bagel/, '🥪'], [/coffee|cafe|\btea\b|bakery|donut/, '☕'],
  [/breakfast|pancake|brunch/, '🥞'], [/seafood|fish/, '🐟'],
  [/mediterranean|greek|kebab|turkish|lebanese|falafel/, '🥙'], [/salad|vegan|vegetarian|healthy|poke/, '🥗'], [/ice_cream|dessert/, '🍨'], [/\b(bar|pub)\b/, '🍺'],
];

function emojiFor(text: string): string {
  return CUISINE_EMOJI.find(([re]) => re.test(text))?.[1] ?? '🍽️';
}

const AMENITY_LABEL: Record<string, string> = { restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Cafe', bar: 'Bar', pub: 'Pub' };

export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

export function formatDistance(m: number, imperial: boolean): string {
  if (imperial) {
    const mi = m / 1609.34;
    return mi < 0.1 ? `${Math.round(m * 3.281 / 10) * 10} ft` : `${mi.toFixed(1)} mi`;
  }
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function parsePlaces(elements: OsmElement[], lat: number, lon: number): Place[] {
  const byName = new Map<string, Place>();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (!tags.name || plat === undefined || plon === undefined) continue;
    const cuisineRaw = (tags.cuisine ?? '').split(';')[0].replace(/_/g, ' ').trim();
    const cuisine = cuisineRaw ? cuisineRaw.charAt(0).toUpperCase() + cuisineRaw.slice(1) : AMENITY_LABEL[tags.amenity] ?? 'Restaurant';
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    const place: Place = {
      id: `${el.type}-${el.id}`,
      name: tags.name,
      cuisine,
      emoji: emojiFor(`${tags.cuisine ?? ''} ${tags.amenity ?? ''} ${tags.name}`.toLowerCase()),
      lat: plat,
      lon: plon,
      distanceM: distanceM(lat, lon, plat, plon),
      address: [street, tags['addr:city']].filter(Boolean).join(', ') || undefined,
    };
    // A chain with several branches nearby appears once, at its closest branch.
    const key = tags.name.toLowerCase();
    const seen = byName.get(key);
    if (!seen || place.distanceM < seen.distanceM) byName.set(key, place);
  }
  return [...byName.values()].sort((a, b) => a.distanceM - b.distanceM);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fromOverpass(lat: number, lon: number, radiusM: number): Promise<Place[] | null> {
  const query = `[out:json][timeout:20];nwr(around:${radiusM},${lat},${lon})[amenity~"^(restaurant|fast_food|cafe|bar|pub)$"][name];out center tags 150;`;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { headers: HEADERS });
      if (res.ok) {
        const data = (await res.json()) as { elements: OsmElement[] };
        return parsePlaces(data.elements ?? [], lat, lon);
      }
    } catch {
      // try the next mirror
    }
  }
  return null;
}

interface NominatimPoi {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
}

/** Slower fallback: one bounded search per kind of place, spaced to respect the service's rate limit. */
async function fromNominatim(lat: number, lon: number, radiusM: number): Promise<Place[]> {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const box = `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`;
  const elements: OsmElement[] = [];
  let answered = false;
  for (const kind of ['restaurant', 'fast_food', 'cafe']) {
    if (answered) await sleep(1100);
    try {
      const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(`[${kind}]`)}&format=jsonv2&limit=40&bounded=1&viewbox=${box}&extratags=1&addressdetails=1`, { headers: HEADERS });
      if (!res.ok) continue;
      answered = true;
      for (const poi of (await res.json()) as NominatimPoi[]) {
        const tags: Record<string, string> = { amenity: poi.type ?? kind };
        if (poi.name) tags.name = poi.name;
        if (poi.extratags?.cuisine) tags.cuisine = poi.extratags.cuisine;
        if (poi.address?.house_number) tags['addr:housenumber'] = poi.address.house_number;
        if (poi.address?.road) tags['addr:street'] = poi.address.road;
        elements.push({ type: poi.osm_type, id: poi.osm_id, lat: Number(poi.lat), lon: Number(poi.lon), tags });
      }
    } catch {
      // keep whatever the other kinds returned
    }
  }
  if (!answered) throw new PlacesError('Could not load nearby restaurants. Check your connection and try again, or search by name.');
  return parsePlaces(elements, lat, lon);
}

export async function fetchNearby(lat: number, lon: number, radiusM = 1500): Promise<Place[]> {
  return (await fromOverpass(lat, lon, radiusM)) ?? fromNominatim(lat, lon, radiusM);
}

export interface CityHit {
  label: string;
  lat: number;
  lon: number;
}

export async function searchCity(q: string): Promise<CityHit[]> {
  try {
    const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=5`, { headers: HEADERS });
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    return data.map((d) => ({ label: d.display_name.split(',').slice(0, 3).join(',').trim(), lat: Number(d.lat), lon: Number(d.lon) }));
  } catch {
    throw new PlacesError('Could not search for that place. Check your connection and try again.');
  }
}

export async function reverseLabel(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=14`, { headers: HEADERS });
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    return [a.suburb ?? a.neighbourhood ?? a.town ?? a.village, a.city ?? a.county].filter(Boolean).join(', ') || 'Current location';
  } catch {
    return 'Current location';
  }
}
