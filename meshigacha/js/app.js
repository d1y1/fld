/**
 * めしガチャ — 現在地周辺の外食店をランダム選択
 */
import {
  isOpenNow,
  openStatusLabel,
  formatOpeningHours,
} from "./opening-hours.js";
import {
  getHistory,
  pushHistory,
  clearHistory,
  getPrefs,
  savePrefs,
  readSearchCache,
  writeSearchCache,
} from "./storage.js";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const MEAL_EXCLUDE_AMENITIES = new Set(["bar", "pub", "biergarten"]);

const AMENITY_LABELS = {
  restaurant: "レストラン",
  cafe: "カフェ",
  fast_food: "ファストフード",
  food_court: "フードコート",
  bar: "バー",
  pub: "パブ",
  biergarten: "ビアガーデン",
  ice_cream: "アイス",
  bakery: "ベーカリー",
};

const AMENITY_ICONS = {
  restaurant: "restaurant",
  cafe: "local_cafe",
  fast_food: "fastfood",
  food_court: "food_bank",
  bar: "local_bar",
  pub: "sports_bar",
  biergarten: "nightlife",
  ice_cream: "icecream",
  bakery: "bakery_dining",
};

const CUISINE_LABELS = {
  ramen: "ラーメン",
  sushi: "寿司",
  japanese: "和食",
  italian: "イタリアン",
  chinese: "中華",
  korean: "韓国料理",
  indian: "インド料理",
  thai: "タイ料理",
  french: "フレンチ",
  burger: "バーガー",
  pizza: "ピザ",
  seafood: "海鮮",
  steak: "ステーキ",
  noodles: "麺類",
  udon: "うどん",
  soba: "そば",
  yakitori: "焼き鳥",
  yakiniku: "焼肉",
  curry: "カレー",
  coffee_shop: "コーヒー",
  ice_cream: "アイス",
  bakery: "ベーカリー",
};

/** 徒歩速度の目安（m/分） */
const WALK_SPEED_MPM = 80;

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   lat: number,
 *   lon: number,
 *   amenity: string,
 *   cuisine: string,
 *   distance: number,
 *   phone: string,
 *   website: string,
 *   openingHours: string,
 *   openNow: boolean | null
 * }} Restaurant
 */

const state = {
  /** @type {GeolocationCoordinates | null} */
  coords: null,
  /** @type {Restaurant[]} */
  restaurants: [],
  radius: 1000,
  /** @type {Set<string>} */
  excludedIds: new Set(),
  /** @type {string | null} */
  lastPickedId: null,
  /** @type {Restaurant | null} */
  currentResult: null,
  rolling: false,
  fromCache: false,
  dataSource: "osm",
  mealOnly: true,
  /** @type {string} */
  category: "all",
  /** @type {AbortController | null} */
  searchAbort: null,
  searchToken: 0,
};

/** @type {HTMLElement | null} */
let lastFocus = null;
/** @type {((e: KeyboardEvent) => void) | null} */
let trapHandler = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let toastTimer = null;

