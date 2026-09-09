/** 地方競馬（NAR）デモレースデータ — 実開催とは無関係のサンプルです */
export const VENUES = [
  { id: "oi", name: "大井", region: "南関東", surface: "ダート" },
  { id: "kawasaki", name: "川崎", region: "南関東", surface: "ダート" },
  { id: "urawa", name: "浦和", region: "南関東", surface: "ダート" },
  { id: "funabashi", name: "船橋", region: "南関東", surface: "ダート" },
  { id: "monbetsu", name: "門別", region: "北海道", surface: "ダート" },
  { id: "morioka", name: "盛岡", region: "東北", surface: "ダート" },
  { id: "sonoda", name: "園田", region: "兵庫", surface: "ダート" },
  { id: "kochi", name: "高知", region: "四国", surface: "ダート" },
  { id: "saga", name: "佐賀", region: "九州", surface: "ダート" },
  { id: "obihiro", name: "帯広", region: "ばんえい", surface: "ばんえい" },
];

/**
 * @typedef {object} Horse
 * @property {number} number
 * @property {string} name
 * @property {string} jockey
 * @property {number} odds
 * @property {number} weight
 * @property {number} weightChange
 * @property {number[]} recent — 直近成績（着順）。0は除外・未出走扱い
 * @property {number} jockeyWinRate — 騎手勝率 0–1
 * @property {number} age
 * @property {string} sex — 牡 / 牝 / セ
 * @property {number} [burden] — 負担重量 kg
 */

/**
 * @typedef {object} Race
 * @property {string} id
 * @property {string} venueId
 * @property {number} raceNo
 * @property {string} name
 * @property {string} date — YYYY-MM-DD（デモ開催日）
 * @property {string} distance
 * @property {string} className
 * @property {string} condition — 馬場
 * @property {string} postTime
 * @property {Horse[]} horses
 */

