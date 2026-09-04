const PREFIX = "meshigacha:";

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return /** @type {T} */ (JSON.parse(raw));
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export function saveJson(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {string} key
 */
export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** @typedef {{ id: string, name: string, lat: number, lon: number, amenity: string, cuisine: string, distance: number, at: number }} HistoryItem */

const HISTORY_MAX = 20;

/** @returns {HistoryItem[]} */
export function getHistory() {
  return loadJson("history", []);
}

/** @param {Omit<HistoryItem, 'at'>} item */
export function pushHistory(item) {
  const list = getHistory().filter((h) => h.id !== item.id);
  list.unshift({ ...item, at: Date.now() });
  saveJson("history", list.slice(0, HISTORY_MAX));
}

export function clearHistory() {
  removeKey("history");
}

export function getPrefs() {
  return loadJson("prefs", {
    radius: 1000,
    autoStart: true,
  });
}

/** @param {Partial<ReturnType<typeof getPrefs>>} patch */
export function savePrefs(patch) {
  saveJson("prefs", { ...getPrefs(), ...patch });
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_NEAR_M = 120;

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} radius
 */
export function readSearchCache(lat, lon, radius) {
  const cache = loadJson("searchCache", null);
  if (!cache || cache.radius !== radius) return null;
  if (Date.now() - cache.savedAt > CACHE_TTL_MS) return null;
  const dist = haversine(lat, lon, cache.lat, cache.lon);
  if (dist > CACHE_NEAR_M) return null;
  return cache.restaurants;
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} radius
 * @param {unknown[]} restaurants
 */
export function writeSearchCache(lat, lon, radius, restaurants) {
  saveJson("searchCache", {
    lat,
    lon,
    radius,
    restaurants,
    savedAt: Date.now(),
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