const els = {
  main: /** @type {HTMLElement} */ (document.getElementById("main")),
  offlineBanner: /** @type {HTMLElement} */ (document.getElementById("offlineBanner")),
  backBtn: /** @type {HTMLButtonElement} */ (document.getElementById("backBtn")),
  historyBtn: /** @type {HTMLButtonElement} */ (document.getElementById("historyBtn")),
  settingsBtn: /** @type {HTMLButtonElement} */ (document.getElementById("settingsBtn")),
  refreshBtn: /** @type {HTMLButtonElement} */ (document.getElementById("refreshBtn")),
  startBtn: /** @type {HTMLButtonElement} */ (document.getElementById("startBtn")),
  homeHint: /** @type {HTMLElement} */ (document.getElementById("homeHint")),
  loadingText: /** @type {HTMLElement} */ (document.getElementById("loadingText")),
  loadingSub: /** @type {HTMLElement} */ (document.getElementById("loadingSub")),
  categoryChips: /** @type {HTMLElement} */ (document.getElementById("categoryChips")),
  listMeta: /** @type {HTMLElement} */ (document.getElementById("listMeta")),
  restaurantList: /** @type {HTMLElement} */ (document.getElementById("restaurantList")),
  emptyState: /** @type {HTMLElement} */ (document.getElementById("emptyState")),
  emptyBody: /** @type {HTMLElement} */ (document.getElementById("emptyBody")),
  expandRadiusBtn: /** @type {HTMLButtonElement} */ (document.getElementById("expandRadiusBtn")),
  resetFiltersBtn: /** @type {HTMLButtonElement} */ (document.getElementById("resetFiltersBtn")),
  emptyRetryBtn: /** @type {HTMLButtonElement} */ (document.getElementById("emptyRetryBtn")),
  errorTitle: /** @type {HTMLElement} */ (document.getElementById("errorTitle")),
  errorBody: /** @type {HTMLElement} */ (document.getElementById("errorBody")),
  errorIcon: /** @type {HTMLElement} */ (document.getElementById("errorIcon")),
  errorRetryBtn: /** @type {HTMLButtonElement} */ (document.getElementById("errorRetryBtn")),
  errorHomeBtn: /** @type {HTMLButtonElement} */ (document.getElementById("errorHomeBtn")),
  bottomBar: /** @type {HTMLElement} */ (document.getElementById("bottomBar")),
  gachaBtn: /** @type {HTMLButtonElement} */ (document.getElementById("gachaBtn")),
  scrim: /** @type {HTMLElement} */ (document.getElementById("scrim")),
  resultSheet: /** @type {HTMLElement} */ (document.getElementById("resultSheet")),
  resultCard: /** @type {HTMLElement} */ (document.getElementById("resultCard")),
  resultName: /** @type {HTMLElement} */ (document.getElementById("resultName")),
  resultMeta: /** @type {HTMLElement} */ (document.getElementById("resultMeta")),
  resultCuisine: /** @type {HTMLElement} */ (document.getElementById("resultCuisine")),
  resultHours: /** @type {HTMLElement} */ (document.getElementById("resultHours")),
  resultStatus: /** @type {HTMLElement} */ (document.getElementById("resultStatus")),
  resultLive: /** @type {HTMLElement} */ (document.getElementById("resultLive")),
  slot: /** @type {HTMLElement} */ (document.getElementById("slot")),
  slotReel: /** @type {HTMLElement} */ (document.getElementById("slotReel")),
  shareBtn: /** @type {HTMLButtonElement} */ (document.getElementById("shareBtn")),
  walkLink: /** @type {HTMLAnchorElement} */ (document.getElementById("walkLink")),
  walkLabel: /** @type {HTMLElement} */ (document.getElementById("walkLabel")),
  mapLink: /** @type {HTMLAnchorElement} */ (document.getElementById("mapLink")),
  phoneLink: /** @type {HTMLAnchorElement} */ (document.getElementById("phoneLink")),
  phoneLabel: /** @type {HTMLElement} */ (document.getElementById("phoneLabel")),
  webLink: /** @type {HTMLAnchorElement} */ (document.getElementById("webLink")),
  againBtn: /** @type {HTMLButtonElement} */ (document.getElementById("againBtn")),
  excludeBtn: /** @type {HTMLButtonElement} */ (document.getElementById("excludeBtn")),
  closeSheetBtn: /** @type {HTMLButtonElement} */ (document.getElementById("closeSheetBtn")),
  historySheet: /** @type {HTMLElement} */ (document.getElementById("historySheet")),
  historyList: /** @type {HTMLElement} */ (document.getElementById("historyList")),
  historyEmpty: /** @type {HTMLElement} */ (document.getElementById("historyEmpty")),
  clearHistoryBtn: /** @type {HTMLButtonElement} */ (document.getElementById("clearHistoryBtn")),
  closeHistoryBtn: /** @type {HTMLButtonElement} */ (document.getElementById("closeHistoryBtn")),
  settingsSheet: /** @type {HTMLElement} */ (document.getElementById("settingsSheet")),
  autoStartToggle: /** @type {HTMLInputElement} */ (document.getElementById("autoStartToggle")),
  mealOnlyToggle: /** @type {HTMLInputElement} */ (document.getElementById("mealOnlyToggle")),
  closeSettingsBtn: /** @type {HTMLButtonElement} */ (document.getElementById("closeSettingsBtn")),
  toast: /** @type {HTMLElement} */ (document.getElementById("toast")),
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern = [12, 30, 18]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2200);
}

function showScreen(name) {
  document.querySelectorAll("[data-screen]").forEach((el) => {
    el.hidden = /** @type {HTMLElement} */ (el).dataset.screen !== name;
  });

  const showListChrome = name === "list";
  els.refreshBtn.hidden = !showListChrome;
  els.backBtn.hidden = !(name === "list" || name === "error" || name === "loading");
  updateBottomBar();
}

function updateBottomBar() {
  const listEl = /** @type {HTMLElement | null} */ (
    document.querySelector('[data-screen="list"]')
  );
  const listVisible = Boolean(listEl && !listEl.hidden);
  const hasPool = getFilteredRestaurants({ includeExcluded: false }).length > 0;
  els.bottomBar.hidden = !(listVisible && hasPool);
  els.main.classList.toggle("has-bottom-bar", !els.bottomBar.hidden);
  els.gachaBtn.disabled = state.rolling || !hasPool;
}

