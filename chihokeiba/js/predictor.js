/**
 * 地方競馬デモ用の簡易スコアリングエンジン。
 * 単勝オッズ・直近成績・騎手勝率・馬体重増減・枠順を合成し、
 * 勝率と 3 着以内確率（Harville 近似）を推定します。
 */

/**
 * @param {import('./data.js').Horse} horse
 * @param {number} fieldSize
 * @param {{ isBanei?: boolean }} [opts]
 */
export function scoreHorse(horse, fieldSize, opts = {}) {
  const form = formScore(horse.recent, fieldSize);
  const odds = oddsScore(horse.odds);
  const jockey = clamp(horse.jockeyWinRate / 0.16, 0, 1.15);
  const weight = weightScore(horse.weightChange, opts.isBanei);
  const draw = drawScore(horse.number, fieldSize);
  const consistency = consistencyScore(horse.recent);

  const raw =
    form * 0.34 +
    odds * 0.28 +
    jockey * 0.16 +
    weight * 0.1 +
    draw * 0.06 +
    consistency * 0.06;

  const score = Math.round(raw * 1000) / 10;

  return {
    score,
    breakdown: {
      form: Math.round(form * 100),
      odds: Math.round(odds * 100),
      jockey: Math.round(jockey * 100),
      weight: Math.round(weight * 100),
      draw: Math.round(draw * 100),
      consistency: Math.round(consistency * 100),
    },
  };
}

/**
 * @param {import('./data.js').Race} race
 * @param {{ isBanei?: boolean }} [opts]
 */
export function predictRace(race, opts = {}) {
  const fieldSize = race.horses.length;
  const scored = race.horses.map((horse) => {
    const { score, breakdown } = scoreHorse(horse, fieldSize, opts);
    return { horse, score, breakdown };
  });

  const max = Math.max(...scored.map((s) => s.score), 1);
  const softened = scored.map((s) => ({
    ...s,
    /** 相対スコアをソフトマックス風に勝率へ */
    winProb: Math.exp(((s.score / max) * 4.2) - 4.2),
  }));
  const sum = softened.reduce((acc, s) => acc + s.winProb, 0);
  const withWin = softened.map((s) => ({
    ...s,
    winProb: s.winProb / sum,
  }));
  const top3Probs = estimateTop3Probs(withWin.map((s) => s.winProb));

  const ranked = withWin
    .map((s, i) => ({
      ...s,
      top3Prob: top3Probs[i],
      confidence: confidenceLabel(s.score, max, fieldSize),
    }))
    .sort((a, b) => b.score - a.score || a.horse.odds - b.horse.odds);

  const tickets = buildTickets(ranked);

  return {
    ranked,
    tickets,
    summary: buildSummary(ranked, race),
  };
}

/** @param {number[]} recent @param {number} fieldSize */
function formScore(recent, fieldSize) {
  const valid = recent.filter((n) => n > 0);
  if (!valid.length) return 0.35;
  const weights = [0.35, 0.25, 0.18, 0.12, 0.1];
  let total = 0;
  let wSum = 0;
  valid.forEach((place, i) => {
    const w = weights[i] ?? 0.05;
    const norm = 1 - (place - 1) / Math.max(fieldSize - 1, 1);
    total += clamp(norm, 0, 1) * w;
    wSum += w;
  });
  return total / wSum;
}

/** @param {number} odds */
function oddsScore(odds) {
  // 人気を基本力として取り込みつつ、極端な低オッズの過信を抑える
  const fair = 1 / Math.max(odds, 1.2);
  return clamp(Math.pow(fair, 0.72) * 2.4, 0, 1.1);
}

/** @param {number} change @param {boolean} [isBanei] */
function weightScore(change, isBanei = false) {
  const scale = isBanei ? 20 : 6;
  const abs = Math.abs(change);
  if (abs <= scale * 0.35) return 0.85;
  if (change < 0) return clamp(0.85 - abs / (scale * 2.5), 0.35, 0.85);
  return clamp(0.75 - abs / (scale * 3), 0.3, 0.75);
}

/** @param {number} number @param {number} fieldSize */
function drawScore(number, fieldSize) {
  // 内枠やや有利（短距離ダート想定）
  const pos = (number - 1) / Math.max(fieldSize - 1, 1);
  return 0.95 - pos * 0.25;
}

