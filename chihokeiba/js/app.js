import {
  VENUES,
  getVenue,
  getRacesByVenue,
  getRace,
} from "./data.js";
import { predictRace } from "./predictor.js";

const state = {
  venueId: null,
  raceId: null,
  prediction: null,
  predicting: false,
};

const els = {
  topTitle: document.getElementById("topTitle"),
  backBtn: document.getElementById("backBtn"),
  viewHome: document.getElementById("viewHome"),
  viewVenue: document.getElementById("viewVenue"),
  viewRace: document.getElementById("viewRace"),
  viewResult: document.getElementById("viewResult"),
  venueGrid: document.getElementById("venueGrid"),
  raceList: document.getElementById("raceList"),
  venueHeading: document.getElementById("venueHeading"),
  raceHeading: document.getElementById("raceHeading"),
  raceMeta: document.getElementById("raceMeta"),
  entries: document.getElementById("entries"),
  predictBtn: document.getElementById("predictBtn"),
  resultSummary: document.getElementById("resultSummary"),
  rankList: document.getElementById("rankList"),
  ticketList: document.getElementById("ticketList"),
  shareBtn: document.getElementById("shareBtn"),
  againBtn: document.getElementById("againBtn"),
};

init();

function init() {
  renderVenues();
  els.backBtn.addEventListener("click", onBack);
  els.predictBtn.addEventListener("click", onPredict);
  els.shareBtn.addEventListener("click", onShare);
  els.againBtn.addEventListener("click", () => {
    state.prediction = null;
    showView("race");
  });
  showView("home");
}

function renderVenues() {
  els.venueGrid.innerHTML = "";
  for (const venue of VENUES) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "venue-btn";
    btn.dataset.venueId = venue.id;
    btn.innerHTML = `
      <span class="venue-btn__name">${escapeHtml(venue.name)}</span>
      <span class="venue-btn__meta">${escapeHtml(venue.region)} · ${escapeHtml(venue.surface)}</span>
    `;
    btn.addEventListener("click", () => selectVenue(venue.id));
    li.appendChild(btn);
    els.venueGrid.appendChild(li);
  }
}

function selectVenue(venueId) {
  state.venueId = venueId;
  state.raceId = null;
  state.prediction = null;
  const venue = getVenue(venueId);
  els.venueHeading.textContent = `${venue.name}のレース`;
  renderRaces(venueId);
  showView("venue");
}

function renderRaces(venueId) {
  const races = getRacesByVenue(venueId);
  els.raceList.innerHTML = "";
  if (!races.length) {
    els.raceList.innerHTML = `<li><p class="empty">この競馬場のデモレースはまだありません。</p></li>`;
    return;
  }
  for (const race of races) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "race-card";
    btn.innerHTML = `
      <div class="race-card__row">
        <h3 class="race-card__name"><span class="race-card__no">${race.raceNo}R</span>${escapeHtml(race.name)}</h3>
        <span class="race-card__time">${escapeHtml(formatRaceDate(race.date))}<br>${escapeHtml(race.postTime)}</span>
      </div>
      <p class="race-card__meta">${escapeHtml(race.distance)} · ${escapeHtml(race.className)} · 馬場${escapeHtml(race.condition)} · ${race.horses.length}頭</p>
    `;
    btn.addEventListener("click", () => selectRace(race.id));
    li.appendChild(btn);
    els.raceList.appendChild(li);
  }
}

function selectRace(raceId) {
  state.raceId = raceId;
  state.prediction = null;
  const race = getRace(raceId);
  const venue = getVenue(race.venueId);
  els.raceHeading.textContent = `${race.raceNo}R ${race.name}`;
  els.raceMeta.textContent = `${formatRaceDate(race.date)} · ${venue.name} · ${race.distance} · ${race.className} · 馬場${race.condition} · 発走 ${race.postTime}`;
  renderEntries(race);
  showView("race");
}

function renderEntries(race) {
  const sorted = [...race.horses].sort((a, b) => a.odds - b.odds);
  els.entries.innerHTML = "";
  for (const horse of sorted) {
    const li = document.createElement("li");
    li.className = "entry";
    const form = formatForm(horse.recent);
    li.innerHTML = `
      <span class="entry__num">${horse.number}</span>
      <div>
        <p class="entry__name">${escapeHtml(horse.name)}</p>
        <p class="entry__sub">${escapeHtml(horse.jockey)} · ${horse.age}歳${escapeHtml(horse.sex)} · 体重${horse.weight}${formatWeightChange(horse.weightChange)} · 近走 ${form}</p>
      </div>
      <div class="entry__odds">
        <strong>${horse.odds.toFixed(1)}</strong>
        <span>単勝オッズ</span>
      </div>
    `;
    els.entries.appendChild(li);
  }
}

async function onPredict() {
  const race = getRace(state.raceId);
  if (!race || state.predicting) return;

  state.predicting = true;
  document.body.classList.add("predicting");
  els.predictBtn.disabled = true;
  const icon = els.predictBtn.querySelector(".material-symbols-outlined");
  const prevIcon = icon.textContent;
  icon.textContent = "progress_activity";

  await wait(650);

  const venue = getVenue(race.venueId);
  const prediction = predictRace(race, { isBanei: venue?.id === "obihiro" });
  state.prediction = prediction;
  renderResult(race, venue, prediction);

  state.predicting = false;
  document.body.classList.remove("predicting");
  els.predictBtn.disabled = false;
  icon.textContent = prevIcon;
  showView("result");
}