function getSelectedRadius() {
  const checked = document.querySelector('input[name="radius"]:checked');
  return Number(/** @type {HTMLInputElement | null} */ (checked)?.value ?? 1000);
}

function setRadiusInput(radius) {
  const input = document.querySelector(`input[name="radius"][value="${radius}"]`);
  if (input) /** @type {HTMLInputElement} */ (input).checked = true;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatWalkMinutes(meters) {
  const mins = Math.max(1, Math.round(meters / WALK_SPEED_MPM));
  return `徒歩約${mins}分`;
}

function labelAmenity(amenity) {
  return AMENITY_LABELS[amenity] ?? "飲食店";
}

function iconAmenity(amenity) {
  return AMENITY_ICONS[amenity] ?? "restaurant";
}

function labelCuisine(cuisine) {
  if (!cuisine) return "";
  return cuisine
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => CUISINE_LABELS[c] ?? c.replaceAll("_", " "))
    .join(" / ");
}

function resolveName(tags) {
  return (
    tags["name:ja"]?.trim() ||
    tags.name?.trim() ||
    tags["brand:ja"]?.trim() ||
    tags.brand?.trim() ||
    tags["operator:ja"]?.trim() ||
    tags.operator?.trim() ||
    ""
  );
}

function normalizePhone(phone) {
  if (!phone) return "";
  return phone.split(";")[0].trim();
}

function normalizeWebsite(url) {
  if (!url) return "";
  const first = url.split(";")[0].trim();
  if (!first) return "";
  if (/^https?:\/\//i.test(first)) return first;
  return `https://${first}`;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("このブラウザは位置情報に対応していません。"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

function geolocationErrorMessage(err) {
  if (!err || typeof err.code !== "number") {
    return "現在地を取得できませんでした。";
  }
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "位置情報の利用が拒否されました。ブラウザの設定から許可してください。";
    case err.POSITION_UNAVAILABLE:
      return "現在地を特定できませんでした。電波の良い場所で再試行してください。";
    case err.TIMEOUT:
      return "現在地の取得がタイムアウトしました。もう一度お試しください。";
    default:
      return "現在地を取得できませんでした。";
  }
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} radius
 * @param {AbortSignal} [signal]
 * @returns {Promise<Restaurant[]>}
 */
async function fetchNearbyRestaurants(lat, lon, radius, signal) {
  const query = `
[out:json][timeout:25];
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|bar|pub|biergarten|ice_cream)$"](around:${radius},${lat},${lon});
  nwr["shop"="bakery"](around:${radius},${lat},${lon});
);
out center tags;
`.trim();

  let lastError = /** @type {Error | null} */ (null);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });
      const timer = setTimeout(() => controller.abort(), 28000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: new URLSearchParams({ data: query }),
          signal: controller.signal,
        });

        if (!response.ok) {
          lastError = new Error(`店舗検索に失敗しました（HTTP ${response.status}）`);
          continue;
        }

        const data = await response.json();
        return parseOverpassElements(data.elements ?? [], lat, lon);
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    } catch (err) {
      if (/** @type {Error} */ (err)?.name === "AbortError" && signal?.aborted) {
        throw err;
      }
      lastError = /** @type {Error} */ (err);
    }
  }

  throw lastError ?? new Error("店舗データの取得に失敗しました。");
}

/**
 * @param {Array<Record<string, unknown>>} elements
 * @param {number} userLat
 * @param {number} userLon
 * @returns {Restaurant[]}
 */
