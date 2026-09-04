/**
 * めしガチャ — 現在地周辺の外食店をランダム選択
 */
import { isOpenNow, openStatusLabel } from "./opening-hours.js";
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
};

/** @type {HTMLElement | null} */
let lastFocus = null;
/** @type {((e: KeyboardEvent) => void) | null} */
let trapHandler = null;

const els = {
  main: /** @type {HTMLElement} */ (document.getElementById("main")),
  offlineBanner: /** @type {HTMLElement} */ (document.getElementById("offlineBanner")),
  historyBtn: /** @type {HTMLButtonElement} */ (document.getElementById("historyBtn")),
  refreshBtn: /** @type {HTMLButtonElement} */ (document.getElementById("refreshBtn")),
  startBtn: /** @type {HTMLButtonElement} */ (document.getElementById("startBtn")),
  homeHint: /** @type {HTMLElement} */ (document.getElementById("homeHint")),
  loadingText: /** @type {HTMLElement} */ (document.getElementById("loadingText")),
  loadingSub: /** @type {HTMLElement} */ (document.getElementById("loadingSub")),
  listMeta: /** @type {HTMLElement} */ (document.getElementById("listMeta")),
  restaurantList: /** @type {HTMLElement} */ (document.getElementById("restaurantList")),
  emptyState: /** @type {HTMLElement} */ (document.getElementById("emptyState")),
  emptyBody: /** @type {HTMLElement} */ (document.getElementById("emptyBody")),
  expandRadiusBtn: /** @type {HTMLButtonElement} */ (document.getElementById("expandRadiusBtn")),
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
  resultStatus: /** @type {HTMLElement} */ (document.getElementById("resultStatus")),
  resultLive: /** @type {HTMLElement} */ (document.getElementById("resultLive")),
  slot: /** @type {HTMLElement} */ (document.getElementById("slot")),
  slotReel: /** @type {HTMLElement} */ (document.getElementById("slotReel")),
  walkLink: /** @type {HTMLAnchorElement} */ (document.getElementById("walkLink")),
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

function showScreen(name) {
  document.querySelectorAll("[data-screen]").forEach((el) => {
    el.hidden = /** @type {HTMLElement} */ (el).dataset.screen !== name;
  });

  const showListChrome = name === "list";
  els.refreshBtn.hidden = !showListChrome;
  updateBottomBar();
}

function updateBottomBar() {
  const listVisible =
    document.querySelector('[data-screen="list"]') &&
    !/** @type {HTMLElement} */ (document.querySelector('[data-screen="list"]')).hidden;
  const hasPool = getFilteredRestaurants({ includeExcluded: false }).length > 0;
  els.bottomBar.hidden = !(listVisible && hasPool);
  els.main.classList.toggle("has-bottom-bar", !els.bottomBar.hidden);
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

function labelAmenity(amenity) {
  return AMENITY_LABELS[amenity] ?? "飲食店";
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
 * @returns {Promise<Restaurant[]>}
 */
async function fetchNearbyRestaurants(lat, lon, radius) {
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
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 28000);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        lastError = new Error(`店舗検索に失敗しました（HTTP ${response.status}）`);
        continue;
      }

      const data = await response.json();
      return parseOverpassElements(data.elements ?? [], lat, lon);
    } catch (err) {
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
      return true;
    })
    .sort((a, b) => {
      const rank = (s) => (s.openNow === true ? 0 : 1);
      const byOpen = rank(a) - rank(b);
      if (byOpen !== 0) return byOpen;
      return a.distance - b.distance;
    });
}