/** @param {number[]} recent */
function consistencyScore(recent) {
  const valid = recent.filter((n) => n > 0);
  if (valid.length < 2) return 0.5;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance =
    valid.reduce((acc, n) => acc + (n - mean) ** 2, 0) / valid.length;
  return clamp(1 - Math.sqrt(variance) / 4, 0.2, 1);
}

/**
 * @param {ReturnType<typeof predictRace>['ranked']} ranked
 */
function buildTickets(ranked) {
  const top = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  if (!top || !second) return [];

  const tickets = [
    {
      type: "単勝",
      picks: `${top.horse.number}`,
      note: `${top.horse.name}一本`,
      reason: "総合スコア1位",
    },
    {
      type: "複勝",
      picks: `${top.horse.number}・${second.horse.number}`,
      note: "上位2頭カバー",
      reason: "安定重視",
    },
  ];

  if (third) {
    tickets.push({
      type: "馬連",
      picks: `${top.horse.number}-${second.horse.number}`,
      note: "本命×対抗",
      reason: "軸と相手の王道",
    });
    tickets.push({
      type: "ワイド",
      picks: `${top.horse.number}-${second.horse.number} / ${top.horse.number}-${third.horse.number}`,
      note: "軸1頭流し",
      reason: "3着以内を広く",
    });
  }

  // 穴候補: スコアに対してオッズが高い馬
  const dark = [...ranked]
    .slice(0, 6)
    .map((r) => ({
      ...r,
      value: r.winProb * r.horse.odds,
    }))
    .sort((a, b) => b.value - a.value)[0];

  if (dark && dark.horse.number !== top.horse.number && dark.horse.odds >= 8) {
    tickets.push({
      type: "穴単勝",
      picks: `${dark.horse.number}`,
      note: `${dark.horse.name}`,
      reason: "スコア対オッズの割安感",
    });
  }

  return tickets;
}

/**
 * @param {ReturnType<typeof predictRace>['ranked']} ranked
 * @param {import('./data.js').Race} race
 */
function buildSummary(ranked, race) {
  const top = ranked[0];
  const gap = top && ranked[1] ? top.score - ranked[1].score : 0;
  let tone = "混戦";
  if (gap >= 8) tone = "本命決着向き";
  else if (gap >= 4) tone = "やや本命有利";
  else if (gap < 2) tone = "大荒れ警戒";

  return {
    tone,
    headline: top
      ? `${top.horse.number}番 ${top.horse.name} を本命評価`
      : "評価不能",
    detail: `${race.name}は${tone}。上位は ${ranked
      .slice(0, 3)
      .map((r) => `${r.horse.number}番（3着内${(r.top3Prob * 100).toFixed(0)}%）`)
      .join("・")} の順。`,
  };
}

/**
 * Harville 近似で各馬の 1・2・3 着確率を求め、3 着以内確率にする。
 * 合計は理論上 3（3 枠分）になる。
 * @param {number[]} winProbs
 * @returns {number[]}
 */
function estimateTop3Probs(winProbs) {
  const n = winProbs.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  if (n === 2) {
    // 2 頭立てでは両方とも 2 着以内確定
    return winProbs.map(() => 1);
  }

  const eps = 1e-12;
  /** @type {number[]} */
  const top3 = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    const pWin = winProbs[i];
    let pSecond = 0;
    let pThird = 0;

    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const denom1 = 1 - winProbs[j];
      if (denom1 <= eps) continue;
      pSecond += winProbs[j] * (pWin / denom1);

      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const denom2 = 1 - winProbs[j] - winProbs[k];
        if (denom2 <= eps) continue;
        pThird +=
          winProbs[j] * (winProbs[k] / denom1) * (pWin / denom2);
      }
    }

    top3[i] = pWin + pSecond + pThird;
  }

  // 丸め誤差で合計が 3 からズレた場合はスケール補正
  const total = top3.reduce((a, b) => a + b, 0);
  const expected = Math.min(3, n);
  if (total > eps) {
    const scale = expected / total;
    for (let i = 0; i < n; i++) {
      top3[i] = clamp(top3[i] * scale, 0, 1);
    }
  }

  return top3;
}

/**
 * @param {number} score
 * @param {number} max
 * @param {number} fieldSize
 */
function confidenceLabel(score, max, fieldSize) {
  const rel = score / max;
  if (rel >= 0.97 && fieldSize <= 10) return "高";
  if (rel >= 0.9) return "中";
  return "低";
}

/** @param {number} n @param {number} min @param {number} max */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