function renderResult(race, venue, prediction) {
  const { ranked, tickets, summary } = prediction;

  els.resultSummary.innerHTML = `
    <p class="result-hero__tone">${escapeHtml(summary.tone)} · ${escapeHtml(formatRaceDate(race.date))} · ${escapeHtml(venue.name)} ${race.raceNo}R</p>
    <h2 class="result-hero__title">${escapeHtml(summary.headline)}</h2>
    <p class="result-hero__detail">${escapeHtml(summary.detail)}</p>
  `;

  els.rankList.innerHTML = "";
  ranked.forEach((row, index) => {
    const li = document.createElement("li");
    li.className = "rank-item";
    const top3Pct = (row.top3Prob * 100).toFixed(1);
    const meterWidth = Math.max(8, Math.round(row.top3Prob * 100));
    li.innerHTML = `
      <div class="rank-item__head">
        <span class="rank-item__place">${index + 1}</span>
        <span class="rank-item__num">${row.horse.number}</span>
        <div>
          <p class="rank-item__name">${escapeHtml(row.horse.name)}</p>
          <p class="rank-item__meta">${escapeHtml(row.horse.jockey)} · オッズ ${row.horse.odds.toFixed(1)} · 信頼度${row.confidence} · スコア ${row.score.toFixed(1)}</p>
        </div>
        <div class="rank-item__score">
          <strong>${top3Pct}%</strong>
          <span>3着内確率</span>
        </div>
      </div>
      <div class="meter" aria-hidden="true"><span style="width:${meterWidth}%"></span></div>
      <div class="breakdown">
        <div class="breakdown__cell"><strong>${row.breakdown.form}</strong><span>近走</span></div>
        <div class="breakdown__cell"><strong>${row.breakdown.odds}</strong><span>人気</span></div>
        <div class="breakdown__cell"><strong>${row.breakdown.jockey}</strong><span>騎手</span></div>
        <div class="breakdown__cell"><strong>${row.breakdown.weight}</strong><span>体重</span></div>
        <div class="breakdown__cell"><strong>${row.breakdown.draw}</strong><span>枠順</span></div>
        <div class="breakdown__cell"><strong>${row.breakdown.consistency}</strong><span>安定</span></div>
      </div>
    `;
    els.rankList.appendChild(li);
  });

  els.ticketList.innerHTML = "";
  for (const ticket of tickets) {
    const li = document.createElement("li");
    li.className = "ticket";
    li.innerHTML = `
      <span class="ticket__type">${escapeHtml(ticket.type)}</span>
      <div>
        <p class="ticket__picks">${escapeHtml(ticket.picks)}</p>
        <p class="ticket__note">${escapeHtml(ticket.note)} — ${escapeHtml(ticket.reason)}</p>
      </div>
    `;
    els.ticketList.appendChild(li);
  }
}

async function onShare() {
  const race = getRace(state.raceId);
  const venue = getVenue(state.venueId);
  const prediction = state.prediction;
  if (!race || !venue || !prediction) return;

  const top = prediction.ranked.slice(0, 3)
    .map((r, i) => `${i + 1}. ${r.horse.number}番 ${r.horse.name}（3着内 ${(r.top3Prob * 100).toFixed(1)}%）`)
    .join("\n");

  const text = [
    `【地方競馬予測】${formatRaceDate(race.date)} ${venue.name} ${race.raceNo}R ${race.name}`,
    prediction.summary.headline,
    top,
    "",
    "※デモ予測・娯楽用途です",
    location.href,
  ].join("\n");

  try {
    if (navigator.share) {
      await navigator.share({ title: "地方競馬予測", text });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(text);
    flashButton(els.shareBtn, "コピーしました");
  } catch {
    window.prompt("予測結果をコピーしてください", text);
  }
}

function onBack() {
  if (state.prediction) {
    state.prediction = null;
    showView("race");
    return;
  }
  if (state.raceId) {
    state.raceId = null;
    showView("venue");
    return;
  }
  if (state.venueId) {
    state.venueId = null;
    showView("home");
    return;
  }
  window.location.href = "../";
}

function showView(name) {
  const map = {
    home: els.viewHome,
    venue: els.viewVenue,
    race: els.viewRace,
    result: els.viewResult,
  };
  for (const [key, el] of Object.entries(map)) {
    el.hidden = key !== name;
  }

  const venue = state.venueId ? getVenue(state.venueId) : null;
  const race = state.raceId ? getRace(state.raceId) : null;

  if (name === "home") {
    els.topTitle.textContent = "地方競馬予測";
    els.backBtn.setAttribute("aria-label", "fldへ戻る");
  } else if (name === "venue") {
    els.topTitle.textContent = venue?.name ?? "競馬場";
    els.backBtn.setAttribute("aria-label", "競馬場選択へ戻る");
  } else if (name === "race") {
    els.topTitle.textContent = race ? `${race.raceNo}R` : "レース";
    els.backBtn.setAttribute("aria-label", "レース一覧へ戻る");
  } else {
    els.topTitle.textContent = "予測結果";
    els.backBtn.setAttribute("aria-label", "出馬表へ戻る");
  }
}

function formatForm(recent) {
  return recent
    .map((n) => (n > 0 ? String(n) : "-"))
    .join("-");
}

/** @param {string} isoDate YYYY-MM-DD */
function formatRaceDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];
  return `${month}月${day}日（${weekday}）`;
}

function formatWeightChange(change) {
  if (change === 0) return "(±0)";
  return `(${change > 0 ? "+" : ""}${change})`;
}

function flashButton(btn, label) {
  const original = btn.dataset.label || btn.textContent.trim();
  btn.dataset.label = original;
  const textNode = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
  const span = btn.querySelector("span.label");
  if (span) {
    span.textContent = label;
  } else {
    btn.insertAdjacentHTML("beforeend", `<span class="label"> ${label}</span>`);
  }
  window.setTimeout(() => {
    const labelEl = btn.querySelector("span.label");
    if (labelEl) labelEl.remove();
  }, 1600);
  void textNode;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