function parseOverpassElements(elements, userLat, userLon) {
  /** @type {Map<string, Restaurant>} */
  const byKey = new Map();

  for (const el of elements) {
    const tags = /** @type {Record<string, string>} */ (el.tags ?? {});
    const name = resolveName(tags);
    if (!name) continue;

    const lat =
      typeof el.lat === "number"
        ? el.lat
        : /** @type {{ lat?: number }} */ (el.center)?.lat;
    const lon =
      typeof el.lon === "number"
        ? el.lon
        : /** @type {{ lon?: number }} */ (el.center)?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") continue;

    const amenity =
      tags.amenity || (tags.shop === "bakery" ? "bakery" : "restaurant");
    const id = `${el.type}-${el.id}`;
    const distance = haversineMeters(userLat, userLon, lat, lon);
    const openingHours = tags.opening_hours ?? "";
    const openNow = isOpenNow(openingHours);

    const dedupeKey = `${name.toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
    const prev = byKey.get(dedupeKey);
    if (prev && prev.distance <= distance) continue;

    byKey.set(dedupeKey, {
      id,
      name,
      lat,
      lon,
      amenity,
      cuisine: tags.cuisine ?? (amenity === "bakery" ? "bakery" : ""),
      distance,
      phone: normalizePhone(tags.phone || tags["contact:phone"] || ""),
      website: normalizeWebsite(
        tags.website || tags["contact:website"] || tags.url || ""
      ),
      openingHours,
      openNow,
    });
  }

  return [...byKey.values()].sort((a, b) => a.distance - b.distance);
}

/**
 * 営業時間外を除外。時間が不明な店は残す（OSMは営業時間欠落が多いため）
 * @param {{ includeExcluded?: boolean }} [opts]
 * @returns {Restaurant[]}
 */
function getFilteredRestaurants({ includeExcluded = false } = {}) {
  return state.restaurants
    .filter((shop) => {
      if (!includeExcluded && state.excludedIds.has(shop.id)) return false;
      if (shop.openNow === false) return false;
      if (state.mealOnly && MEAL_EXCLUDE_AMENITIES.has(shop.amenity)) return false;
      if (state.category !== "all" && shop.amenity !== state.category) return false;
      return true;
    })
    .sort((a, b) => {
      const rank = (s) => (s.openNow === true ? 0 : 1);
      const byOpen = rank(a) - rank(b);
      if (byOpen !== 0) return byOpen;
      return a.distance - b.distance;
    });
}

function getAvailableCategories() {
  const counts = new Map();
  for (const shop of state.restaurants) {
    if (shop.openNow === false) continue;
    if (state.mealOnly && MEAL_EXCLUDE_AMENITIES.has(shop.amenity)) continue;
    counts.set(shop.amenity, (counts.get(shop.amenity) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || labelAmenity(a[0]).localeCompare(labelAmenity(b[0]), "ja"))
    .map(([amenity, count]) => ({ amenity, count }));
}

function renderCategoryChips() {
  const cats = getAvailableCategories();
  const total = cats.reduce((sum, c) => sum + c.count, 0);
  if (state.category !== "all" && !cats.some((c) => c.amenity === state.category)) {
    state.category = "all";
  }

  els.categoryChips.innerHTML = "";
  if (total === 0) {
    els.categoryChips.hidden = true;
    return;
  }
  els.categoryChips.hidden = false;

  const frag = document.createDocumentFragment();
  const makeChip = (value, label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.role = "radio";
    btn.dataset.category = value;
    btn.setAttribute("aria-checked", state.category === value ? "true" : "false");
    btn.classList.toggle("is-selected", state.category === value);
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (state.category === value) return;
      state.category = value;
      renderList();
    });
    frag.appendChild(btn);
  };

  makeChip("all", `すべて (${total})`);
  for (const { amenity, count } of cats) {
    makeChip(amenity, `${labelAmenity(amenity)} (${count})`);
  }
  els.categoryChips.appendChild(frag);
}

function renderList() {
  renderCategoryChips();
  const filtered = getFilteredRestaurants({ includeExcluded: true });
  const active = filtered.filter((s) => !state.excludedIds.has(s.id));
  const total = state.restaurants.length;
  const closedCount = state.restaurants.filter((s) => s.openNow === false).length;
  const mealFilteredCount = state.mealOnly
    ? state.restaurants.filter(
        (s) => s.openNow !== false && MEAL_EXCLUDE_AMENITIES.has(s.amenity)
      ).length
    : 0;
  const excludedManual = state.excludedIds.size;

  const cacheNote = state.fromCache ? " · キャッシュ" : "";
  const parts = [`${formatDistance(state.radius)}`, `${active.length}件`];
  if (closedCount > 0) parts.push(`時間外 ${closedCount}`);
  if (mealFilteredCount > 0) parts.push(`バー等 ${mealFilteredCount}`);
  if (excludedManual > 0) parts.push(`除外 ${excludedManual}`);
  els.listMeta.textContent = total > 0 ? `${parts.join(" · ")}${cacheNote}` : "";

  const canExpand = state.radius < 3000;

  els.emptyState.hidden = active.length > 0;
  els.restaurantList.hidden = active.length === 0;

  if (active.length === 0) {
    if (total > 0 && closedCount === total) {
      els.emptyBody.textContent =
        "取得したお店はすべて営業時間外のようです。半径を広げてみてください。";
    } else if (total > 0 && state.category !== "all") {
      els.emptyBody.textContent =
        "このカテゴリでは候補がありません。フィルタを変えてみてください。";
    } else if (total > 0 && state.mealOnly && mealFilteredCount > 0) {
      els.emptyBody.textContent =
        "食事向きのお店が見つかりませんでした。設定でバー・パブを含めるか、半径を広げてください。";
    } else {
      els.emptyBody.textContent =
        "この範囲ではお店が見つかりませんでした。半径を広げて再検索できます。";
    }
    els.expandRadiusBtn.hidden = !canExpand;
    els.expandRadiusBtn.textContent = "3km で再検索";
    els.resetFiltersBtn.hidden = !(
      state.category !== "all" ||
      state.excludedIds.size > 0 ||
      (state.mealOnly && mealFilteredCount > 0 && total > closedCount)
    );
  } else {
    els.resetFiltersBtn.hidden = true;
  }

  els.restaurantList.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const shop of filtered) {
    if (state.excludedIds.has(shop.id)) continue;

    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "restaurant-item";
    btn.dataset.id = shop.id;
    if (shop.id === state.lastPickedId) btn.classList.add("is-picked");

    const cuisine = labelCuisine(shop.cuisine);
    const status = openStatusLabel(shop.openNow, { includeUnknown: true });
    btn.innerHTML = `
      <span class="restaurant-item__icon" aria-hidden="true">
        <span class="material-symbols-outlined"></span>
      </span>
      <span class="restaurant-item__body">
        <p class="restaurant-item__name"></p>
        <p class="restaurant-item__sub"></p>
      </span>
      <span class="restaurant-item__aside">
        <span class="restaurant-item__dist"></span>
        <span class="badge" hidden></span>
      </span>
    `;
    btn.querySelector(".material-symbols-outlined").textContent = iconAmenity(
      shop.amenity
    );
    btn.querySelector(".restaurant-item__name").textContent = shop.name;
    btn.querySelector(".restaurant-item__sub").textContent = cuisine
      ? `${labelAmenity(shop.amenity)} · ${cuisine}`
      : `${labelAmenity(shop.amenity)} · ${formatWalkMinutes(shop.distance)}`;
    btn.querySelector(".restaurant-item__dist").textContent = formatDistance(
      shop.distance
    );
    const badge = /** @type {HTMLElement} */ (btn.querySelector(".badge"));
    if (status) {
      badge.hidden = false;
      badge.textContent = status;
      badge.classList.toggle("badge--closed", shop.openNow === false);
      badge.classList.toggle("badge--unknown", shop.openNow == null);
    }

    btn.addEventListener("click", () => openResult(shop, { animate: false }));
    li.appendChild(btn);
    frag.appendChild(li);
  }

  els.restaurantList.appendChild(frag);
  updateBottomBar();
}

function mapsUrl(shop) {
  const q = encodeURIComponent(`${shop.name}@${shop.lat},${shop.lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function walkUrl(shop) {
  if (!state.coords) return mapsUrl(shop);
  const origin = `${state.coords.latitude},${state.coords.longitude}`;
  const dest = `${shop.lat},${shop.lon}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=walking`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 近い店ほど当たりやすい重み付き抽選
 * @param {Restaurant[]} list
 */
function weightedPick(list) {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  const weights = list.map((shop) => {
    const meters = Math.max(50, shop.distance);
    return 1 / Math.sqrt(meters);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

function pickRandomRestaurant() {
  const list = getFilteredRestaurants({ includeExcluded: false });
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  const others = list.filter((r) => r.id !== state.lastPickedId);
  const pool = others.length > 0 ? others : list;
  return weightedPick(pool);
}

function getFocusable(container) {
  return [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ),
  ].filter(
    (el) =>
      el instanceof HTMLElement &&
      !el.hidden &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.offsetParent !== null
  );
}

function trapFocus(container) {
  releaseFocusTrap();
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.classList.add("is-locked");

  trapHandler = (e) => {
    if (e.key !== "Tab") return;
    const focusables = getFocusable(container);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", trapHandler);

  const focusables = getFocusable(container);
  (focusables[0] ?? container).focus?.();
}

function releaseFocusTrap() {
  if (trapHandler) {
    document.removeEventListener("keydown", trapHandler);
    trapHandler = null;
  }
  document.body.classList.remove("is-locked");
  lastFocus?.focus?.();
  lastFocus = null;
}

function openOverlay(sheet) {
  els.scrim.hidden = false;
  els.scrim.setAttribute("aria-hidden", "false");
  sheet.hidden = false;
  trapFocus(sheet);
}

function closeAllSheets() {
  els.resultSheet.hidden = true;
  els.historySheet.hidden = true;
  els.settingsSheet.hidden = true;
  els.scrim.hidden = true;
  els.scrim.setAttribute("aria-hidden", "true");
  els.resultCard.classList.remove("is-rolling", "is-reveal");
  els.slot.hidden = true;
  releaseFocusTrap();
}

function setRollingUi(rolling) {
  state.rolling = rolling;
  els.againBtn.disabled = rolling;
  els.excludeBtn.disabled = rolling;
  els.closeSheetBtn.disabled = rolling;
  els.shareBtn.disabled = rolling;
  els.gachaBtn.disabled = rolling;
  updateBottomBar();
}

async function runSlotAnimation(names, finalName) {
  const reel = els.slotReel;
  reel.innerHTML = "";
  reel.style.transition = "none";
  reel.style.transform = "translateY(0)";

  const sequence = [];
  const spins = Math.min(18, Math.max(10, names.length));
  for (let i = 0; i < spins; i++) {
    sequence.push(names[Math.floor(Math.random() * names.length)]);
  }
  sequence.push(finalName);

  for (const name of sequence) {
    const item = document.createElement("div");
    item.className = "slot__item";
    item.textContent = name;
    reel.appendChild(item);
  }

  els.slot.hidden = false;
  await sleep(30);

  const itemHeight = 56;
  const target = (sequence.length - 1) * itemHeight;
  const duration = prefersReducedMotion() ? 80 : 1400;
  reel.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.8, 0.2, 1)`;
  reel.style.transform = `translateY(-${target}px)`;
  await sleep(duration + 40);
}

/**
 * @param {Restaurant} shop
 * @param {{ animate?: boolean }} [opts]
 */
async function openResult(shop, { animate = true } = {}) {
  if (state.rolling) return;
  setRollingUi(true);
  state.currentResult = shop;
  state.lastPickedId = shop.id;

  document
    .querySelectorAll(".restaurant-item.is-picked")
    .forEach((el) => el.classList.remove("is-picked"));
  document
    .querySelector(`.restaurant-item[data-id="${CSS.escape(shop.id)}"]`)
    ?.classList.add("is-picked");

  els.historySheet.hidden = true;
  els.settingsSheet.hidden = true;
  openOverlay(els.resultSheet);

  const cuisine = labelCuisine(shop.cuisine);
  els.resultCuisine.hidden = !cuisine;
  els.resultCuisine.textContent = cuisine;

  const hours = formatOpeningHours(shop.openingHours);
  els.resultHours.hidden = !hours;
  els.resultHours.textContent = hours ? `営業時間: ${hours}` : "";

  const status = openStatusLabel(shop.openNow, { includeUnknown: true });
  els.resultStatus.hidden = !status;
  els.resultStatus.textContent = status;
  els.resultStatus.classList.toggle("is-open", shop.openNow === true);
  els.resultStatus.classList.toggle("is-closed", shop.openNow === false);
  els.resultStatus.classList.toggle("is-unknown", shop.openNow == null);

  els.walkLink.href = walkUrl(shop);
  els.walkLabel.textContent = `徒歩ルート（${formatWalkMinutes(shop.distance)}）`;
  els.mapLink.href = mapsUrl(shop);

  if (shop.phone) {
    els.phoneLink.hidden = false;
    els.phoneLink.href = `tel:${shop.phone.replace(/[^\d+]/g, "")}`;
    els.phoneLabel.textContent = `電話する（${shop.phone}）`;
  } else {
    els.phoneLink.hidden = true;
  }

  if (shop.website) {
    els.webLink.hidden = false;
    els.webLink.href = shop.website;
  } else {
    els.webLink.hidden = true;
  }

  els.resultLive.textContent = "";

  if (animate) {
    vibrate([10, 40, 10]);
    els.resultCard.classList.add("is-rolling");
    els.resultName.textContent = "抽選中…";
    els.resultMeta.textContent = "";
    const pool = getFilteredRestaurants({ includeExcluded: false });
    const names = pool.map((r) => r.name);
    await runSlotAnimation(names.length ? names : [shop.name], shop.name);
    els.resultCard.classList.remove("is-rolling");
    vibrate([20, 30, 40]);
  } else {
    els.slot.hidden = true;
  }

  els.resultName.textContent = shop.name;
  els.resultMeta.textContent = `${labelAmenity(shop.amenity)} · ${formatDistance(shop.distance)} · ${formatWalkMinutes(shop.distance)}`;
  els.resultCard.classList.add("is-reveal");
  els.resultLive.textContent = `選ばれたお店は ${shop.name} です。`;

  pushHistory({
    id: shop.id,
    name: shop.name,
    lat: shop.lat,
    lon: shop.lon,
    amenity: shop.amenity,
    cuisine: shop.cuisine,
    distance: shop.distance,
  });

  setRollingUi(false);
}

function closeResult() {
  if (state.rolling) return;
  closeAllSheets();
  state.currentResult = null;
}

async function shareResult() {
  const shop = state.currentResult;
  if (!shop || state.rolling) return;

  const text = [
    `めしガチャの結果: ${shop.name}`,
    `${labelAmenity(shop.amenity)} · ${formatDistance(shop.distance)}（${formatWalkMinutes(shop.distance)}）`,
    mapsUrl(shop),
  ].join("\n");

  try {
    if (navigator.share) {
      await navigator.share({
        title: "めしガチャ",
        text: `めしガチャの結果: ${shop.name}`,
        url: mapsUrl(shop),
      });
      return;
    }
  } catch (err) {
    if (/** @type {Error} */ (err)?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("結果をコピーしました");
  } catch {
    showToast("シェアに失敗しました");
  }
}

function openHistory() {
  const items = getHistory();
  els.historyList.innerHTML = "";
  els.historyEmpty.hidden = items.length > 0;
  els.clearHistoryBtn.hidden = items.length === 0;

  for (const item of items) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-item";
    const when = new Date(item.at);
    btn.innerHTML = `
      <p class="history-item__name"></p>
      <p class="history-item__meta"></p>
    `;
    btn.querySelector(".history-item__name").textContent = item.name;
    btn.querySelector(".history-item__meta").textContent = `${labelAmenity(item.amenity)} · ${when.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    btn.addEventListener("click", () => {
      closeAllSheets();
      const live = state.restaurants.find((r) => r.id === item.id);
      if (live) {
        openResult(live, { animate: false });
      } else {
        openResult(
          {
            ...item,
            phone: "",
            website: "",
            openingHours: "",
            openNow: null,
          },
          { animate: false }
        );
      }
    });
    li.appendChild(btn);
    els.historyList.appendChild(li);
  }

  els.resultSheet.hidden = true;
  els.settingsSheet.hidden = true;
  openOverlay(els.historySheet);
}

function openSettings() {
  const prefs = getPrefs();
  els.autoStartToggle.checked = prefs.autoStart !== false;
  els.mealOnlyToggle.checked = state.mealOnly;
  els.resultSheet.hidden = true;
  els.historySheet.hidden = true;
  openOverlay(els.settingsSheet);
}

function showError(title, body, { offline = false } = {}) {
  els.errorTitle.textContent = title;
  els.errorBody.textContent = body;
  els.errorIcon.textContent = offline ? "wifi_off" : "error";
  showScreen("error");
}

function goHome() {
  state.searchAbort?.abort();
  state.searchAbort = null;
  closeAllSheets();
  showScreen("home");
}

/**
 * @param {{ forceRefresh?: boolean, radiusOverride?: number }} [opts]
 */
async function runSearch({ forceRefresh = false, radiusOverride } = {}) {
  closeAllSheets();
  if (radiusOverride != null) {
    state.radius = radiusOverride;
    setRadiusInput(radiusOverride);
  } else {
    state.radius = getSelectedRadius();
  }

  savePrefs({ radius: state.radius });
  state.restaurants = [];
  state.excludedIds = new Set();
  state.lastPickedId = null;
  state.fromCache = false;
  state.category = "all";

  if (!navigator.onLine) {
    showError(
      "オフラインです",
      "店舗検索にはインターネット接続が必要です。接続後にもう一度試してください。",
      { offline: true }
    );
    return;
  }

  state.searchAbort?.abort();
  const controller = new AbortController();
  state.searchAbort = controller;
  const token = ++state.searchToken;

  showScreen("loading");
  els.loadingText.textContent = "現在地を取得しています…";
  els.loadingSub.hidden = true;

  try {
    const position = await getCurrentPosition();
    if (token !== state.searchToken) return;
    state.coords = position.coords;
    const { latitude, longitude } = state.coords;

    if (!forceRefresh) {
      const cached = readSearchCache(latitude, longitude, state.radius);
      if (cached?.length) {
        state.restaurants = cached.map((r) => ({
          ...r,
          openNow: isOpenNow(r.openingHours),
        }));
        state.fromCache = true;
        els.loadingText.textContent = "キャッシュから読み込みました";
        renderList();
        showScreen("list");
        return;
      }
    }

    els.loadingText.textContent = "近くのお店を探しています…";
    els.loadingSub.hidden = false;
    els.loadingSub.textContent = "OpenStreetMap から取得中";

    const restaurants = await fetchNearbyRestaurants(
      latitude,
      longitude,
      state.radius,
      controller.signal
    );
    if (token !== state.searchToken) return;
    state.restaurants = restaurants;
    writeSearchCache(latitude, longitude, state.radius, restaurants);
    renderList();
    showScreen("list");
  } catch (err) {
    if (token !== state.searchToken) return;
    if (/** @type {Error} */ (err)?.name === "AbortError" && controller.signal.aborted) {
      return;
    }
    console.error(err);
    if (err && typeof err.code === "number") {
      showError("位置情報が必要です", geolocationErrorMessage(err));
    } else if (err?.name === "AbortError") {
      showError(
        "タイムアウト",
        "お店の検索に時間がかかりすぎました。少し待ってから再試行してください。"
      );
    } else if (!navigator.onLine) {
      showError(
        "オフラインです",
        "接続が切れました。オンラインになってから再試行してください。",
        { offline: true }
      );
    } else {
      showError(
        "検索に失敗しました",
        `${err?.message ?? "しばらくしてからもう一度お試しください。"}\n別のサーバーでも試しましたが取得できませんでした。`
      );
    }
  } finally {
    if (state.searchAbort === controller) state.searchAbort = null;
  }
}

async function onGacha() {
  if (state.rolling) return;
  const shop = pickRandomRestaurant();
  if (!shop) return;
  await openResult(shop, { animate: true });
}

async function onExcludeAndAgain() {
  if (!state.currentResult || state.rolling) return;
  state.excludedIds.add(state.currentResult.id);
  renderList();
  const next = pickRandomRestaurant();
  if (!next) {
    closeResult();
    showToast("候補がなくなりました");
    return;
  }
  await openResult(next, { animate: true });
}

function resetFilters() {
  state.category = "all";
  state.excludedIds = new Set();
  if (state.mealOnly) {
    state.mealOnly = false;
    savePrefs({ mealOnly: false });
    els.mealOnlyToggle.checked = false;
  }
  renderList();
}

function updateOnlineBanner() {
  els.offlineBanner.hidden = navigator.onLine;
}

async function maybeAutoStart() {
  const prefs = getPrefs();
  if (!prefs.autoStart) return;
  if (!navigator.permissions?.query) return;

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted") {
      els.homeHint.textContent =
        "位置情報は許可済みです。自動で検索を開始します…";
      await runSearch();
    }
  } catch {
    /* permissions API unsupported */
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* ignore */
    });
  });
}

function initPrefsUi() {
  const prefs = getPrefs();
  state.radius = prefs.radius ?? 1000;
  if (![500, 1000, 2000, 3000].includes(state.radius)) state.radius = 1000;
  state.mealOnly = prefs.mealOnly !== false;
  setRadiusInput(state.radius);
  els.autoStartToggle.checked = prefs.autoStart !== false;
  els.mealOnlyToggle.checked = state.mealOnly;
}

function init() {
  initPrefsUi();
  updateOnlineBanner();
  registerServiceWorker();

  els.startBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.refreshBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.backBtn.addEventListener("click", goHome);
  els.emptyRetryBtn.addEventListener("click", goHome);
  els.errorHomeBtn.addEventListener("click", goHome);
  els.errorRetryBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.expandRadiusBtn.addEventListener("click", () =>
    runSearch({ forceRefresh: true, radiusOverride: 3000 })
  );
  els.resetFiltersBtn.addEventListener("click", resetFilters);

  els.gachaBtn.addEventListener("click", onGacha);
  els.againBtn.addEventListener("click", onGacha);
  els.excludeBtn.addEventListener("click", onExcludeAndAgain);
  els.shareBtn.addEventListener("click", shareResult);
  els.closeSheetBtn.addEventListener("click", closeResult);
  els.scrim.addEventListener("click", () => {
    if (state.rolling) return;
    closeAllSheets();
  });

  els.historyBtn.addEventListener("click", openHistory);
  els.closeHistoryBtn.addEventListener("click", closeAllSheets);
  els.clearHistoryBtn.addEventListener("click", () => {
    if (!window.confirm("ガチャ履歴をすべて削除しますか？")) return;
    clearHistory();
    openHistory();
    showToast("履歴を削除しました");
  });

  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeAllSheets);
  els.autoStartToggle.addEventListener("change", () => {
    savePrefs({ autoStart: els.autoStartToggle.checked });
  });
  els.mealOnlyToggle.addEventListener("change", () => {
    state.mealOnly = els.mealOnlyToggle.checked;
    savePrefs({ mealOnly: state.mealOnly });
    const listEl = /** @type {HTMLElement | null} */ (
      document.querySelector('[data-screen="list"]')
    );
    if (listEl && !listEl.hidden) renderList();
  });

  document.querySelectorAll('input[name="radius"]').forEach((input) => {
    input.addEventListener("change", () => {
      const next = getSelectedRadius();
      if (next === state.radius) return;
      savePrefs({ radius: next });
      const onList =
        !/** @type {HTMLElement} */ (document.querySelector('[data-screen="list"]'))
          .hidden;
      if (onList) {
        runSearch({ forceRefresh: true, radiusOverride: next });
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.rolling) return;
    if (e.key === "Escape" && !els.resultSheet.hidden) {
      closeResult();
    } else if (
      e.key === "Escape" &&
      (!els.historySheet.hidden || !els.settingsSheet.hidden)
    ) {
      closeAllSheets();
    }
  });

  window.addEventListener("online", updateOnlineBanner);
  window.addEventListener("offline", updateOnlineBanner);

  showScreen("home");
  maybeAutoStart();
}

init();