function renderList() {
  const filtered = getFilteredRestaurants({ includeExcluded: true });
  const active = filtered.filter((s) => !state.excludedIds.has(s.id));
  const total = state.restaurants.length;
  const closedCount = state.restaurants.filter((s) => s.openNow === false).length;

  const cacheNote = state.fromCache ? " · キャッシュ" : "";
  els.listMeta.textContent =
    total > 0
      ? `${formatDistance(state.radius)} · ${active.length}件（営業時間外 ${closedCount}件を除外）${cacheNote}`
      : "";

  const canExpand = state.radius < 2000;

  els.emptyState.hidden = active.length > 0;
  els.restaurantList.hidden = active.length === 0;

  if (active.length === 0) {
    if (total > 0 && closedCount === total) {
      els.emptyBody.textContent =
        "取得したお店はすべて営業時間外のようです。半径を広げてみてください。";
    } else {
      els.emptyBody.textContent =
        "この範囲ではお店が見つかりませんでした。半径を広げて再検索できます。";
    }
    els.expandRadiusBtn.hidden = !canExpand;
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
    const status = openStatusLabel(shop.openNow);
    btn.innerHTML = `
      <span class="restaurant-item__icon" aria-hidden="true">
        <span class="material-symbols-outlined">restaurant</span>
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
    btn.querySelector(".restaurant-item__name").textContent = shop.name;
    btn.querySelector(".restaurant-item__sub").textContent = cuisine
      ? `${labelAmenity(shop.amenity)} · ${cuisine}`
      : labelAmenity(shop.amenity);
    btn.querySelector(".restaurant-item__dist").textContent = formatDistance(
      shop.distance
    );
    const badge = /** @type {HTMLElement} */ (btn.querySelector(".badge"));
    if (status) {
      badge.hidden = false;
      badge.textContent = status;
      badge.classList.toggle("badge--closed", shop.openNow === false);
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

function pickRandomRestaurant() {
  const list = getFilteredRestaurants({ includeExcluded: false });
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  const others = list.filter((r) => r.id !== state.lastPickedId);
  const pool = others.length > 0 ? others : list;
  return pool[Math.floor(Math.random() * pool.length)];
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
  els.scrim.hidden = true;
  els.scrim.setAttribute("aria-hidden", "true");
  els.resultCard.classList.remove("is-rolling", "is-reveal");
  els.slot.hidden = true;
  releaseFocusTrap();
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
  state.rolling = true;
  state.currentResult = shop;
  state.lastPickedId = shop.id;

  document
    .querySelectorAll(".restaurant-item.is-picked")
    .forEach((el) => el.classList.remove("is-picked"));
  document
    .querySelector(`.restaurant-item[data-id="${CSS.escape(shop.id)}"]`)
    ?.classList.add("is-picked");

  els.historySheet.hidden = true;
  openOverlay(els.resultSheet);

  const cuisine = labelCuisine(shop.cuisine);
  els.resultCuisine.hidden = !cuisine;
  els.resultCuisine.textContent = cuisine;

  const status = openStatusLabel(shop.openNow);
  els.resultStatus.hidden = !status;
  els.resultStatus.textContent = status;
  els.resultStatus.classList.toggle("is-open", shop.openNow === true);
  els.resultStatus.classList.toggle("is-closed", shop.openNow === false);

  els.walkLink.href = walkUrl(shop);
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
  els.resultMeta.textContent = `${labelAmenity(shop.amenity)} · ${formatDistance(shop.distance)}`;
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

  state.rolling = false;
}

function closeResult() {
  if (state.rolling) return;
  closeAllSheets();
  state.currentResult = null;
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
  openOverlay(els.historySheet);
}

function showError(title, body, { offline = false } = {}) {
  els.errorTitle.textContent = title;
  els.errorBody.textContent = body;
  els.errorIcon.textContent = offline ? "wifi_off" : "error";
  showScreen("error");
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

  if (!navigator.onLine) {
    showError(
      "オフラインです",
      "店舗検索にはインターネット接続が必要です。接続後にもう一度試してください。",
      { offline: true }
    );
    return;
  }

  showScreen("loading");
  els.loadingText.textContent = "現在地を取得しています…";
  els.loadingSub.hidden = true;

  try {
    const position = await getCurrentPosition();
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
      state.radius
    );
    state.restaurants = restaurants;
    writeSearchCache(latitude, longitude, state.radius, restaurants);
    renderList();
    showScreen("list");
  } catch (err) {
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
  }
}

async function onGacha() {
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
    return;
  }
  await openResult(next, { animate: true });
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
  setRadiusInput(state.radius);
}

function init() {
  initPrefsUi();
  updateOnlineBanner();
  registerServiceWorker();

  els.startBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.refreshBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.emptyRetryBtn.addEventListener("click", () => showScreen("home"));
  els.errorHomeBtn.addEventListener("click", () => showScreen("home"));
  els.errorRetryBtn.addEventListener("click", () => runSearch({ forceRefresh: true }));
  els.expandRadiusBtn.addEventListener("click", () =>
    runSearch({ forceRefresh: true, radiusOverride: 2000 })
  );

  els.gachaBtn.addEventListener("click", onGacha);
  els.againBtn.addEventListener("click", onGacha);
  els.excludeBtn.addEventListener("click", onExcludeAndAgain);
  els.closeSheetBtn.addEventListener("click", closeResult);
  els.scrim.addEventListener("click", () => {
    if (state.rolling) return;
    closeAllSheets();
  });

  els.historyBtn.addEventListener("click", openHistory);
  els.closeHistoryBtn.addEventListener("click", closeAllSheets);
  els.clearHistoryBtn.addEventListener("click", () => {
    clearHistory();
    openHistory();
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
    if (e.key === "Escape" && !els.resultSheet.hidden && !state.rolling) {
      closeResult();
    } else if (e.key === "Escape" && !els.historySheet.hidden) {
      closeAllSheets();
    }
  });

  window.addEventListener("online", updateOnlineBanner);
  window.addEventListener("offline", updateOnlineBanner);

  showScreen("home");
  maybeAutoStart();
}

init();