/** @type {Race[]} */
export const RACES = [
  {
    id: "oi-11",
    venueId: "oi",
    raceNo: 11,
    name: "東京スプリント特別",
    date: "2026-09-09",
    distance: "ダート1200m",
    className: "A2",
    condition: "良",
    postTime: "20:40",
    horses: [
      { number: 1, name: "ナイトリーフ", jockey: "森下博", odds: 8.4, weight: 478, weightChange: -2, recent: [2, 3, 1, 5, 4], jockeyWinRate: 0.11, age: 5, sex: "牡", burden: 56 },
      { number: 2, name: "サクラノホシ", jockey: "御神本訓", odds: 3.2, weight: 492, weightChange: 4, recent: [1, 1, 2, 3, 1], jockeyWinRate: 0.14, age: 4, sex: "牡", burden: 57 },
      { number: 3, name: "ブルーカナリア", jockey: "山田敬士", odds: 12.6, weight: 456, weightChange: 0, recent: [4, 2, 6, 3, 5], jockeyWinRate: 0.09, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "カゼノキセキ", jockey: "本橋孝太", odds: 5.8, weight: 486, weightChange: 2, recent: [3, 1, 4, 2, 2], jockeyWinRate: 0.12, age: 6, sex: "牡", burden: 56 },
      { number: 5, name: "マリンフラッシュ", jockey: "笹川翼", odds: 18.0, weight: 468, weightChange: -6, recent: [7, 5, 8, 4, 6], jockeyWinRate: 0.13, age: 5, sex: "牝", burden: 54 },
      { number: 6, name: "ゴールドスパイク", jockey: "真島大輔", odds: 4.5, weight: 504, weightChange: 0, recent: [2, 2, 1, 1, 3], jockeyWinRate: 0.1, age: 5, sex: "牡", burden: 57 },
      { number: 7, name: "ラピッドゲイル", jockey: "吉原寛人", odds: 25.5, weight: 472, weightChange: 8, recent: [9, 6, 4, 8, 7], jockeyWinRate: 0.08, age: 7, sex: "セ", burden: 56 },
      { number: 8, name: "ヒカリノトビラ", jockey: "矢野貴之", odds: 9.1, weight: 460, weightChange: -4, recent: [1, 5, 3, 2, 4], jockeyWinRate: 0.15, age: 4, sex: "牝", burden: 54 },
      { number: 9, name: "ストームエッジ", jockey: "藤本現暉", odds: 15.2, weight: 490, weightChange: 2, recent: [5, 4, 2, 6, 3], jockeyWinRate: 0.07, age: 6, sex: "牡", burden: 56 },
      { number: 10, name: "ムーンリット", jockey: "西啓太", odds: 42.0, weight: 448, weightChange: -8, recent: [8, 9, 7, 10, 5], jockeyWinRate: 0.06, age: 5, sex: "牝", burden: 54 },
    ],
  },
  {
    id: "oi-8",
    venueId: "oi",
    raceNo: 8,
    name: "3歳以上C1",
    date: "2026-09-09",
    distance: "ダート1400m",
    className: "C1",
    condition: "稍重",
    postTime: "18:55",
    horses: [
      { number: 1, name: "アオイマチ", jockey: "和田譲治", odds: 6.2, weight: 470, weightChange: 0, recent: [3, 2, 4, 1, 5], jockeyWinRate: 0.1, age: 4, sex: "牡", burden: 56 },
      { number: 2, name: "フクデンボス", jockey: "達城龍次", odds: 4.1, weight: 498, weightChange: 6, recent: [1, 3, 2, 2, 1], jockeyWinRate: 0.09, age: 5, sex: "牡", burden: 57 },
      { number: 3, name: "サザンブリーズ", jockey: "山崎誠士", odds: 11.0, weight: 452, weightChange: -2, recent: [5, 1, 6, 4, 3], jockeyWinRate: 0.11, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "テツノイナズマ", jockey: "西村栄治", odds: 7.8, weight: 482, weightChange: 2, recent: [2, 4, 3, 5, 2], jockeyWinRate: 0.08, age: 6, sex: "牡", burden: 56 },
      { number: 5, name: "キタノダイヤ", jockey: "木村駿也", odds: 22.0, weight: 464, weightChange: 4, recent: [6, 8, 5, 7, 4], jockeyWinRate: 0.07, age: 5, sex: "セ", burden: 56 },
      { number: 6, name: "レグルスロード", jockey: "野畑凌", odds: 3.6, weight: 490, weightChange: -4, recent: [1, 2, 1, 3, 2], jockeyWinRate: 0.12, age: 4, sex: "牡", burden: 56 },
      { number: 7, name: "サクラバナ", jockey: "谷内貫太", odds: 14.5, weight: 446, weightChange: 0, recent: [4, 5, 2, 6, 8], jockeyWinRate: 0.09, age: 3, sex: "牝", burden: 53 },
      { number: 8, name: "ブラックフォール", jockey: "林幻", odds: 9.4, weight: 506, weightChange: 2, recent: [3, 1, 5, 4, 3], jockeyWinRate: 0.1, age: 7, sex: "牡", burden: 57 },
    ],
  },
  {
    id: "kawasaki-10",
    venueId: "kawasaki",
    raceNo: 10,
    name: "川崎マイラーズ",
    date: "2026-09-10",
    distance: "ダート1600m",
    className: "A1",
    condition: "良",
    postTime: "20:10",
    horses: [
      { number: 1, name: "カワセミフライト", jockey: "町田直希", odds: 5.1, weight: 476, weightChange: 0, recent: [2, 1, 3, 2, 4], jockeyWinRate: 0.13, age: 5, sex: "牡", burden: 57 },
      { number: 2, name: "レッドクラウン", jockey: "山崎誠士", odds: 2.8, weight: 500, weightChange: 2, recent: [1, 1, 1, 2, 1], jockeyWinRate: 0.11, age: 6, sex: "牡", burden: 58 },
      { number: 3, name: "ミストラルガール", jockey: "伊藤裕人", odds: 16.4, weight: 450, weightChange: -4, recent: [5, 3, 7, 4, 6], jockeyWinRate: 0.08, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "タイキフェニックス", jockey: "今野忠成", odds: 7.2, weight: 488, weightChange: 4, recent: [3, 2, 4, 1, 3], jockeyWinRate: 0.12, age: 5, sex: "牡", burden: 56 },
      { number: 5, name: "サンドストーム", jockey: "森下惇", odds: 28.0, weight: 470, weightChange: 10, recent: [8, 6, 9, 5, 7], jockeyWinRate: 0.06, age: 7, sex: "セ", burden: 56 },
      { number: 6, name: "ナイトカーニバル", jockey: "佐藤翔馬", odds: 9.8, weight: 462, weightChange: -2, recent: [4, 2, 5, 3, 1], jockeyWinRate: 0.1, age: 4, sex: "牝", burden: 54 },
      { number: 7, name: "ダイチノキセキ", jockey: "瀧川寿希也", odds: 4.4, weight: 494, weightChange: 0, recent: [1, 3, 2, 1, 2], jockeyWinRate: 0.14, age: 5, sex: "牡", burden: 57 },
      { number: 8, name: "プラチナアロー", jockey: "藤本現暉", odds: 12.0, weight: 480, weightChange: 2, recent: [6, 4, 1, 5, 3], jockeyWinRate: 0.07, age: 6, sex: "牡", burden: 56 },
      { number: 9, name: "コスモスプリンター", jockey: "西村淳也", odds: 35.0, weight: 444, weightChange: -6, recent: [9, 7, 8, 10, 6], jockeyWinRate: 0.05, age: 4, sex: "牝", burden: 54 },
    ],
  },
  {
    id: "urawa-9",
    venueId: "urawa",
    raceNo: 9,
    name: "浦和記念トライアル",
    date: "2026-09-08",
    distance: "ダート1400m",
    className: "A2",
    condition: "良",
    postTime: "16:20",
    horses: [
      { number: 1, name: "ウラワエース", jockey: "見越崇史", odds: 6.8, weight: 484, weightChange: 2, recent: [2, 4, 1, 3, 2], jockeyWinRate: 0.11, age: 5, sex: "牡", burden: 56 },
      { number: 2, name: "サクラサクラ", jockey: "左海誠二", odds: 3.9, weight: 458, weightChange: 0, recent: [1, 2, 1, 4, 3], jockeyWinRate: 0.13, age: 4, sex: "牝", burden: 54 },
      { number: 3, name: "サンダーロード", jockey: "繁田健一", odds: 8.5, weight: 502, weightChange: 4, recent: [3, 1, 5, 2, 4], jockeyWinRate: 0.09, age: 6, sex: "牡", burden: 57 },
      { number: 4, name: "グリーンパレス", jockey: "吉井章", odds: 14.0, weight: 466, weightChange: -2, recent: [5, 6, 3, 4, 7], jockeyWinRate: 0.08, age: 5, sex: "セ", burden: 56 },
      { number: 5, name: "マキシマム", jockey: "張田昂", odds: 4.7, weight: 490, weightChange: 0, recent: [1, 3, 2, 1, 5], jockeyWinRate: 0.12, age: 5, sex: "牡", burden: 56 },
      { number: 6, name: "リトルウィング", jockey: "村上忍", odds: 19.5, weight: 442, weightChange: -4, recent: [7, 4, 8, 5, 6], jockeyWinRate: 0.07, age: 3, sex: "牝", burden: 53 },
      { number: 7, name: "ブラックダイヤ", jockey: "仲野光成", odds: 5.6, weight: 496, weightChange: 6, recent: [2, 2, 3, 1, 2], jockeyWinRate: 0.1, age: 6, sex: "牡", burden: 57 },
      { number: 8, name: "ハナビノキセキ", jockey: "臼井健太", odds: 11.2, weight: 472, weightChange: 2, recent: [4, 1, 6, 3, 5], jockeyWinRate: 0.09, age: 4, sex: "牝", burden: 54 },
    ],
  },
  {
    id: "funabashi-11",
    venueId: "funabashi",
    raceNo: 11,
    name: "船橋スプリント",
    date: "2026-09-11",
    distance: "ダート1000m",
    className: "A2",
    condition: "良",
    postTime: "20:00",
    horses: [
      { number: 1, name: "スピードキング", jockey: "石崎駿", odds: 3.5, weight: 478, weightChange: 0, recent: [1, 1, 2, 1, 3], jockeyWinRate: 0.14, age: 5, sex: "牡", burden: 57 },
      { number: 2, name: "アカリノユメ", jockey: "本橋孝太", odds: 7.1, weight: 452, weightChange: -2, recent: [3, 2, 4, 1, 5], jockeyWinRate: 0.12, age: 4, sex: "牝", burden: 54 },
      { number: 3, name: "ドンデンガエシ", jockey: "山口勲", odds: 9.6, weight: 488, weightChange: 4, recent: [2, 5, 3, 4, 2], jockeyWinRate: 0.1, age: 6, sex: "牡", burden: 56 },
      { number: 4, name: "フラッシュボルト", jockey: "御神本訓", odds: 4.2, weight: 470, weightChange: 2, recent: [1, 3, 1, 2, 1], jockeyWinRate: 0.14, age: 4, sex: "牡", burden: 56 },
      { number: 5, name: "ユメノトビラ", jockey: "笹川翼", odds: 15.8, weight: 444, weightChange: 0, recent: [6, 4, 7, 5, 3], jockeyWinRate: 0.13, age: 5, sex: "牝", burden: 54 },
      { number: 6, name: "ワイルドカード", jockey: "真島大輔", odds: 22.0, weight: 510, weightChange: 8, recent: [8, 6, 4, 9, 5], jockeyWinRate: 0.1, age: 7, sex: "セ", burden: 57 },
      { number: 7, name: "カイザーエッジ", jockey: "吉原寛人", odds: 6.4, weight: 486, weightChange: -4, recent: [2, 1, 4, 3, 2], jockeyWinRate: 0.08, age: 5, sex: "牡", burden: 56 },
      { number: 8, name: "スターダスト", jockey: "矢野貴之", odds: 12.5, weight: 460, weightChange: 2, recent: [5, 3, 2, 6, 4], jockeyWinRate: 0.15, age: 4, sex: "牝", burden: 54 },
    ],
  },
  {
    id: "monbetsu-7",
    venueId: "monbetsu",
    raceNo: 7,
    name: "3歳未勝利",
    date: "2026-09-07",
    distance: "ダート1200m",
    className: "未勝利",
    condition: "稍重",
    postTime: "14:40",
    horses: [
      { number: 1, name: "ホッカイドウ", jockey: "服部茂史", odds: 5.4, weight: 468, weightChange: 0, recent: [3, 2, 4, 5, 0], jockeyWinRate: 0.12, age: 3, sex: "牡", burden: 56 },
      { number: 2, name: "キタノサクラ", jockey: "石川倭", odds: 8.8, weight: 440, weightChange: -2, recent: [4, 6, 3, 5, 0], jockeyWinRate: 0.1, age: 3, sex: "牝", burden: 54 },
      { number: 3, name: "サッポロナイト", jockey: "岩橋勇二", odds: 3.1, weight: 476, weightChange: 4, recent: [2, 1, 2, 3, 0], jockeyWinRate: 0.11, age: 3, sex: "牡", burden: 56 },
      { number: 4, name: "ラブリーウィン", jockey: "宮崎光行", odds: 12.0, weight: 452, weightChange: 2, recent: [5, 4, 7, 6, 0], jockeyWinRate: 0.09, age: 3, sex: "牝", burden: 54 },
      { number: 5, name: "ブレイブハート", jockey: "阿部龍", odds: 6.7, weight: 484, weightChange: 0, recent: [1, 3, 5, 2, 0], jockeyWinRate: 0.08, age: 3, sex: "牡", burden: 56 },
      { number: 6, name: "スノーフレーク", jockey: "落林頼親", odds: 18.5, weight: 436, weightChange: -6, recent: [7, 8, 5, 9, 0], jockeyWinRate: 0.07, age: 3, sex: "牝", burden: 54 },
      { number: 7, name: "タイセインパクト", jockey: "濱中俊", odds: 4.9, weight: 490, weightChange: 2, recent: [2, 2, 1, 4, 0], jockeyWinRate: 0.13, age: 3, sex: "牡", burden: 56 },
      { number: 8, name: "モエレスピリット", jockey: "五十嵐冬樹", odds: 15.0, weight: 462, weightChange: 6, recent: [6, 5, 4, 8, 0], jockeyWinRate: 0.1, age: 3, sex: "セ", burden: 56 },
    ],
  },
  {
    id: "morioka-10",
    venueId: "morioka",
    raceNo: 10,
    name: "マイルチャンピオンシップ南部杯トライアル",
    date: "2026-09-06",
    distance: "ダート1600m",
    className: "オープン",
    condition: "良",
    postTime: "15:50",
    horses: [
      { number: 1, name: "イワテサンダー", jockey: "村上忍", odds: 7.5, weight: 492, weightChange: 0, recent: [2, 3, 1, 4, 2], jockeyWinRate: 0.11, age: 5, sex: "牡", burden: 57 },
      { number: 2, name: "トウホクスター", jockey: "山本政聡", odds: 3.4, weight: 506, weightChange: 2, recent: [1, 1, 2, 1, 3], jockeyWinRate: 0.14, age: 6, sex: "牡", burden: 58 },
      { number: 3, name: "アオモリウィンド", jockey: "高橋悠里", odds: 11.8, weight: 458, weightChange: -2, recent: [4, 2, 5, 3, 6], jockeyWinRate: 0.09, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "ミナミノカゼ", jockey: "坂口裕一", odds: 5.9, weight: 480, weightChange: 4, recent: [3, 1, 3, 2, 1], jockeyWinRate: 0.1, age: 5, sex: "牡", burden: 56 },
      { number: 5, name: "キリフダ", jockey: "菅原辰徳", odds: 16.0, weight: 470, weightChange: 0, recent: [6, 5, 4, 7, 3], jockeyWinRate: 0.08, age: 7, sex: "セ", burden: 56 },
      { number: 6, name: "ハクオウ", jockey: "高松亮", odds: 8.2, weight: 464, weightChange: -4, recent: [1, 4, 2, 5, 4], jockeyWinRate: 0.12, age: 4, sex: "牝", burden: 54 },
      { number: 7, name: "ダイチノオウジャ", jockey: "岩本怜", odds: 4.6, weight: 498, weightChange: 2, recent: [2, 2, 1, 1, 2], jockeyWinRate: 0.13, age: 5, sex: "牡", burden: 57 },
      { number: 8, name: "オーロラビーム", jockey: "鈴木祐", odds: 24.0, weight: 446, weightChange: 8, recent: [8, 7, 6, 9, 5], jockeyWinRate: 0.06, age: 4, sex: "牝", burden: 54 },
    ],
  },
  {
    id: "sonoda-11",
    venueId: "sonoda",
    raceNo: 11,
    name: "兵庫チャンピオンシップ",
    date: "2026-09-10",
    distance: "ダート1400m",
    className: "重賞",
    condition: "良",
    postTime: "16:00",
    horses: [
      { number: 1, name: "ヒョウゴキング", jockey: "下原理", odds: 4.8, weight: 486, weightChange: 0, recent: [1, 2, 1, 3, 2], jockeyWinRate: 0.12, age: 4, sex: "牡", burden: 56 },
      { number: 2, name: "オサカフラッシュ", jockey: "田中学", odds: 6.2, weight: 472, weightChange: 2, recent: [3, 1, 4, 2, 1], jockeyWinRate: 0.11, age: 5, sex: "牡", burden: 56 },
      { number: 3, name: "キョウトビューティ", jockey: "廣瀬航", odds: 13.5, weight: 448, weightChange: -2, recent: [5, 4, 2, 6, 3], jockeyWinRate: 0.09, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "ナリタカイザー", jockey: "吉村智洋", odds: 3.2, weight: 500, weightChange: 4, recent: [1, 1, 2, 1, 1], jockeyWinRate: 0.15, age: 5, sex: "牡", burden: 57 },
      { number: 5, name: "セトウチ", jockey: "大山龍太郎", odds: 18.0, weight: 460, weightChange: 0, recent: [7, 5, 6, 4, 8], jockeyWinRate: 0.07, age: 6, sex: "セ", burden: 56 },
      { number: 6, name: "サクラガワ", jockey: "松木大地", odds: 9.1, weight: 454, weightChange: -4, recent: [2, 3, 5, 1, 4], jockeyWinRate: 0.1, age: 4, sex: "牝", burden: 54 },
      { number: 7, name: "タイガーアイ", jockey: "鴨宮祥行", odds: 7.4, weight: 490, weightChange: 2, recent: [4, 2, 1, 3, 2], jockeyWinRate: 0.1, age: 5, sex: "牡", burden: 56 },
      { number: 8, name: "ミラクルラン", jockey: "長尾達也", odds: 21.0, weight: 466, weightChange: 6, recent: [6, 8, 4, 7, 5], jockeyWinRate: 0.08, age: 7, sex: "牡", burden: 56 },
      { number: 9, name: "ヒカリノミチ", jockey: "渡邊雄太", odds: 11.0, weight: 442, weightChange: 0, recent: [3, 5, 2, 4, 6], jockeyWinRate: 0.09, age: 3, sex: "牝", burden: 53 },
    ],
  },
  {
    id: "kochi-9",
    venueId: "kochi",
    raceNo: 9,
    name: "夜さ恋特別",
    date: "2026-09-09",
    distance: "ダート1300m",
    className: "A",
    condition: "稍重",
    postTime: "20:15",
    horses: [
      { number: 1, name: "ヨサコイスター", jockey: "赤岡修次", odds: 3.8, weight: 482, weightChange: 0, recent: [1, 2, 1, 1, 3], jockeyWinRate: 0.16, age: 5, sex: "牡", burden: 57 },
      { number: 2, name: "シマントリバー", jockey: "永森大智", odds: 6.5, weight: 468, weightChange: 2, recent: [2, 3, 4, 1, 2], jockeyWinRate: 0.12, age: 4, sex: "牡", burden: 56 },
      { number: 3, name: "トサノヒメ", jockey: "宮川実", odds: 10.2, weight: 446, weightChange: -2, recent: [4, 1, 5, 3, 6], jockeyWinRate: 0.11, age: 4, sex: "牝", burden: 54 },
      { number: 4, name: "クロシオ", jockey: "畑中信司", odds: 5.1, weight: 494, weightChange: 4, recent: [1, 3, 2, 2, 1], jockeyWinRate: 0.1, age: 6, sex: "牡", burden: 57 },
      { number: 5, name: "ナンコクナイト", jockey: "岡村卓弥", odds: 14.8, weight: 470, weightChange: 0, recent: [5, 6, 3, 7, 4], jockeyWinRate: 0.08, age: 5, sex: "セ", burden: 56 },
      { number: 6, name: "サクライロ", jockey: "西川敏弘", odds: 8.7, weight: 450, weightChange: -4, recent: [3, 2, 5, 4, 1], jockeyWinRate: 0.09, age: 5, sex: "牝", burden: 54 },
      { number: 7, name: "ドラゴンテイル", jockey: "倉兼仁", odds: 12.0, weight: 486, weightChange: 6, recent: [6, 4, 2, 5, 3], jockeyWinRate: 0.07, age: 7, sex: "牡", burden: 56 },
      { number: 8, name: "ムーンビーム", jockey: "木村直輝", odds: 19.5, weight: 438, weightChange: 2, recent: [7, 5, 8, 6, 4], jockeyWinRate: 0.06, age: 3, sex: "牝", burden: 53 },
    ],
  },
  {
    id: "saga-8",
    venueId: "saga",
    raceNo: 8,
    name: "佐賀ヴィーナスカップ",
    date: "2026-09-05",
    distance: "ダート1400m",
    className: "重賞",
    condition: "良",
    postTime: "15:20",
    horses: [
      { number: 1, name: "サガンビューティ", jockey: "山下裕貴", odds: 4.3, weight: 454, weightChange: 0, recent: [1, 2, 1, 3, 2], jockeyWinRate: 0.12, age: 4, sex: "牝", burden: 55 },
      { number: 2, name: "キュウシュウガール", jockey: "田中直人", odds: 6.9, weight: 448, weightChange: -2, recent: [3, 1, 4, 2, 5], jockeyWinRate: 0.1, age: 5, sex: "牝", burden: 55 },
      { number: 3, name: "ハカタノカゼ", jockey: "山口勲", odds: 8.1, weight: 460, weightChange: 2, recent: [2, 4, 3, 1, 4], jockeyWinRate: 0.11, age: 4, sex: "牝", burden: 55 },
      { number: 4, name: "サクラヒメ", jockey: "吉本智", odds: 3.6, weight: 442, weightChange: 0, recent: [1, 1, 2, 1, 3], jockeyWinRate: 0.13, age: 4, sex: "牝", burden: 55 },
      { number: 5, name: "ニシノファンタジー", jockey: "竹吉徹", odds: 15.0, weight: 436, weightChange: -4, recent: [5, 6, 4, 7, 3], jockeyWinRate: 0.08, age: 5, sex: "牝", burden: 55 },
      { number: 6, name: "ムーンライト", jockey: "出水拓人", odds: 11.4, weight: 450, weightChange: 4, recent: [4, 2, 5, 3, 6], jockeyWinRate: 0.09, age: 3, sex: "牝", burden: 53 },
      { number: 7, name: "レディーストーム", jockey: "川島拓", odds: 7.2, weight: 466, weightChange: 2, recent: [2, 3, 1, 4, 2], jockeyWinRate: 0.1, age: 6, sex: "牝", burden: 55 },
      { number: 8, name: "フクオカスター", jockey: "飛田愛斗", odds: 18.8, weight: 444, weightChange: 0, recent: [6, 5, 7, 4, 8], jockeyWinRate: 0.07, age: 5, sex: "牝", burden: 55 },
    ],
  },
  {
    id: "obihiro-10",
    venueId: "obihiro",
    raceNo: 10,
    name: "ばんえい十勝特別",
    date: "2026-09-08",
    distance: "ばんえい200m",
    className: "オープン",
    condition: "重",
    postTime: "16:00",
    horses: [
      { number: 1, name: "オホーツクキング", jockey: "藤野俊一", odds: 4.1, weight: 980, weightChange: 0, recent: [1, 2, 1, 3, 2], jockeyWinRate: 0.14, age: 7, sex: "牡", burden: 0 },
      { number: 2, name: "トカチパワー", jockey: "鈴木恵介", odds: 5.6, weight: 1020, weightChange: 10, recent: [2, 1, 3, 2, 1], jockeyWinRate: 0.12, age: 8, sex: "牡", burden: 0 },
      { number: 3, name: "キタノタイタン", jockey: "阿部武臣", odds: 7.8, weight: 995, weightChange: -5, recent: [3, 4, 2, 5, 1], jockeyWinRate: 0.1, age: 6, sex: "牡", burden: 0 },
      { number: 4, name: "ホクレンエース", jockey: "島津新", odds: 3.5, weight: 1010, weightChange: 5, recent: [1, 1, 2, 1, 3], jockeyWinRate: 0.15, age: 7, sex: "牡", burden: 0 },
      { number: 5, name: "バンエイスター", jockey: "松田道明", odds: 12.0, weight: 970, weightChange: 0, recent: [5, 3, 6, 4, 2], jockeyWinRate: 0.09, age: 9, sex: "セ", burden: 0 },
      { number: 6, name: "ダイチノチカラ", jockey: "西康志", odds: 9.4, weight: 1005, weightChange: 15, recent: [4, 2, 4, 3, 5], jockeyWinRate: 0.11, age: 6, sex: "牡", burden: 0 },
      { number: 7, name: "スノーブリザード", jockey: "長澤幸太", odds: 16.5, weight: 960, weightChange: -10, recent: [6, 5, 7, 4, 8], jockeyWinRate: 0.08, age: 8, sex: "牡", burden: 0 },
      { number: 8, name: "ホッカイドウオウ", jockey: "渡来心悟", odds: 6.8, weight: 990, weightChange: 0, recent: [2, 3, 1, 2, 4], jockeyWinRate: 0.1, age: 7, sex: "牡", burden: 0 },
    ],
  },
];

export function getVenue(venueId) {
  return VENUES.find((v) => v.id === venueId) ?? null;
}

export function getRacesByVenue(venueId) {
  return RACES.filter((r) => r.venueId === venueId);
}

export function getRace(raceId) {
  return RACES.find((r) => r.id === raceId) ?? null;
}
