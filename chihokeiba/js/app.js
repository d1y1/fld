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
  viewResult: document.getElementById("viewResult"),
  venueGrid: document.getElementById("venueGrid"),
  raceList: document.getElementById("raceList"),
  venueHeading: document.getElementById("venueHeading"),
  resultDate: document.getElementById("resultDate"),
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
  els.shareBtn.addEventListener("click", onShare);
  els.againBtn.addEventListener("click", () => {
    state.prediction = null;
    state.raceId = null;
    showView("venue");
  });
  showView("home");
}

function renderVenues() {
  els.venueGrid.innerHTML = "";
  for (const venue of VENUES) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card card-clickable";
    btn.innerHTML = `
      <span class="venue-name">${escapeHtml(venue.name)}</span>
      <span class="venue-meta">${escapeHtml(venue.region)} · ${escapeHtml(venue.surface)}</span>
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
  els.venueHeading.textContent = venue.name;
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
    btn.className = "card card-clickable";
    btn.innerHTML = `
      <div class="card-top">
        <div class="card-race-name">${race.raceNo}R ${escapeHtml(race.name)}</div>
        <div class="card-race-meta">${escapeHtml(formatRaceDate(race.date))}<br>${escapeHtml(race.postTime)}</div>
      </div>
      <div class="card-metrics-block">${escapeHtml(race.distance)} · ${escapeHtml(race.className)} · 馬場${escapeHtml(race.condition)} · ${race.horses.length}頭</div>
    `;
    btn.addEventListener("click", () => selectRace(race.id));
    li.appendChild(btn);
    els.raceList.appendChild(li);
  }
}

async function selectRace(raceId) {
  if (state.predicting) return;

  state.raceId = raceId;
  state.prediction = null;
  state.predicting = true;
  document.body.classList.add("predicting");

  const race = getRace(raceId);
  const venue = getVenue(race.venueId);

  await wait(220);

  const prediction = predictRace(race, { isBanei: venue?.id === "obihiro" });
  state.prediction = prediction;
  renderResult(race, venue, prediction);

  state.predicting = false;
  document.body.classList.remove("predicting");
  showView("result");
}

function renderResult(race, venue, prediction) {
  const { ranked, tickets, summary } = prediction;
  const top = ranked[0];

  els.resultDate.textContent = formatRaceDateSlash(race.date);
  els.resultSummary.innerHTML = `
    <div class="hit-summary-head">
      <span class="hit-summary-label">${escapeHtml(summary.tone)}</span>
      <span class="hit-summary-count">${escapeHtml(venue.name)} ${race.raceNo}R · ${escapeHtml(race.postTime)}</span>
    </div>
    <div class="hit-summary-rate">${escapeHtml(summary.headline)}</div>
    <p class="hit-summary-detail">${escapeHtml(race.name)} · ${escapeHtml(summary.detail)}</p>
  `;

  els.rankList.innerHTML = "";
  ranked.forEach((row, index) => {
    const li = document.createElement("li");
    const placeOdds = estimatePlaceOdds(row.horse.odds);
    const ev = row.top3Prob * placeOdds;
    const article = document.createElement("article");
    article.className = `card rank-card${index === 0 ? " highlight" : ""}`;
    article.innerHTML = `
      <div class="card-top">
        <span class="rank-label">予測 ${index + 1} 位</span>
        <span class="badge${index < 3 ? " recommended" : ""}">${index === 0 ? "本命" : index === 1 ? "対抗" : index === 2 ? "単穴" : "評価"}</span>
      </div>
      <div class="horse-line">
        <span class="horse-umaban">${row.horse.number}</span>
        <span class="horse-name">${escapeHtml(row.horse.name)}</span>
      </div>
      <div class="card-metrics-block">${metricsLine(row.top3Prob, ev, placeOdds)}</div>
    `;
    li.appendChild(article);
    els.rankList.appendChild(li);
  });

  els.ticketList.innerHTML = "";
  for (const ticket of tickets) {
    const li = document.createElement("li");
    li.innerHTML = `
      <article class="card ticket-card">
        <span class="ticket-type">${escapeHtml(ticket.type)}</span>
        <p class="ticket-picks">${escapeHtml(ticket.picks)}</p>
        <p class="ticket-note">${escapeHtml(ticket.note)} — ${escapeHtml(ticket.reason)}</p>
      </article>
    `;
    els.ticketList.appendChild(li);
  }

  void top;
}

async function onShare() {
  const race = getRace(state.raceId);
  const venue = getVenue(state.venueId);
  const prediction = state.prediction;
  if (!race || !venue || !prediction) return;

  const top = prediction.ranked.slice(0, 3)
    .map((r, i) => `${i + 1}. ${r.horse.number}番 ${r.horse.name}（確率 ${(r.top3Prob * 100).toFixed(1)}%）`)
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
  if (state.prediction || state.raceId) {
    state.prediction = null;
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
    result: els.viewResult,
  };
  for (const [key, el] of Object.entries(map)) {
    el.hidden = key !== name;
  }

  const venue = state.venueId ? getVenue(state.venueId) : null;
  els.backBtn.hidden = name === "home";

  if (name === "home") {
    els.topTitle.textContent = "地方競馬予測";
  } else if (name === "venue") {
    els.topTitle.textContent = venue?.name ?? "競馬場";
  } else {
    els.topTitle.textContent = "予想";
  }
}

/** @param {number} winOdds */
function estimatePlaceOdds(winOdds) {
  return Math.max(1.1, Math.round(winOdds * 0.38 * 10) / 10);
}

function metricsLine(prob, ev, odds) {
  return [
    metricsPart("確率", formatPercent(prob), probTone(prob)),
    metricsPart("期待値", formatEv(ev), evTone(ev)),
    metricsPart("オッズ", Number(odds).toFixed(1), evTone(ev)),
  ].join(" / ");
}

function metricsPart(label, value, tone) {
  let valueHtml = escapeHtml(value);
  if (tone === "positive") {
    valueHtml = `<span class="metric-pos">${valueHtml}</span>`;
  } else if (tone === "negative") {
    valueHtml = `<span class="metric-neg">${valueHtml}</span>`;
  }
  return `${escapeHtml(label)} ${valueHtml}`;
}

function formatPercent(prob) {
  return `${(Number(prob) * 100).toFixed(1)}%`;
}

function formatEv(ev) {
  return Number(ev).toFixed(2);
}

function probTone(prob) {
  const p = Number(prob);
  if (p >= 0.6) return "positive";
  if (p < 0.4) return "negative";
  return null;
}

function evTone(ev) {
  const e = Number(ev);
  if (e >= 1.0) return "positive";
  if (e < 1.0) return "negative";
  return null;
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

/** @param {string} isoDate YYYY-MM-DD */
function formatRaceDateSlash(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function flashButton(btn, label) {
  const original = btn.textContent;
  btn.textContent = label;
  window.setTimeout(() => {
    btn.textContent = original;
  }, 1600);
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
