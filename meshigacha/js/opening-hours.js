/**
 * 営業時間の簡易判定（OSM / 日本語表記）
 * 未対応・不明は null
 */

const DAY_INDEX_EN = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_INDEX_JA = {
  日: 0,
  月: 1,
  火: 2,
  水: 3,
  木: 4,
  金: 5,
  土: 6,
};

/**
 * @param {string | undefined | null} rule
 * @param {Date} [now]
 * @returns {boolean | null}
 */
export function isOpenNow(rule, now = new Date()) {
  if (!rule || typeof rule !== "string") return null;
  const trimmed = rule.trim();
  if (!trimmed) return null;
  if (trimmed === "24/7" || /年中無休|24時間/.test(trimmed)) return true;
  if (/^closed$/i.test(trimmed) || trimmed === "off" || /定休日のみ|本日休業/.test(trimmed)) {
    return false;
  }

  const ja = tryParseJapanese(trimmed, now);
  if (ja !== null) return ja;

  return tryParseOsm(trimmed, now);
}

/**
 * @param {string} rule
 * @param {Date} now
 * @returns {boolean | null}
 */
function tryParseJapanese(rule, now) {
  // 例: 月～金 11:00～22:00 / 月〜日11:00-23:00 / 毎日 10:00～21:00
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (/^[^\d]*定休/.test(rule) && !/\d/.test(rule)) return null;

  const chunks = rule.split(/[、／/]/).map((c) => c.trim()).filter(Boolean);
  let matched = false;
  let open = false;

  for (const chunk of chunks) {
    if (/定休/.test(chunk) && !/\d{1,2}\s*[:：]/.test(chunk)) {
      const days = extractJaDays(chunk);
      if (days && days.includes(day)) {
        matched = true;
        open = false;
      }
      continue;
    }

    const timeMatch = chunk.match(
      /(\d{1,2})\s*[:：]\s*(\d{2})\s*[～〜\-–—]\s*(\d{1,2})\s*[:：]\s*(\d{2})/
    );
    if (!timeMatch) continue;

    let days = extractJaDays(chunk);
    if (!days) {
      if (/毎日|全日|年中/.test(chunk) || !/[月火水木金土日]/.test(chunk)) {
        days = [0, 1, 2, 3, 4, 5, 6];
      } else {
        continue;
      }
    }

    if (!days.includes(day)) continue;
    matched = true;

    let start = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    let end = Number(timeMatch[3]) * 60 + Number(timeMatch[4]);
    if (end <= start) {
      if (minutes >= start || minutes < end) open = true;
    } else if (minutes >= start && minutes < end) {
      open = true;
    }
  }

  return matched ? open : null;
}

/**
 * @param {string} text
 * @returns {number[] | null}
 */
function extractJaDays(text) {
  if (/毎日|全日|年中/.test(text)) return [0, 1, 2, 3, 4, 5, 6];

  const range = text.match(/([月火水木金土日])\s*[～〜\-–—]\s*([月火水木金土日])/);
  if (range) {
    const start = DAY_INDEX_JA[range[1]];
    const end = DAY_INDEX_JA[range[2]];
    if (start == null || end == null) return null;
    const days = [];
    if (start <= end) {
      for (let d = start; d <= end; d++) days.push(d);
    } else {
      for (let d = start; d <= 6; d++) days.push(d);
      for (let d = 0; d <= end; d++) days.push(d);
    }
    return days;
  }

  const singles = [...text.matchAll(/[月火水木金土日]/g)].map((m) => DAY_INDEX_JA[m[0]]);
  return singles.length ? singles : null;
}

/**
 * @param {string} trimmed
 * @param {Date} now
 * @returns {boolean | null}
 */
function tryParseOsm(trimmed, now) {
  try {
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const parts = trimmed.split(";").map((p) => p.trim()).filter(Boolean);
    let matched = false;
    let open = false;

    for (const part of parts) {
      if (/^PH/i.test(part)) continue;

      const offMatch = part.match(
        /^([A-Za-z]{2}(?:-[A-Za-z]{2})?(?:,[A-Za-z]{2}(?:-[A-Za-z]{2})?)*)\s+off$/i
      );
      if (offMatch) {
        if (daysIncludeEn(offMatch[1], day)) {
          matched = true;
          open = false;
        }
        continue;
      }

      const m = part.match(
        /^([A-Za-z]{2}(?:-[A-Za-z]{2})?(?:,[A-Za-z]{2}(?:-[A-Za-z]{2})?)*)\s+(.+)$/
      );
      if (!m) {
        const timesOnly = parseTimeRanges(part);
        if (timesOnly) {
          matched = true;
          if (inAnyRange(minutes, timesOnly)) open = true;
        }
        continue;
      }

      const [, days, times] = m;
      if (!daysIncludeEn(days, day)) continue;
      matched = true;
      const ranges = parseTimeRanges(times);
      if (ranges && inAnyRange(minutes, ranges)) open = true;
    }

    return matched ? open : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} days
 * @param {number} day
 */
function daysIncludeEn(days, day) {
  return days.split(",").some((token) => {
    const t = token.trim();
    if (t.includes("-")) {
      const [a, b] = t.split("-");
      const start = DAY_INDEX_EN[a];
      const end = DAY_INDEX_EN[b];
      if (start == null || end == null) return false;
      if (start <= end) return day >= start && day <= end;
      return day >= start || day <= end;
    }
    return DAY_INDEX_EN[t] === day;
  });
}

/**
 * @param {string} times
 * @returns {Array<[number, number]> | null}
 */
function parseTimeRanges(times) {
  if (!times || /off/i.test(times)) return null;
  const ranges = [];
  for (const chunk of times.split(",")) {
    const m = chunk
      .trim()
      .match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!m) continue;
    let start = Number(m[1]) * 60 + Number(m[2]);
    let end = Number(m[3]) * 60 + Number(m[4]);
    if (end === 0 && Number(m[3]) === 24) end = 24 * 60;
    if (end <= start) {
      ranges.push([start, 24 * 60], [0, end]);
    } else {
      ranges.push([start, end]);
    }
  }
  return ranges.length ? ranges : null;
}

/**
 * @param {number} minutes
 * @param {Array<[number, number]>} ranges
 */
function inAnyRange(minutes, ranges) {
  return ranges.some(([a, b]) => minutes >= a && minutes < b);
}

/**
 * @param {boolean | null} open
 * @param {{ includeUnknown?: boolean }} [opts]
 */
export function openStatusLabel(open, { includeUnknown = false } = {}) {
  if (open === true) return "営業中";
  if (open === false) return "営業時間外";
  return includeUnknown ? "営業時間不明" : "";
}

/**
 * 表示用に営業時間文字列を短く整える
 * @param {string | undefined | null} rule
 */
export function formatOpeningHours(rule) {
  if (!rule || typeof rule !== "string") return "";
  const trimmed = rule.trim();
  if (!trimmed) return "";
  if (trimmed === "24/7") return "24時間営業";
  return trimmed.replaceAll(";", " / ");
}
