(() => {
"use strict";

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

let W = innerWidth, H = innerHeight, dpr = 1;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const TILE = 44; // 타일을 44px로 키워 디테일한 도트 아트가 훨씬 선명하게 보이도록 개선
const WORLD_W = 42;
const WORLD_H = 42;

const RARITIES = [
  { id: "common", name: "일반", color: "#a8b5c0", chance: 55 },
  { id: "uncommon", name: "고급", color: "#73d39b", chance: 25 },
  { id: "rare", name: "희귀", color: "#6ab7f5", chance: 13 },
  { id: "epic", name: "영웅", color: "#c18af2", chance: 5 },
  { id: "legendary", name: "전설", color: "#f3c568", chance: 1.8 },
  { id: "mythic", name: "신화", color: "#ff718a", chance: 0.2 },
  { id: "transcendent", name: "초월", color: "#00ffff", chance: 0.05 }
];

// ------------------------------------
// 📜 10가지 전직 클래스
// ------------------------------------
const JOBS = [
  {
    id: "apprentice", name: "견습 광부", emoji: "⛏️", tier: 1, reqLevel: 1, reqGold: 0, color: "#aebdca",
    desc: "광산에 입문한 초보 광부. 기본적인 채굴법을 익힙니다.",
    buffs: { powerMult: 1.0, speedMult: 1.0, goldBonus: 1.0, expBonus: 1.0, petSpeedMult: 1.0 },
    buffDesc: "기본 능력치 유지"
  },
  {
    id: "iron_miner", name: "강철 채굴꾼", emoji: "💪", tier: 1, reqLevel: 3, reqGold: 300, color: "#73d39b",
    desc: "강인한 근력으로 단단한 암석도 가볍게 파괴합니다.",
    buffs: { powerMult: 1.35, speedMult: 1.1, goldBonus: 1.1, expBonus: 1.0, petSpeedMult: 1.0 },
    buffDesc: "⚡ 채굴력 +35%, 🏃 채굴 속도 +10%, 💰 골드 +10%"
  },
  {
    id: "treasure_hunter", name: "보물 사냥꾼", emoji: "🧭", tier: 1, reqLevel: 5, reqGold: 800, color: "#6ab7f5",
    desc: "희귀한 광맥을 찾아내는 예리한 직감을 가졌습니다.",
    buffs: { powerMult: 1.1, speedMult: 1.25, goldBonus: 1.4, expBonus: 1.2, petSpeedMult: 1.2 },
    buffDesc: "💰 골드 획득량 +40%, 🧪 경험치 +20%, 🏃 속도 +25%"
  },
  {
    id: "gold_magnate", name: "황금 대부호", emoji: "👑", tier: 2, reqLevel: 10, reqGold: 2500, color: "#f5c66b",
    desc: "모든 광물을 비싼 가격에 판매하는 거상입니다.",
    buffs: { powerMult: 1.2, speedMult: 1.15, goldBonus: 2.0, expBonus: 1.1, petSpeedMult: 1.0 },
    buffDesc: "💰 골드 판매 가치 200% (2배 폭증), ⚡ 채굴력 +20%"
  },
  {
    id: "runic_blacksmith", name: "룬 대장장이", emoji: "⚒️", tier: 2, reqLevel: 12, reqGold: 5000, color: "#c18af2",
    desc: "마법 룬을 도구에 부여하여 채굴 효율을 최적화합니다.",
    buffs: { powerMult: 1.8, speedMult: 1.4, goldBonus: 1.25, expBonus: 1.3, petSpeedMult: 1.0 },
    buffDesc: "⚡ 채굴력 +80%, 🏃 채굴 속도 +40%, 🧪 경험치 +30%"
  },
  {
    id: "fairy_whisperer", name: "요정 교감사", emoji: "🧚‍♂️", tier: 2, reqLevel: 15, reqGold: 10000, color: "#ff718a",
    desc: "동행 펫의 숨겨진 보물 탐사 능력을 극대화합니다.",
    buffs: { powerMult: 1.3, speedMult: 1.3, goldBonus: 1.5, expBonus: 1.5, petSpeedMult: 2.0 },
    buffDesc: "🎁 펫 보물 발굴 주기 2배 단축 (5초 마다 발굴!), 🧪 EXP +50%"
  },
  {
    id: "magma_breaker", name: "마그마 파괴자", emoji: "🔥", tier: 3, reqLevel: 22, reqGold: 25000, color: "#ff4d4d",
    desc: "용암의 뜨거운 열기로 심연의 암석을 단숨에 녹여냅니다.",
    buffs: { powerMult: 2.5, speedMult: 1.6, goldBonus: 1.6, expBonus: 1.6, petSpeedMult: 1.2 },
    buffDesc: "⚡ 채굴력 +150% (2.5배), 🏃 속도 +60%, 💰 골드 +60%"
  },
  {
    id: "abyssal_lord", name: "심연의 지배자", emoji: "🌌", tier: 3, reqLevel: 30, reqGold: 60000, color: "#a066ff",
    desc: "지하 최심부의 어둠을 지배하는 전설의 지배자입니다.",
    buffs: { powerMult: 3.5, speedMult: 1.8, goldBonus: 2.5, expBonus: 2.0, petSpeedMult: 1.5 },
    buffDesc: "⚡ 채굴력 +250% (3.5배), 💰 골드 +150%, 🧪 경험치 2배"
  },
  {
    id: "celestial_miner", name: "천상 채광신", emoji: "✨", tier: 4, reqLevel: 45, reqGold: 200000, color: "#fffa65",
    desc: "별과 신화의 에너지를 다루는 초월적인 광부의 경지입니다.",
    buffs: { powerMult: 6.0, speedMult: 2.3, goldBonus: 4.0, expBonus: 3.5, petSpeedMult: 2.0 },
    buffDesc: "⚡ 채굴력 +500% (6배), 💰 골드 4배, 🎁 펫 스킬 5초 주기"
  },
  {
    id: "god_of_deepmine", name: "딥마인 창조신", emoji: "☀️", tier: 4, reqLevel: 65, reqGold: 1000000, color: "#00ffff",
    desc: "광산의 모든 자원과 공간을 영원히 다스리는 절대자입니다.",
    buffs: { powerMult: 15.0, speedMult: 3.2, goldBonus: 8.0, expBonus: 6.0, petSpeedMult: 2.5 },
    buffDesc: "👑 모든 채굴 능력치 및 골드 8~15배 극대화 (최종 신화 등급)"
  }
];

// ------------------------------------
// ⛏️ 100단계 초월 곡괭이 진화 시스템
// ------------------------------------
const PICKAXE_EVOLUTION = [
  { minLv: 0,  name: "나무 곡괭이",      emoji: "🪵", headColor: "#a06a3b", handleColor: "#5c4033", auraColor: null },
  { minLv: 5,  name: "단단한 돌 곡괭이", emoji: "🪨", headColor: "#95a5a6", handleColor: "#5c4033", auraColor: null },
  { minLv: 10, name: "구리 광부 곡괭이", emoji: "🥉", headColor: "#e67e22", handleColor: "#7f8c8d", auraColor: "#e67e22" },
  { minLv: 15, name: "강철 제련 곡괭이", emoji: "⛏️", headColor: "#bdc3c7", handleColor: "#34495e", auraColor: "#95a5a6" },
  { minLv: 20, name: "순은 세공 곡괭이", emoji: "🥈", headColor: "#ecf0f1", handleColor: "#2c3e50", auraColor: "#ffffff" },
  { minLv: 30, name: "황금 왕실 곡괭이", emoji: "🟡", headColor: "#f1c40f", handleColor: "#b8860b", auraColor: "#f39c12" },
  { minLv: 40, name: "핏빛 루비 곡괭이", emoji: "♦️", headColor: "#ff4757", handleColor: "#922b21", auraColor: "#ff4d4d" },
  { minLv: 50, name: "심해 사파이어 곡괭이", emoji: "💎", headColor: "#1e90ff", handleColor: "#1b4f72", auraColor: "#00d2ff" },
  { minLv: 60, name: "고대 에메랄드 곡괭이", emoji: "🟢", headColor: "#2ed573", handleColor: "#145a32", auraColor: "#00ff88" },
  { minLv: 70, name: "용암 마그마 곡괭이", emoji: "🔥", headColor: "#ff6348", handleColor: "#4a151b", auraColor: "#ff9800" },
  { minLv: 80, name: "공허의 암흑 곡괭이", emoji: "🌑", headColor: "#a55eea", handleColor: "#1a0b2e", auraColor: "#e056fd" },
  { minLv: 90, name: "은하수 별빛 곡괭이", emoji: "🌟", headColor: "#00e5ff", handleColor: "#283593", auraColor: "#80d8ff" },
  { minLv: 95, name: "태양신 오메가 곡괭이", emoji: "☀️", headColor: "#ffeb3b", handleColor: "#ff6f00", auraColor: "#ffd740" },
  { minLv: 100, name: "[초월] 창세의 절대 곡괭이", emoji: "🌌", headColor: "#00ffff", handleColor: "#ffffff", auraColor: "#ff00ff" }
];

function getToolTier(level) {
  let matched = PICKAXE_EVOLUTION[0];
  for (const tier of PICKAXE_EVOLUTION) {
    if (level >= tier.minLv) matched = tier;
  }
  return {
    ...matched,
    level: level,
    speedBonus: +(1.0 + level * 0.035).toFixed(2),
    powerBonus: Math.floor(level * 12 + Math.pow(level, 1.85) * 4)
  };
}

// ------------------------------------
// 💎 확장된 16종의 광물 데이터베이스 (정교한 픽셀 색상 팔레트 포함)
// ------------------------------------
const ORES = [
  { id: "stone",      name: "돌",         emoji: "🪨", value: 3,      hp: 3,    depth: 1,  weight: 45, rarity: "common",       mainColor: "#7f8c8d", veinColor: "#bdc3c7" },
  { id: "coal",       name: "석탄",       emoji: "⚫", value: 8,      hp: 4,    depth: 1,  weight: 28, rarity: "common",       mainColor: "#2c3e50", veinColor: "#11161d" },
  { id: "copper",     name: "구리",       emoji: "🟠", value: 18,     hp: 6,    depth: 1,  weight: 18, rarity: "uncommon",     mainColor: "#d35400", veinColor: "#ff9f43" },
  { id: "iron",       name: "철광석",     emoji: "🔩", value: 35,     hp: 8,    depth: 1,  weight: 14, rarity: "uncommon",     mainColor: "#95a5a6", veinColor: "#ecf0f1" },
  { id: "silver",     name: "은",         emoji: "🥈", value: 70,     hp: 11,   depth: 2,  weight: 11, rarity: "rare",         mainColor: "#bdc3c7", veinColor: "#ffffff" },
  { id: "gold",       name: "금",         emoji: "🟡", value: 130,    hp: 15,   depth: 2,  weight: 8,  rarity: "rare",         mainColor: "#f39c12", veinColor: "#ffeaa7" },
  { id: "ruby",       name: "루비",       emoji: "♦️", value: 250,    hp: 22,   depth: 3,  weight: 6,  rarity: "epic",         mainColor: "#c0392b", veinColor: "#ff7675" },
  { id: "sapphire",   name: "사파이어",   emoji: "💎", value: 350,    hp: 26,   depth: 3,  weight: 5,  rarity: "epic",         mainColor: "#2980b9", veinColor: "#74b9ff" },
  { id: "emerald",    name: "에메랄드",   emoji: "🟢", value: 550,    hp: 35,   depth: 4,  weight: 4,  rarity: "legendary",    mainColor: "#27ae60", veinColor: "#55efc4" },
  { id: "star",       name: "별의 파편",  emoji: "🌟", value: 1200,   hp: 50,   depth: 5,  weight: 3,  rarity: "mythic",       mainColor: "#f1c40f", veinColor: "#fff200" },
  { id: "obsidian",   name: "흑요석",     emoji: "🖤", value: 2400,   hp: 90,   depth: 6,  weight: 3.5, rarity: "epic",        mainColor: "#3d2c5e", veinColor: "#a29bfe" },
  { id: "mithril",    name: "미스릴",     emoji: "💠", value: 4800,   hp: 160,  depth: 8,  weight: 3.0, rarity: "legendary",   mainColor: "#00cec9", veinColor: "#81ecec" },
  { id: "orichalcum", name: "오리할콘",   emoji: "🔱", value: 9500,   hp: 300,  depth: 10, weight: 2.2, rarity: "legendary",   mainColor: "#e17055", veinColor: "#fab1a0" },
  { id: "adamantium", name: "아다만티움", emoji: "🛡️", value: 19000,  hp: 550,  depth: 12, weight: 1.5, rarity: "mythic",      mainColor: "#00b894", veinColor: "#55efc4" },
  { id: "void_core",  name: "공허의 핵",  emoji: "🌀", value: 38000,  hp: 950,  depth: 14, weight: 1.0, rarity: "mythic",      mainColor: "#6c5ce7", veinColor: "#fd79a8" },
  { id: "aether",     name: "창세의 결정",emoji: "🌌", value: 85000,  hp: 1800, depth: 15, weight: 0.6, rarity: "transcendent",mainColor: "#00ffff", veinColor: "#ffffff" }
];

// ------------------------------------
// 🗺️ 총 15개의 대규모 광산 맵 (지형 질감 팔레트 대폭 고도화)
// ------------------------------------
const ZONES = [
  { name: "초록빛 입구",     depth: 1,  desc: "광부들이 처음 발을 들이는 안전한 갱도",             bg: "#1e2e2a", floorAlt: "#233631", rock: "#3d524a", rockTop: "#526e63", rockShadow: "#14201c", accent: "#63a882", unlock: 1,  hpMult: 1.0,  goldMult: 1.0 },
  { name: "구리빛 동굴",     depth: 2,  desc: "은과 금이 잠들어 있는 따뜻한 동굴",               bg: "#2d2119", floorAlt: "#34261d", rock: "#594030", rockTop: "#755540", rockShadow: "#1f1610", accent: "#e67e22", unlock: 3,  hpMult: 1.4,  goldMult: 1.3 },
  { name: "수정 협곡",       depth: 3,  desc: "푸른 수정이 빛나는 신비한 지대",                   bg: "#172738", floorAlt: "#1c2f42", rock: "#2f4b66", rockTop: "#42678a", rockShadow: "#0e1924", accent: "#00d2ff", unlock: 6,  hpMult: 2.0,  goldMult: 1.7 },
  { name: "잊힌 왕국",       depth: 4,  desc: "고대 에메랄드가 발견되는 폐허",                   bg: "#231e33", floorAlt: "#29233b", rock: "#453b61", rockTop: "#5c4f80", rockShadow: "#15121f", accent: "#a37acb", unlock: 10, hpMult: 3.0,  goldMult: 2.2 },
  { name: "별의 심연",       depth: 5,  desc: "전설 속 별의 파편이 잠든 심부",                   bg: "#1c182e", floorAlt: "#221d38", rock: "#3b315e", rockTop: "#514480", rockShadow: "#100e1c", accent: "#ffd32a", unlock: 14, hpMult: 4.5,  goldMult: 2.8 },
  { name: "용암 화산구",     depth: 6,  desc: "끓어오르는 마그마와 흑요석이 가득한 지옥",         bg: "#2e1414", floorAlt: "#381818", rock: "#5e2727", rockTop: "#803636", rockShadow: "#1a0a0a", accent: "#ff5722", unlock: 18, hpMult: 7.0,  goldMult: 3.6 },
  { name: "얼어붙은 빙하굴", depth: 7,  desc: "만년설과 푸른 얼음 결정으로 뒤덮인 극한 동굴",     bg: "#102838", floorAlt: "#143145", rock: "#24516e", rockTop: "#336f96", rockShadow: "#091821", accent: "#00e5ff", unlock: 22, hpMult: 11.0, goldMult: 4.6 },
  { name: "독안개 늪지대",   depth: 8,  desc: "치명적인 포자와 미스릴 광맥이 숨겨진 지하 늪",     bg: "#172917", floorAlt: "#1c331c", rock: "#315431", rockTop: "#447344", rockShadow: "#0d170d", accent: "#76ff03", unlock: 26, hpMult: 17.0, goldMult: 6.0 },
  { name: "고대 거인의 무덤",depth: 9,  desc: "신화 속 거인들의 유물과 단단한 암반이 잠든 곳",   bg: "#26211a", floorAlt: "#2e281f", rock: "#4f4435", rockTop: "#6b5d48", rockShadow: "#17140f", accent: "#ffab40", unlock: 30, hpMult: 26.0, goldMult: 7.8 },
  { name: "천둥의 협곡",     depth: 10, desc: "끊임없이 벼락이 내리치는 오리할콘의 성지",         bg: "#1b1933", floorAlt: "#211f40", rock: "#393469", rockTop: "#4d478c", rockShadow: "#0f0e1f", accent: "#ffd740", unlock: 35, hpMult: 40.0, goldMult: 10.0 },
  { name: "혈월의 성채",     depth: 11, desc: "붉은 달빛 아래 봉인된 저주받은 광맥 지대",         bg: "#2b111d", floorAlt: "#361524", rock: "#57213a", rockTop: "#752e4f", rockShadow: "#1a0911", accent: "#ff1744", unlock: 40, hpMult: 60.0, goldMult: 13.0 },
  { name: "기계문명 유적",   depth: 12, desc: "초고대 금속 아다만티움이 보관된 지하 유적",       bg: "#192426", floorAlt: "#1f2d30", rock: "#33494d", rockTop: "#466369", rockShadow: "#0e1517", accent: "#1de9b6", unlock: 46, hpMult: 90.0, goldMult: 17.0 },
  { name: "뒤틀린 차원 틈",  depth: 13, desc: "시공간이 일그러져 기이한 광물이 생성되는 공간",     bg: "#21122e", floorAlt: "#291638", rock: "#44235e", rockTop: "#5c3080", rockShadow: "#130a1c", accent: "#d500f9", unlock: 52, hpMult: 140.0, goldMult: 22.0 },
  { name: "공허의 심연",     depth: 14, desc: "빛조차 삼켜버리는 칠흑 같은 어둠의 끝",           bg: "#101018", floorAlt: "#151521", rock: "#252538", rockTop: "#363652", rockShadow: "#07070c", accent: "#7c4dff", unlock: 60, hpMult: 220.0, goldMult: 30.0 },
  { name: "창세의 신전",     depth: 15, desc: "우주의 시작과 창세의 결정이 잠든 최종 성역",     bg: "#241e12", floorAlt: "#2e2617", rock: "#524327", rockTop: "#735e37", rockShadow: "#141009", accent: "#00ffff", unlock: 70, hpMult: 350.0, goldMult: 45.0 }
];

const MINER_TYPES = [
  { id: "novice", name: "수습 광부", emoji: "👷‍♂️", cost: 150, power: 4, speed: 1.0, color: "#73d39b", hatColor: "#f1c40f", bodyColor: "#2980b9", desc: "기본적인 광석 채굴 보조" },
  { id: "experienced", name: "베테랑 광부", emoji: "⛏️", cost: 600, power: 15, speed: 1.3, color: "#f6d48c", hatColor: "#e67e22", bodyColor: "#d35400", desc: "단단한 광석도 빠르게 채굴" },
  { id: "expert", name: "마스터 광부", emoji: "👨‍🏭", cost: 2500, power: 55, speed: 1.6, color: "#c18af2", hatColor: "#9b59b6", bodyColor: "#34495e", desc: "높은 채굴력과 탐사 능력 보유" },
  { id: "robot", name: "사이보그 드론", emoji: "🤖", cost: 12000, power: 220, speed: 2.2, color: "#ff718a", hatColor: "#ff4757", bodyColor: "#7f8c8d", desc: "자동 채굴장의 최첨단 채굴기" }
];

let currentUsername = null;
const defaultPlayer = () => ({
  x: WORLD_W * TILE / 2,
  y: WORLD_H * TILE / 2,
  hp: 100,
  maxHp: 100,
  level: 1,
  exp: 0,
  gold: 0,
  power: 10,
  speed: 1,
  toolLevel: 0,
  jobId: "apprentice",
  lampRadius: 230, // 시야 반경을 넓혀 어둡고 답답한 화면을 밝고 선명하게 개편
  miners: { novice: 0, experienced: 0, expert: 0, robot: 0 },
  autoSellEnabled: true,
  autoSellInterval: 5,
  autoSellMaxRarity: "epic"
});

let player = defaultPlayer();
let inventory = {};
let discovered = new Set();
let selectedZone = 0;

let autoSellTimer = 0;

function getJobData(jobId) {
  return JOBS.find(j => j.id === (jobId || "apprentice")) || JOBS[0];
}

const companionPet = {
  x: WORLD_W * TILE / 2,
  y: WORLD_H * TILE / 2,
  targetX: WORLD_W * TILE / 2,
  targetY: WORLD_H * TILE / 2,
  timer: 0,
  interval: 10,
  floatAnim: 0,
  auraAnim: 0
};

const activeKeys = new Set();
const held = { up: false, down: false, left: false, right: false };

let map = [];
let mapDecos = []; // 바닥의 작은 자갈, 버섯, 풀, 균열 디테일
let ores = [];
let particles = [];
let floatingTexts = [];
let autoMinersList = [];
let camera = { x: 0, y: 0 };
let last = performance.now();
let mineTarget = null;
let toastTimer = null;
let sound = true;
let audioCtx = null;
let lastSave = 0;
let swingAnim = 0;
let walkAnim = 0;
let facing = 1; // 1: 오른쪽, -1: 왼쪽

function rand(a, b) { return Math.random() * (b - a) + a; }

function weighted(list) {
  let total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) {
    r -= x.weight;
    if (r <= 0) return x;
  }
  return list[0];
}

function zone() { return ZONES[selectedZone]; }
function rarity(id) { return RARITIES.find(r => r.id === id) || RARITIES[0]; }

function log(msg, kind = "common") {
  const el = document.createElement("p");
  el.className = kind;
  el.textContent = msg;
  const list = $("logList");
  list.prepend(el);
  while (list.children.length > 8) list.lastChild.remove();
}

function toast(msg) {
  const el = $("centerMessage");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 1800);
}

function playSound(type) {
  if (!sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "hit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "break") {
      osc.type = "square";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "levelup" || type === "sell" || type === "jobChange") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "petSkill") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "forgeSuccess") {
      osc.type = "square";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {}
}

// ------------------------------------
// 로그인 & 데이터 저장
// ------------------------------------
let firebaseAuth = null;
let firestore = null;
let currentFirebaseUser = null;
let cloudSaveTimer = null;
let cloudSaveQueue = Promise.resolve();

function getSaveData() {
  return {
    player,
    inventory,
    discovered: [...discovered],
    selectedZone
  };
}

function applySaveData(saveData = {}) {
  if (saveData) {
    player = Object.assign(defaultPlayer(), saveData.player || {});
    player.miners = saveData.player?.miners || { novice: 0, experienced: 0, expert: 0, robot: 0 };
    player.jobId = saveData.player?.jobId || "apprentice";
    player.lampRadius = Math.max(230, saveData.player?.lampRadius || 230);
    inventory = saveData.inventory || {};
    discovered = new Set(saveData.saveData?.discovered || saveData.discovered || []);
    selectedZone = Math.min(saveData.selectedZone || 0, ZONES.length - 1);
  } else {
    player = defaultPlayer();
    inventory = {};
    discovered = new Set();
    selectedZone = 0;
  }
}

function showAuthMessage(message, type = "error") {
  const messageElement = $("authMessage");
  messageElement.textContent = message;
  messageElement.className = `auth-msg ${type}`;
}

function getFirebaseErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "이메일 주소 형식이 올바르지 않습니다.",
    "auth/user-not-found": "등록되지 않은 이메일입니다.",
    "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
    "auth/invalid-credential": "이메일 또는 비밀번호를 확인해 주세요.",
    "auth/email-already-in-use": "이미 가입된 이메일입니다. 로그인해 주세요.",
    "auth/weak-password": "비밀번호는 6자 이상으로 입력해 주세요.",
    "auth/operation-not-allowed": "Firebase Console에서 해당 로그인 제공업체를 사용 설정해 주세요.",
    "auth/popup-blocked": "팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.",
    "auth/popup-closed-by-user": "로그인 창이 닫혔습니다.",
    "auth/unauthorized-domain": "Firebase Authentication의 승인 도메인에 현재 사이트를 추가해 주세요.",
    "permission-denied": "Firestore 접근이 거부되었습니다. firestore.rules를 게시했는지 확인해 주세요.",
    "unavailable": "저장 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요."
  };
  const code = error?.code || "unknown";
  return messages[code] || `로그인 또는 저장에 실패했습니다 (${code}). Firebase 설정을 확인해 주세요.`;
}

function localSaveKey(user) {
  return `deepMineSave_${user.uid}`;
}

function readLocalSave(user) {
  try {
    const cached = localStorage.getItem(localSaveKey(user));
    if (cached) return JSON.parse(cached);

    const legacyUsers = JSON.parse(localStorage.getItem("deepMineUsers") || "{}");
    return legacyUsers[user.email]?.saveData || null;
  } catch (error) {
    console.error("로컬 저장 데이터 읽기 실패:", error);
    showAuthMessage("이 브라우저의 이전 저장 데이터를 읽지 못했습니다. 클라우드 저장을 확인합니다.");
    return null;
  }
}

function removeLegacyPassword(email) {
  if (!email) return;
  try {
    const legacyUsers = JSON.parse(localStorage.getItem("deepMineUsers") || "{}");
    const legacyUser = legacyUsers[email];
    if (legacyUser && Object.prototype.hasOwnProperty.call(legacyUser, "password")) {
      delete legacyUser.password;
      localStorage.setItem("deepMineUsers", JSON.stringify(legacyUsers));
    }
  } catch (error) {
    console.error("이전 비밀번호 정보 정리 실패:", error);
    showAuthMessage("이전 계정 정보 정리에 실패했습니다. 브라우저 저장 데이터를 확인해 주세요.");
  }
}

function cacheSave(user, saveData) {
  try {
    localStorage.setItem(localSaveKey(user), JSON.stringify(saveData));
  } catch (error) {
    console.error("로컬 임시 저장 실패:", error);
    showAuthMessage("브라우저 임시 저장에 실패했습니다. 인터넷 연결과 저장 공간을 확인해 주세요.");
  }
}

function persistCloudSave(user, saveData) {
  if (!firestore) return Promise.reject(new Error("Firestore is not initialized."));

  const write = () => firestore.collection("users").doc(user.uid).set({
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    createdAt: user.metadata?.creationTime || null,
    saveData,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  cloudSaveQueue = cloudSaveQueue.catch(() => {}).then(write);
  return cloudSaveQueue.catch(error => {
    console.error("클라우드 저장 실패:", error);
    showAuthMessage(getFirebaseErrorMessage(error));
    throw error;
  });
}

function save(immediate = false) {
  if (!currentFirebaseUser || !currentUsername) return;
  const user = currentFirebaseUser;
  const saveData = getSaveData();
  cacheSave(user, saveData);

  clearTimeout(cloudSaveTimer);
  if (immediate) {
    persistCloudSave(user, saveData).catch(() => {});
    return;
  }
  cloudSaveTimer = setTimeout(() => {
    persistCloudSave(user, saveData).catch(() => {});
  }, 800);
}

async function flushCloudSave() {
  if (!currentFirebaseUser || !currentUsername) return;
  clearTimeout(cloudSaveTimer);
  const user = currentFirebaseUser;
  const saveData = getSaveData();
  cacheSave(user, saveData);
  await persistCloudSave(user, saveData);
}

async function loadCloudUserSave(user) {
  showAuthMessage("계정 저장 데이터를 불러오는 중...", "success");
  const userDocument = firestore.collection("users").doc(user.uid);
  const snapshot = await userDocument.get();
  if (firebaseAuth.currentUser?.uid !== user.uid) return;
  const remoteData = snapshot.exists ? snapshot.data().saveData : null;
  const saveData = remoteData || readLocalSave(user) || {
    player: defaultPlayer(),
    inventory: {},
    discovered: [],
    selectedZone: 0
  };

  applySaveData(saveData);
  currentFirebaseUser = user;
  currentUsername = user.email || user.uid;
  companionPet.x = player.x + 30;
  companionPet.y = player.y - 30;

  const displayName = user.displayName || currentUsername.split("@")[0];
  $("playerName").textContent = displayName;
  $("userAccountDisplay").textContent = "👤 " + displayName;
  $("logoutBtn").style.display = "inline-block";
  $("loginModal").classList.add("hidden");

  makeMap();
  initAutoMiners();
  updateUI();
  cacheSave(user, saveData);
  showAuthMessage("", "success");
  removeLegacyPassword(user.email);
  log(`'${displayName}' 님의 광산 기록을 불러왔습니다.`, "uncommon");
  toast(`환영합니다, ${displayName} 광부님!`);

  if (!snapshot.exists) {
    try {
      await persistCloudSave(user, saveData);
    } catch (error) {
      console.error("첫 클라우드 저장 실패:", error);
    }
  }
}

function initFirebaseAuth() {
  const config = window.DEEP_MINE_FIREBASE_CONFIG;
  const requiredConfig = ["apiKey", "authDomain", "projectId", "appId"];
  if (!window.firebase || !config || requiredConfig.some(key => !config[key] || config[key].startsWith("YOUR_"))) {
    showAuthMessage("Firebase 설정이 아직 비어 있습니다. console.firebase.google.com에서 웹 앱 설정을 복사해 deep-mine/firebase-config.js에 입력해 주세요.");
    return;
  }

  firebase.initializeApp(config);
  firebaseAuth = firebase.auth();
  firestore = firebase.firestore();

  firebaseAuth.onAuthStateChanged(user => {
    if (!user) {
      currentFirebaseUser = null;
      currentUsername = null;
      $("userAccountDisplay").textContent = "로그인 필요";
      $("logoutBtn").style.display = "none";
      $("loginModal").classList.remove("hidden");
      return;
    }

    currentFirebaseUser = user;
    loadCloudUserSave(user).catch(error => {
      console.error("계정 데이터 불러오기 실패:", error);
      currentUsername = null;
      $("loginModal").classList.remove("hidden");
      $("logoutBtn").style.display = "inline-block";
      showAuthMessage(getFirebaseErrorMessage(error));
    });
  });
}

$("googleSignInBtn").onclick = async () => {
  if (!firebaseAuth) {
    showAuthMessage("먼저 Firebase Console 웹 앱 설정을 deep-mine/firebase-config.js에 입력해 주세요.");
    return;
  }
  try {
    if (currentFirebaseUser) {
      await loadCloudUserSave(currentFirebaseUser);
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebaseAuth.signInWithPopup(provider);
  } catch (error) {
    console.error("Google 로그인 실패:", error);
    showAuthMessage(getFirebaseErrorMessage(error));
  }
};

$("tabLoginBtn").onclick = () => {
  $("tabLoginBtn").classList.add("active");
  $("tabRegisterBtn").classList.remove("active");
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  showAuthMessage("");
};

$("tabRegisterBtn").onclick = () => {
  $("tabRegisterBtn").classList.add("active");
  $("tabLoginBtn").classList.remove("active");
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  showAuthMessage("");
};

$("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!firebaseAuth) {
    showAuthMessage("먼저 Firebase Console 웹 앱 설정을 deep-mine/firebase-config.js에 입력해 주세요.");
    return;
  }
  try {
    await firebaseAuth.signInWithEmailAndPassword(
      $("loginUsername").value.trim(),
      $("loginPassword").value
    );
  } catch (error) {
    console.error("이메일 로그인 실패:", error);
    showAuthMessage(getFirebaseErrorMessage(error));
  }
};

$("registerForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!firebaseAuth) {
    showAuthMessage("먼저 Firebase Console 웹 앱 설정을 deep-mine/firebase-config.js에 입력해 주세요.");
    return;
  }
  try {
    await firebaseAuth.createUserWithEmailAndPassword(
      $("regUsername").value.trim(),
      $("regPassword").value
    );
  } catch (error) {
    console.error("이메일 회원가입 실패:", error);
    showAuthMessage(getFirebaseErrorMessage(error));
  }
};

$("logoutBtn").onclick = async () => {
  if (!firebaseAuth) return;
  try {
    await flushCloudSave();
    await firebaseAuth.signOut();
    toast("로그아웃 되었습니다.");
  } catch (error) {
    console.error("로그아웃 전 저장 실패:", error);
  }
};

// ------------------------------------
// 맵 & 자연스러운 바위 군집, 장식물 생성
// ------------------------------------
function makeMap() {
  map = [];
  mapDecos = [];
  ores = [];
  const centerX = Math.floor(WORLD_W / 2);
  const centerY = Math.floor(WORLD_H / 2);

  for (let y = 0; y < WORLD_H; y++) {
    map[y] = [];
    mapDecos[y] = [];
    for (let x = 0; x < WORLD_W; x++) {
      const isEdge = x <= 1 || y <= 1 || x >= WORLD_W - 2 || y >= WORLD_H - 2;
      const distCenter = Math.hypot(x - centerX, y - centerY);
      const v = Math.random();

      // 스폰 중앙 주변은 넓고 쾌적하게 개방
      if (distCenter < 3.5) {
        map[y][x] = "floor";
      } else if (isEdge) {
        map[y][x] = "wall";
      } else if (v < 0.13) {
        map[y][x] = "wall";
      } else if (v < 0.17) {
        map[y][x] = "crack";
      } else {
        map[y][x] = "floor";
        if (Math.random() < 0.25) {
          spawnOre(x, y);
        } else if (Math.random() < 0.25) {
          // 바닥 장식물 (작은 조약돌, 빛나는 버섯, 이끼 등)
          mapDecos[y][x] = Math.floor(rand(1, 4));
        }
      }
    }
  }
}

function spawnOre(tx, ty) {
  const z = zone();
  const pool = ORES.filter(o => o.depth <= z.depth && o.depth >= Math.max(1, z.depth - 5));
  const def = weighted(pool.length > 0 ? pool : ORES.filter(o => o.depth <= z.depth));
  const scaledHp = Math.ceil(def.hp * z.hpMult);

  ores.push({
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
    tx, ty,
    def,
    hp: scaledHp,
    maxHp: scaledHp,
    seed: Math.random() * 10
  });
}

function initAutoMiners() {
  autoMinersList = [];
  if (!player.miners) return;

  MINER_TYPES.forEach(type => {
    const count = player.miners[type.id] || 0;
    for (let i = 0; i < count; i++) {
      autoMinersList.push({
        type: type,
        x: player.x + rand(-80, 80),
        y: player.y + rand(-80, 80),
        targetOre: null,
        swingAnim: rand(0, 10),
        facing: 1
      });
    }
  });
}

function getTotalMinersCount() {
  if (!player.miners) return 0;
  return Object.values(player.miners).reduce((a, b) => a + b, 0);
}

function tileAt(x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return map[ty]?.[tx] || "wall";
}

function blocked(x, y) {
  const r = 11;
  return [
    [-r, -r], [r, -r], [-r, r], [r, r]
  ].some(([dx, dy]) => tileAt(x + dx, y + dy) === "wall");
}

function dropOre(o, minerName = null) {
  const job = getJobData(player.jobId);
  const z = zone();
  const base = o.def.value;
  const rar = rarity(o.def.rarity);
  const qty = Math.random() < 0.15 ? 2 : 1;
  
  const goldEarned = Math.floor(base * z.goldMult * qty * job.buffs.goldBonus);
  const expEarned = Math.max(4, Math.floor(base * 0.22 * Math.sqrt(z.goldMult) * job.buffs.expBonus));

  inventory[o.def.id] = (inventory[o.def.id] || 0) + qty;
  player.gold += goldEarned;
  player.exp += expEarned;
  discovered.add(o.def.id);

  $("discoverName").textContent = o.def.emoji + " " + o.def.name;
  $("discoverText").textContent = rar.name + " 등급 · 기본 가치 " + base.toLocaleString() + " G";

  if (minerName) {
    log(`[${minerName}] ${o.def.emoji} ${o.def.name} 채굴! (+${goldEarned.toLocaleString()}G)`, rar.id);
  } else {
    log(`${o.def.emoji} ${o.def.name} x${qty} (+${goldEarned.toLocaleString()}G)`, rar.id);
    playSound("break");
  }

  if (["legendary", "mythic", "transcendent"].includes(rar.id)) {
    toast(`✨ ${rar.name} 광물 발견! [${o.def.name}]`);
  }

  floatingTexts.push({
    x: o.x, y: o.y - 12,
    text: `+${goldEarned.toLocaleString()}G`,
    color: "#f5c66b",
    t: 0
  });

  for (let i = 0; i < 14; i++) {
    particles.push({
      x: o.x, y: o.y,
      vx: rand(-75, 75), vy: rand(-75, 75),
      color: i % 2 === 0 ? o.def.veinColor : rar.color,
      size: rand(3, 6),
      life: rand(0.35, 0.7),
      t: 0
    });
  }

  checkLevel();
  updateUI();

  setTimeout(() => {
    if (tileAt(o.x, o.y) !== "wall") {
      spawnOre(o.tx, o.ty);
    }
  }, rand(9000, 16000));
}

function checkLevel() {
  const need = Math.floor(30 + Math.pow(player.level, 1.45) * 25);
  while (player.exp >= need) {
    player.exp -= need;
    player.level++;
    player.power += 5 + Math.floor(player.level * 1.5);
    player.maxHp += 15;
    player.hp = player.maxHp;
    toast(`🎉 LEVEL UP! LV.${player.level} 달성!`);
    log("레벨 상승! LV." + player.level + " 달성 (기본 채굴력 대폭 증가)", "rare");
    playSound("levelup");
  }
}

// ------------------------------------
// 🧚‍♂️ 요정 펫 AI & 보물 선물 스킬
// ------------------------------------
function updateCompanionPet(dt) {
  if (!currentUsername) return;

  companionPet.floatAnim += dt * 3;
  companionPet.auraAnim += dt * 5;

  const offsetAngle = Math.sin(companionPet.floatAnim) * 0.5;
  const targetX = player.x - facing * 28 + Math.cos(offsetAngle) * 12;
  const targetY = player.y - 32 + Math.sin(companionPet.floatAnim * 1.5) * 8;

  companionPet.x += (targetX - companionPet.x) * 0.08;
  companionPet.y += (targetY - companionPet.y) * 0.08;

  const job = getJobData(player.jobId);
  const effectiveInterval = companionPet.interval / job.buffs.petSpeedMult;

  companionPet.timer += dt;
  if (companionPet.timer >= effectiveInterval) {
    companionPet.timer = 0;
    triggerPetGiftSkill();
  }
}

function triggerPetGiftSkill() {
  const z = zone();
  const giftPool = ORES.filter(o => o.depth <= z.depth && ["uncommon", "rare", "epic", "legendary", "mythic"].includes(o.rarity));
  const gift = choice(giftPool.length > 0 ? giftPool : ORES);
  const qty = rand(1, 3) > 2 ? 2 : 1;

  inventory[gift.id] = (inventory[gift.id] || 0) + qty;
  discovered.add(gift.id);

  playSound("petSkill");
  toast(`🧚‍♂️ 펫의 보물 발굴! [${gift.emoji} ${gift.name} x${qty}] 획득!`);
  log(`🧚‍♂️ [요정 펫 선물] ${gift.emoji} ${gift.name} x${qty} 를 발굴했습니다!`, rarity(gift.rarity).id);

  const px = companionPet.x;
  const py = companionPet.y;

  floatingTexts.push({
    x: px, y: py - 20,
    text: `✨ ${gift.emoji} +${qty}`,
    color: rarity(gift.rarity).color,
    t: 0
  });

  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i;
    const speed = rand(60, 140);
    particles.push({
      x: px, y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: i % 2 === 0 ? "#c18af2" : "#f5c66b",
      size: rand(4, 7),
      life: rand(0.5, 0.9),
      t: 0
    });
  }

  updateUI();
}

// ------------------------------------
// 💡 주기적 자동 광물 판매 로직
// ------------------------------------
const RARITY_ORDER = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6, transcendent: 7 };

function processAutoSell(dt) {
  if (!player.autoSellEnabled) return;

  autoSellTimer += dt;
  if (autoSellTimer >= player.autoSellInterval) {
    autoSellTimer = 0;
    executeAutoSell();
  }
}

function executeAutoSell() {
  let totalGain = 0;
  let soldItemCount = 0;
  const maxRarityRank = RARITY_ORDER[player.autoSellMaxRarity || "epic"] || 4;
  const job = getJobData(player.jobId);

  for (const oreDef of ORES) {
    const oreRarityRank = RARITY_ORDER[oreDef.rarity] || 1;
    const count = inventory[oreDef.id] || 0;

    if (count > 0 && oreRarityRank <= maxRarityRank) {
      const earn = Math.floor(count * oreDef.value * job.buffs.goldBonus);
      totalGain += earn;
      soldItemCount += count;
      inventory[oreDef.id] = 0;
    }
  }

  if (totalGain > 0) {
    player.gold += totalGain;
    playSound("sell");
    toast(`💰 자동 정산: +${totalGain.toLocaleString()} Gold (${soldItemCount}개 판매)`);
    log(`🤖 [자동 정산] 광물 ${soldItemCount}개 자동 판매 완료 (+${totalGain.toLocaleString()}G)`, "uncommon");
    updateUI();

    floatingTexts.push({
      x: player.x, y: player.y - 35,
      text: `+${totalGain.toLocaleString()}G`,
      color: "#73d39b",
      t: 0
    });
  }
}

function manualSellAll() {
  let totalGain = 0;
  let soldItemCount = 0;
  const job = getJobData(player.jobId);

  for (const oreDef of ORES) {
    const count = inventory[oreDef.id] || 0;
    if (count > 0) {
      totalGain += Math.floor(count * oreDef.value * job.buffs.goldBonus);
      soldItemCount += count;
      inventory[oreDef.id] = 0;
    }
  }

  if (totalGain > 0) {
    player.gold += totalGain;
    playSound("sell");
    toast(`💰 전체 판매 완료: +${totalGain.toLocaleString()} Gold`);
    log(`💰 인벤토리의 모든 광물을 일괄 판매했습니다. (+${totalGain.toLocaleString()}G)`, "rare");
    updateUI();
  } else {
    toast("판매할 광물이 없습니다.");
  }
}

// ------------------------------------
// WASD 키보드 이동 로직
// ------------------------------------
function move(dt) {
  if (!currentUsername) return;

  let dx = 0, dy = 0;

  const isUp = activeKeys.has("KeyW") || activeKeys.has("w") || activeKeys.has("W") || activeKeys.has("ArrowUp") || held.up;
  const isDown = activeKeys.has("KeyS") || activeKeys.has("s") || activeKeys.has("S") || activeKeys.has("ArrowDown") || held.down;
  const isLeft = activeKeys.has("KeyA") || activeKeys.has("a") || activeKeys.has("A") || activeKeys.has("ArrowLeft") || held.left;
  const isRight = activeKeys.has("KeyD") || activeKeys.has("d") || activeKeys.has("D") || activeKeys.has("ArrowRight") || held.right;

  if (isUp) dy--;
  if (isDown) dy++;
  if (isLeft) dx--;
  if (isRight) dx++;

  if (dx !== 0 || dy !== 0) {
    if (dx < 0) facing = -1;
    if (dx > 0) facing = 1;

    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const isSprint = activeKeys.has("ShiftLeft") || activeKeys.has("ShiftRight") || activeKeys.has("Shift");
    const tier = getToolTier(player.toolLevel);
    const job = getJobData(player.jobId);
    const speed = Math.min(480, 155 * tier.speedBonus * job.buffs.speedMult) * (isSprint ? 1.45 : 1) * dt;

    walkAnim += dt * (isSprint ? 18 : 12);

    if (!blocked(player.x + dx * speed, player.y)) player.x += dx * speed;
    if (!blocked(player.x, player.y + dy * speed)) player.y += dy * speed;
  } else {
    walkAnim = 0;
  }
}

function mine(dt) {
  let nearest = null;
  let dist = 9999;
  for (const o of ores) {
    const d = Math.hypot(o.x - player.x, o.y - player.y);
    if (d < dist) {
      dist = d;
      nearest = o;
    }
  }

  if (nearest && dist < 72) {
    mineTarget = nearest;
    if (nearest.x < player.x) facing = -1;
    else facing = 1;

    swingAnim += dt * 15;
    const job = getJobData(player.jobId);
    const tier = getToolTier(player.toolLevel);
    const totalPower = (player.power + tier.powerBonus) * job.buffs.powerMult;

    mineTarget.hp -= dt * totalPower * player.speed;

    if (Math.random() < dt * 8) {
      playSound("hit");
      particles.push({
        x: (player.x + mineTarget.x) / 2,
        y: (player.y + mineTarget.y) / 2,
        vx: rand(-55, 55), vy: rand(-55, 55),
        color: tier.headColor, size: rand(3, 5),
        life: 0.25, t: 0
      });
    }

    if (mineTarget.hp <= 0) {
      ores = ores.filter(o => o !== mineTarget);
      dropOre(mineTarget);
      mineTarget = null;
    }
  } else {
    mineTarget = null;
    swingAnim = 0;
  }

  updateAutoMiners(dt);
  updateCompanionPet(dt);
  processAutoSell(dt);
}

function updateAutoMiners(dt) {
  if (autoMinersList.length === 0 || ores.length === 0) return;

  const job = getJobData(player.jobId);

  autoMinersList.forEach(m => {
    if (!m.targetOre || !ores.includes(m.targetOre)) {
      m.targetOre = choice(ores);
    }

    if (m.targetOre) {
      const dx = m.targetOre.x - m.x;
      const dy = m.targetOre.y - m.y;
      const dist = Math.hypot(dx, dy);

      if (dx < -2) m.facing = -1;
      if (dx > 2) m.facing = 1;

      if (dist > 48) {
        m.x += (dx / dist) * 115 * m.type.speed * dt;
        m.y += (dy / dist) * 115 * m.type.speed * dt;
      } else {
        m.swingAnim += dt * 11 * m.type.speed;
        const sharedPower = m.type.power * (1 + (job.buffs.powerMult - 1) * 0.5 + player.toolLevel * 0.15);
        m.targetOre.hp -= dt * sharedPower;

        if (m.targetOre.hp <= 0) {
          const broken = m.targetOre;
          ores = ores.filter(o => o !== broken);
          dropOre(broken, m.type.name);
          m.targetOre = null;
        }
      }
    }
  });
}

function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ------------------------------------
// 🎨 고퀄리티 픽셀 아트 캔버스 드로잉 엔진
// ------------------------------------
function drawWorld() {
  const startX = Math.max(0, Math.floor(camera.x / TILE));
  const endX = Math.min(WORLD_W, Math.ceil((camera.x + W) / TILE) + 1);
  const startY = Math.max(0, Math.floor(camera.y / TILE));
  const endY = Math.min(WORLD_H, Math.ceil((camera.y + H) / TILE) + 1);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      drawPixelTile(x * TILE - camera.x, y * TILE - camera.y, map[y][x], x, y);
    }
  }

  // 광석 바위 덩어리(Ore Node) 고퀄리티 픽셀 렌더링
  for (const o of ores) {
    const x = o.x - camera.x;
    const y = o.y - camera.y;
    if (x < -50 || y < -50 || x > W + 50 || y > H + 50) continue;

    drawOreNode(x, y, o);
  }

  // 고용 광부 NPC 고퀄리티 도트 렌더링
  autoMinersList.forEach(m => {
    const mx = m.x - camera.x;
    const my = m.y - camera.y;
    if (mx < -50 || my < -50 || mx > W + 50 || my > H + 50) return;

    drawMinerSprite(mx, my, m.type.bodyColor, m.type.hatColor, m.type.color, m.swingAnim, m.facing, `${m.type.emoji} ${m.type.name}`, m.type.color, null);
  });
}

// 입체감 있는 지형 타일 & 바닥 장식 렌더링
function drawPixelTile(x, y, kind, tx, ty) {
  const z = zone();

  // 기본 바닥 타일 (체스판 미세 음영 + 질감)
  ctx.fillStyle = (tx + ty) % 2 === 0 ? z.bg : z.floorAlt;
  ctx.fillRect(x, y, TILE, TILE);

  // 바닥 미세 자갈/균열 패턴
  if ((tx * 13 + ty * 7) % 4 === 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(x + 8, y + 10, 4, 3);
    ctx.fillRect(x + 26, y + 28, 5, 3);
  }

  if (kind === "wall") {
    // 입체 3D 느낌의 단단한 암벽 블록
    ctx.fillStyle = z.rockShadow;
    ctx.fillRect(x + 2, y + 4, TILE - 2, TILE - 2);

    ctx.fillStyle = z.rock;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 6);

    // 윗면 하이라이트 (입체 단차)
    ctx.fillStyle = z.rockTop;
    ctx.fillRect(x + 2, y + 2, TILE - 4, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.fillRect(x + 3, y + 3, TILE - 6, 3);

    // 암벽 내 박힌 광맥 반짝임 포인트
    if ((tx * 7 + ty * 3) % 3 === 0) {
      ctx.fillStyle = z.accent;
      ctx.fillRect(x + 10, y + 16, 6, 4);
      ctx.fillRect(x + 24, y + 22, 5, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 11, y + 17, 2, 2);
    }
  } else if (kind === "crack") {
    // 바닥 균열 & 용암/수정 틈새
    ctx.fillStyle = z.rockShadow;
    ctx.fillRect(x + 6, y + 12, TILE - 12, 4);
    ctx.fillRect(x + 14, y + 8, 4, TILE - 16);
    ctx.fillStyle = z.accent + "55";
    ctx.fillRect(x + 12, y + 13, 12, 2);
  } else {
    // 일반 바닥 장식물 (작은 돌무더기, 발광 버섯 등)
    const deco = mapDecos[ty]?.[tx];
    if (deco === 1) {
      ctx.fillStyle = z.rock;
      ctx.fillRect(x + 10, y + 24, 7, 5);
      ctx.fillStyle = z.rockTop;
      ctx.fillRect(x + 11, y + 24, 5, 2);
    } else if (deco === 2) {
      // 작은 지하 발광 버섯
      ctx.fillStyle = "#dcdde1";
      ctx.fillRect(x + 22, y + 24, 3, 5);
      ctx.fillStyle = z.accent;
      ctx.fillRect(x + 19, y + 20, 9, 4);
    }
  }
}

// 정교한 다각형 바위 + 박혀있는 보석 결정체 광석 렌더링 (흰 네모 박스 완전 제거!)
function drawOreNode(x, y, o) {
  const rar = rarity(o.def.rarity);
  const isTarget = (o === mineTarget);

  // 1. 바위 바닥 그림자
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y + 13, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 다각형 짙은 암석 바위 몸체 (입체 계단형 도트)
  ctx.fillStyle = "#2b323b";
  ctx.fillRect(x - 13, y - 4, 26, 16);
  ctx.fillRect(x - 10, y - 10, 20, 22);

  // 바위 윗면 밝은 암석 하이라이트
  ctx.fillStyle = "#485460";
  ctx.fillRect(x - 9, y - 9, 18, 8);
  ctx.fillRect(x - 12, y - 3, 10, 6);

  // 3. 바위 표면에 박혀있는 영롱한 광석/보석 결정체들
  ctx.fillStyle = o.def.mainColor;
  ctx.fillRect(x - 8, y - 6, 6, 6);
  ctx.fillRect(x + 3, y - 3, 7, 6);
  ctx.fillRect(x - 3, y + 3, 6, 5);

  // 보석 결정체 반짝임 하이라이트
  ctx.fillStyle = o.def.veinColor;
  ctx.fillRect(x - 7, y - 5, 3, 3);
  ctx.fillRect(x + 4, y - 2, 3, 3);
  ctx.fillRect(x - 2, y + 4, 2, 2);

  // 고등급 광물 오라 광채
  if (["epic", "legendary", "mythic", "transcendent"].includes(o.def.rarity)) {
    ctx.save();
    ctx.strokeStyle = rar.color + "88";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 16 + Math.sin(performance.now() * 0.005 + o.seed) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 광물 이름/이모지 뱃지 (채굴 타겟이거나 고급 등급일 때 표시)
  if (isTarget || ["legendary", "mythic", "transcendent"].includes(o.def.rarity)) {
    ctx.font = "13px serif";
    ctx.textAlign = "center";
    ctx.fillText(o.def.emoji, x, y - 15);
  }

  // 현재 채굴 중인 타겟 표시 & 체력바
  if (isTarget) {
    ctx.strokeStyle = "#f5c66b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 16, y - 13, 32, 28);

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(x - 16, y - 34, 32, 6);
    ctx.fillStyle = "#73d39b";
    ctx.fillRect(x - 15, y - 33, 30 * Math.max(0, o.hp / o.maxHp), 4);
  }
}

// 플레이어 및 광부 NPC 정교한 도트 캐릭터 스프라이트 렌더러
function drawMinerSprite(x, y, bodyColor, hatColor, toolHeadColor, swing, dir, labelText, labelColor, tierData) {
  const bob = Math.abs(Math.sin(walkAnim)) * 2;

  // 바닥 그림자
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y - bob);

  // 다리 (걷기 애니메이션)
  const legOffset = Math.sin(walkAnim) * 3;
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(-6, 8 + legOffset, 4, 6);
  ctx.fillRect(2, 8 - legOffset, 4, 6);

  // 몸통 (작업복 + 멜빵/벨트 디테일)
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-8, -2, 16, 11);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(-8, 6, 16, 3); // 벨트
  ctx.fillStyle = "#f5c66b";
  ctx.fillRect(-2, 6, 4, 3); // 벨트 버클

  // 얼굴
  ctx.fillStyle = "#ffdbac";
  ctx.fillRect(-7, -13, 14, 11);

  // 눈 (바라보는 방향에 따라 시선 이동)
  ctx.fillStyle = "#1e272e";
  if (dir === 1) {
    ctx.fillRect(-1, -9, 2, 3);
    ctx.fillRect(4, -9, 2, 3);
  } else {
    ctx.fillRect(-6, -9, 2, 3);
    ctx.fillRect(-1, -9, 2, 3);
  }

  // 안전모 (광부 헬멧 + 전조등 랜턴)
  ctx.fillStyle = hatColor;
  ctx.fillRect(-9, -17, 18, 5);
  ctx.fillRect(-6, -20, 12, 3);
  // 헬멧 전조등 (반짝이는 불빛)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(dir === 1 ? 4 : -7, -16, 3, 3);

  // 곡괭이 무기 렌더링
  ctx.save();
  ctx.translate(dir * 7, 1);
  const baseAngle = dir === 1 ? 0.3 : -0.3;
  const swingAngle = swing ? Math.sin(swing) * 0.9 * dir : baseAngle;
  ctx.rotate(swingAngle);

  if (tierData && tierData.auraColor) {
    ctx.shadowColor = tierData.auraColor;
    ctx.shadowBlur = 14;
  }

  // 자루
  ctx.fillStyle = tierData ? tierData.handleColor : "#7f8c8d";
  ctx.fillRect(-2, -14, 4, 18);

  // 곡괭이 날 (양날 곡선 픽셀 아트)
  ctx.fillStyle = toolHeadColor;
  ctx.fillRect(-10, -16, 20, 4);
  ctx.fillRect(-8, -18, 16, 2);
  ctx.fillRect(-11, -14, 3, 2);
  ctx.fillRect(8, -14, 3, 2);

  ctx.restore();
  ctx.restore();

  // 캐릭터 이름표
  if (labelText) {
    ctx.fillStyle = "rgba(10, 15, 22, 0.7)";
    ctx.fillRect(x - 36, y - 36, 72, 14);
    ctx.fillStyle = labelColor;
    ctx.font = "bold 10px 'Noto Sans KR'";
    ctx.textAlign = "center";
    ctx.fillText(labelText, x, y - 26);
  }
}

function drawPlayer() {
  const x = player.x - camera.x;
  const y = player.y - camera.y;
  const job = getJobData(player.jobId);
  const tier = getToolTier(player.toolLevel);

  drawMinerSprite(
    x, y,
    job.color || "#3a536b",
    "#f5c66b",
    tier.headColor,
    mineTarget ? swingAnim : 0,
    facing,
    `${job.emoji} ${currentUsername ? currentUsername.split('@')[0] : "광부"}`,
    job.color,
    tier
  );

  drawCompanionPet();
}

function drawCompanionPet() {
  const px = companionPet.x - camera.x;
  const py = companionPet.y - camera.y;

  // 요정 오라 원형 파동
  ctx.save();
  ctx.strokeStyle = "rgba(193, 138, 242, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 13 + Math.sin(companionPet.auraAnim) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.font = "19px serif";
  ctx.textAlign = "center";
  ctx.fillText("🧚‍♂️", px, py + 6);
}

// 은은하고 고급스러운 광산 비네팅(조명) 효과 (너무 어둡지 않게 최적화)
function drawFogOfWar() {
  const px = player.x - camera.x;
  const py = player.y - camera.y;

  const grad = ctx.createRadialGradient(px, py, 90, px, py, player.lampRadius + 140);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.65, "rgba(9, 13, 20, 0.25)");
  grad.addColorStop(1, "rgba(9, 13, 20, 0.72)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawFX(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
    ctx.globalAlpha = 1;

    if (p.t >= p.life) particles.splice(i, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.t += dt;
    ft.y -= 28 * dt;

    ctx.fillStyle = ft.color;
    ctx.font = "bold 13px 'Noto Sans KR'";
    ctx.textAlign = "center";
    ctx.globalAlpha = Math.max(0, 1 - ft.t / 0.85);
    ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
    ctx.globalAlpha = 1;

    if (ft.t >= 0.85) floatingTexts.splice(i, 1);
  }
}

function render(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (currentUsername) {
    move(dt);
    mine(dt);

    camera.x += (player.x - W / 2 - camera.x) * 0.12;
    camera.y += (player.y - H / 2 - camera.y) * 0.12;
    camera.x = Math.max(0, Math.min(WORLD_W * TILE - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H * TILE - H, camera.y));
  }

  ctx.clearRect(0, 0, W, H);
  drawWorld();
  if (currentUsername) {
    drawPlayer();
    drawFogOfWar();
    drawFX(dt);
  }

  if (now - lastSave > 5000 && currentUsername) {
    save();
    lastSave = now;
  }

  requestAnimationFrame(render);
}

function updateUI() {
  const tier = getToolTier(player.toolLevel);
  const job = getJobData(player.jobId);

  $("depthLabel").textContent = String(zone().depth).padStart(2, "0") + " F";
  $("goldLabel").textContent = player.gold.toLocaleString() + " G";
  $("levelLabel").textContent = "LV. " + player.level;
  $("hpText").textContent = Math.ceil(player.hp) + " / " + player.maxHp;
  $("hpBar").style.width = (player.hp / player.maxHp * 100) + "%";

  const need = Math.floor(30 + Math.pow(player.level, 1.45) * 25);
  $("expText").textContent = player.exp + " / " + need;
  $("expBar").style.width = (player.exp / need * 100) + "%";

  const realPower = Math.floor((player.power + tier.powerBonus) * job.buffs.powerMult);
  $("powerLabel").textContent = realPower.toLocaleString();
  $("minerCountLabel").textContent = getTotalMinersCount() + "명";

  $("jobBadge").textContent = `${job.emoji} ${job.name}`;
  $("jobBadge").style.color = job.color;

  $("toolName").textContent = `${tier.name} (+${player.toolLevel})`;
  $("playerAvatarDisplay").textContent = job.emoji;

  const effectiveInterval = companionPet.interval / job.buffs.petSpeedMult;
  const petRemainingSec = Math.max(0, Math.ceil(effectiveInterval - companionPet.timer));
  $("petTimerText").textContent = `${petRemainingSec}초`;
  $("petProgressBar").style.width = `${(companionPet.timer / effectiveInterval) * 100}%`;

  if (player.autoSellEnabled) {
    $("autoSellStateBadge").textContent = "ON";
    $("autoSellStateBadge").className = "badge-on";
    const remainingSec = Math.max(0, Math.ceil(player.autoSellInterval - autoSellTimer));
    $("autoSellTimerText").textContent = `${remainingSec}초`;
    $("autoSellProgressBar").style.width = `${(autoSellTimer / player.autoSellInterval) * 100}%`;
  } else {
    $("autoSellStateBadge").textContent = "OFF";
    $("autoSellStateBadge").className = "badge-off";
    $("autoSellTimerText").textContent = "비활성";
    $("autoSellProgressBar").style.width = "0%";
  }
}

// ------------------------------------
// UI 모달 렌더링
// ------------------------------------
function openModal(tab) {
  if (!currentUsername) return;
  const modal = $("gameModal");
  const content = $("modalContent");
  modal.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });

  if (tab === "inventory") renderInventory(content);
  if (tab === "job") renderJobHall(content);
  if (tab === "shop") renderShop(content);
  if (tab === "automine") renderAutoMine(content);
  if (tab === "forge") renderForge(content);
  if (tab === "map") renderMap(content);
  if (tab === "codex") renderCodex(content);
}

function renderJobHall(el) {
  let html = `<h2 class="modal-title">JOB HALL — 전직소</h2>
    <div class="modal-sub">다양한 전직 라인업을 달성하여 고유 패시브 스킬과 능력을 해금하세요!</div>
    <div class="job-grid">`;

  JOBS.forEach(j => {
    const isCurrent = player.jobId === j.id;
    const canUnlock = player.level >= j.reqLevel && player.gold >= j.reqGold;

    html += `<div class="job-card ${isCurrent ? 'current' : ''}">
      <div class="job-card-header">
        <div class="job-icon">${j.emoji}</div>
        <div class="job-title">
          <b style="color:${j.color}">${j.name}</b>
          <small>Tier ${j.tier} 직업</small>
        </div>
      </div>
      <div class="job-desc">${j.desc}</div>
      <div class="job-buffs">✨ ${j.buffDesc}</div>
      <div style="font-size:10.5px;color:#8fa2b3;margin-top:auto;">
        조건: LV.${j.reqLevel} 이상 · ${j.reqGold ? j.reqGold.toLocaleString() + ' G' : '무료'}
      </div>
      <button class="action-btn ${isCurrent ? 'gold' : ''}" data-job="${j.id}" ${isCurrent || !canUnlock ? 'disabled' : ''}>
        ${isCurrent ? '현재 직업' : !canUnlock ? '자격 미달' : '전직하기'}
      </button>
    </div>`;
  });

  html += `</div>`;
  el.innerHTML = html;

  el.querySelectorAll("[data-job]").forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.job;
      const j = getJobData(targetId);
      if (j && player.level >= j.reqLevel && player.gold >= j.reqGold) {
        player.gold -= j.reqGold;
        player.jobId = j.id;

        for (let i = 0; i < 50; i++) {
          const angle = (Math.PI * 2 / 50) * i;
          const speed = rand(70, 200);
          particles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: j.color,
            size: rand(4, 8),
            life: rand(0.7, 1.3),
            t: 0
          });
        }

        playSound("jobChange");
        toast(`📜 전직 성공! [${j.name}]으로 전직하셨습니다!`);
        log(`📜 전직 성공! 새로운 직업 [${j.name}]의 힘을 얻었습니다!`, "legendary");

        updateUI();
        renderJobHall(el);
        save();
      }
    };
  });
}

function renderInventory(el) {
  const totalCount = Object.values(inventory).reduce((a, b) => a + b, 0);
  
  let html = `<h2 class="modal-title">INVENTORY</h2>
    <div class="modal-sub">채굴한 광물 및 자동 정산 관리 (총 ${totalCount}개 보유)</div>
    
    <div class="inventory-control-bar">
      <label class="toggle-switch">
        <input type="checkbox" id="autoSellToggle" ${player.autoSellEnabled ? "checked" : ""}>
        <span class="slider"></span>
        <span>자동 정산 시스템</span>
      </label>

      <div class="sell-options">
        <select id="autoSellRaritySelect">
          <option value="common" ${player.autoSellMaxRarity === "common" ? "selected" : ""}>일반 이하 자동 판매</option>
          <option value="uncommon" ${player.autoSellMaxRarity === "uncommon" ? "selected" : ""}>고급 이하 자동 판매</option>
          <option value="rare" ${player.autoSellMaxRarity === "rare" ? "selected" : ""}>희귀 이하 자동 판매</option>
          <option value="epic" ${player.autoSellMaxRarity === "epic" ? "selected" : ""}>영웅 이하 자동 판매</option>
          <option value="mythic" ${player.autoSellMaxRarity === "mythic" ? "selected" : ""}>신화 이하 자동 판매</option>
          <option value="transcendent" ${player.autoSellMaxRarity === "transcendent" ? "selected" : ""}>모든 광물 자동 판매</option>
        </select>

        <button class="action-btn gold" id="manualSellAllBtn">전체 일괄 판매</button>
      </div>
    </div>

    <div class="item-grid">`;

  const availableOres = ORES.filter(o => (inventory[o.id] || 0) > 0);
  if (availableOres.length === 0) {
    html += `<p class="muted" style="grid-column:1/-1;text-align:center;padding:20px;">보유 중인 광물이 없습니다. 주변 광석을 채굴해 보세요!</p>`;
  } else {
    for (const o of availableOres) {
      const rar = rarity(o.rarity);
      html += `<div class="item rarity-${o.rarity}">
        <div class="emoji">${o.emoji}</div>
        <b>${o.name}</b>
        <small style="color:${rar.color}">${rar.name} · ${inventory[o.id]}개</small>
        <small style="margin-top:2px;">기본 가치: ${o.value.toLocaleString()} G</small>
      </div>`;
    }
  }

  html += `</div>`;
  el.innerHTML = html;

  const toggle = el.querySelector("#autoSellToggle");
  if (toggle) {
    toggle.onchange = (e) => {
      player.autoSellEnabled = e.target.checked;
      autoSellTimer = 0;
      updateUI();
      save();
    };
  }

  const select = el.querySelector("#autoSellRaritySelect");
  if (select) {
    select.onchange = (e) => {
      player.autoSellMaxRarity = e.target.value;
      save();
    };
  }

  const sellBtn = el.querySelector("#manualSellAllBtn");
  if (sellBtn) {
    sellBtn.onclick = () => {
      manualSellAll();
      renderInventory(el);
    };
  }
}

function renderShop(el) {
  let html = `<h2 class="modal-title">MINER SHOP</h2>
    <div class="modal-sub">광부들을 고용하여 자동으로 광석을 채굴하도록 지시하세요.</div>
    <div class="shop-grid">`;

  MINER_TYPES.forEach(m => {
    const owned = player.miners?.[m.id] || 0;
    html += `<div class="miner-card">
      <div class="miner-card-header">
        <div class="miner-icon">${m.emoji}</div>
        <div class="miner-title">
          <b style="color:${m.color}">${m.name}</b>
          <small>개별 채굴력 +${m.power} / 보유: ${owned}명</small>
        </div>
      </div>
      <div class="miner-desc">${m.desc}</div>
      <button class="action-btn gold" data-buy="${m.id}" ${player.gold < m.cost ? "disabled" : ""}>
        고용하기 (${m.cost.toLocaleString()} G)
      </button>
    </div>`;
  });

  html += `</div>`;
  el.innerHTML = html;

  el.querySelectorAll("[data-buy]").forEach(btn => {
    btn.onclick = () => {
      const typeId = btn.dataset.buy;
      const m = MINER_TYPES.find(x => x.id === typeId);
      if (m && player.gold >= m.cost) {
        player.gold -= m.cost;
        player.miners[typeId] = (player.miners[typeId] || 0) + 1;
        toast(`${m.name} 고용 완료!`);
        log(`🛒 ${m.name} 1명을 고용했습니다.`, "rare");
        initAutoMiners();
        updateUI();
        renderShop(el);
        save();
      }
    };
  });
}

function renderAutoMine(el) {
  let totalDps = 0;
  MINER_TYPES.forEach(m => {
    totalDps += (player.miners?.[m.id] || 0) * m.power;
  });

  let html = `<h2 class="modal-title">AUTOMATIC MINE</h2>
    <div class="modal-sub">자동 광질장 가동 상태 및 광부들의 채굴 생산량 요약입니다.</div>
    <div class="automine-container">
      <div class="automine-banner">
        <div>
          <span>총 초당 기본 자동 채굴력</span>
          <b>⚡ ${totalDps.toLocaleString()} PWR/s</b>
        </div>
        <div style="text-align:right;">
          <span>총 고용 광부</span>
          <b>👷 ${getTotalMinersCount()} 명</b>
        </div>
      </div>
      <div class="automine-list">`;

  MINER_TYPES.forEach(m => {
    const count = player.miners?.[m.id] || 0;
    html += `<div class="automine-item">
      <div>
        <b style="color:${m.color}">${m.emoji} ${m.name}</b>
        <small style="color:#8fa2b3;display:block;">개별 채굴력 ${m.power} PWR</small>
      </div>
      <b>${count} 명 가동 중 (+${(count * m.power).toLocaleString()} PWR)</b>
    </div>`;
  });

  html += `</div></div>`;
  el.innerHTML = html;
}

function getUpgradeRequirement(level) {
  const cost = Math.floor(50 + Math.pow(level, 2.25) * 45);
  let matId = "copper", matName = "구리";

  if (level < 10) { matId = "copper"; matName = "구리"; }
  else if (level < 20) { matId = "iron"; matName = "철광석"; }
  else if (level < 30) { matId = "silver"; matName = "은"; }
  else if (level < 40) { matId = "gold"; matName = "금"; }
  else if (level < 50) { matId = "ruby"; matName = "루비"; }
  else if (level < 60) { matId = "sapphire"; matName = "사파이어"; }
  else if (level < 70) { matId = "emerald"; matName = "에메랄드"; }
  else if (level < 80) { matId = "obsidian"; matName = "흑요석"; }
  else if (level < 90) { matId = "mithril"; matName = "미스릴"; }
  else if (level < 95) { matId = "orichalcum"; matName = "오리할콘"; }
  else { matId = "adamantium"; matName = "아다만티움"; }

  const reqMat = Math.max(1, (level % 10) + 1);
  return { cost, matId, matName, reqMat };
}

function renderForge(el) {
  const MAX_TOOL_LEVEL = 100;
  const currentTier = getToolTier(player.toolLevel);
  const nextTier = getToolTier(Math.min(MAX_TOOL_LEVEL, player.toolLevel + 1));

  const req = getUpgradeRequirement(player.toolLevel);
  const matCount = inventory[req.matId] || 0;
  const isMaxTier = player.toolLevel >= MAX_TOOL_LEVEL;

  el.innerHTML = `
    <h2 class="modal-title">BLACKSMITH & FORGE (MAX +100)</h2>
    <div class="modal-sub">100단계의 초월 곡괭이 진화! 단계가 오를수록 외형과 압도적인 채굴력을 손에 넣습니다.</div>
    <div class="forge-layout">
      <div class="forge-box" id="forgePreviewBox">
        <div class="weapon-preview-card" id="weaponCard">
          <div class="weapon-icon" id="weaponIcon">${currentTier.emoji}</div>
          <div class="weapon-name" style="color:${currentTier.auraColor || '#f5d48e'}">${currentTier.name} (+${player.toolLevel})</div>
          <div class="weapon-stats">
            ⚡ 곡괭이 보너스 채굴력: +${currentTier.powerBonus.toLocaleString()}<br>
            🏃 이동/채굴 속도 배율: ${currentTier.speedBonus}x<br>
            ✨ 외형 진화 단계: ${player.toolLevel} / 100 단계
          </div>
        </div>
      </div>
      <div class="forge-box">
        <b>⚒️ 다음 강화 조건 (+${player.toolLevel} ➔ +${player.toolLevel + 1})</b>
        <div class="upgrade-cost">
          💰 필요 골드: ${player.gold.toLocaleString()} / ${req.cost.toLocaleString()} G<br>
          📦 필요 재료 (${req.matName}): ${matCount} / ${req.reqMat}개<br><br>
          ${!isMaxTier ? `
            <span style="color:#73d39b;">다음 강화 효과 [${nextTier.name} +${player.toolLevel + 1}] :</span><br>
            ⚡ 추가 채굴력: +${(nextTier.powerBonus - currentTier.powerBonus).toLocaleString()}<br>
            🏃 속도 배율: ${nextTier.speedBonus}x
          ` : '<span style="color:#00ffff;">🌌 축하합니다! 최종 100단계 초월 곡괭이를 완성했습니다!</span>'}
        </div>
        <button class="action-btn gold" id="upgradeToolBtn" ${isMaxTier || player.gold < req.cost || matCount < req.reqMat ? "disabled" : ""}>
          ${isMaxTier ? '★ 100단계 초월 달성 ★' : '✨ 곡괭이 강화하기 (+1)'}
        </button>
      </div>
    </div>
  `;

  const btn = el.querySelector("#upgradeToolBtn");
  if (btn) {
    btn.onclick = () => {
      if (isMaxTier || player.gold < req.cost || matCount < req.reqMat) return;

      player.gold -= req.cost;
      inventory[req.matId] -= req.reqMat;
      player.toolLevel++;

      const newTier = getToolTier(player.toolLevel);

      const forgeBox = document.getElementById("forgePreviewBox");
      const card = document.getElementById("weaponCard");

      if (forgeBox && card) {
        forgeBox.classList.remove("flash-effect");
        card.classList.remove("shake-upgrade");
        void forgeBox.offsetWidth;
        forgeBox.classList.add("flash-effect");
        card.classList.add("shake-upgrade");
      }

      for (let i = 0; i < 45; i++) {
        const angle = (Math.PI * 2 / 45) * i;
        const speed = rand(80, 190);
        particles.push({
          x: player.x, y: player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: newTier.headColor,
          size: rand(4, 8),
          life: rand(0.6, 1.2),
          t: 0
        });
      }

      playSound("forgeSuccess");
      toast(`✨ 강화 성공! [${newTier.name} +${player.toolLevel}] 달성!`);
      log(`⚒️ 대장간 강화 성공! [${newTier.name} (+${player.toolLevel})] 달성!`, "legendary");

      updateUI();
      save();

      setTimeout(() => renderForge(el), 350);
    };
  }
}

function renderMap(el) {
  let html = `<h2 class="modal-title">UNDERGROUND MAP (15 ZONES)</h2>
    <div class="modal-sub">총 15층의 광산 구역입니다. 깊은 층일수록 광석이 훨씬 단단해지지만 막대한 골드와 초희귀 광물이 출현합니다!</div>
    <div class="zone-list">`;

  ZONES.forEach((z, i) => {
    const isCurrent = i === selectedZone;
    const isLocked = player.level < z.unlock;

    html += `<div class="zone">
      <div>
        <b style="color:${z.accent}">[${z.depth}층] ${z.name}</b>
        <small>${z.desc}</small>
        <small style="color:#f5c66b;">해금: LV.${z.unlock} · 암반 경도: ${z.hpMult}x · 보상 배율: ${z.goldMult}x</small>
      </div>
      <button class="action-btn ${isCurrent ? 'gold' : ''}" data-zone="${i}" ${isLocked ? 'disabled' : ''}>
        ${isCurrent ? '탐험 중' : isLocked ? 'LV.' + z.unlock + ' 필요' : '입장하기'}
      </button>
    </div>`;
  });

  html += `</div>`;
  el.innerHTML = html;

  el.querySelectorAll("[data-zone]").forEach(btn => {
    btn.onclick = () => {
      selectedZone = Number(btn.dataset.zone);
      player.x = WORLD_W * TILE / 2;
      player.y = WORLD_H * TILE / 2;
      makeMap();
      initAutoMiners();
      log(`[${zone().depth}층] ${zone().name}에 입장했습니다!`, "uncommon");
      toast(`${zone().name} 탐험 시작!`);
      updateUI();
      renderMap(el);
      save();
    };
  });
}

function renderCodex(el) {
  let html = `<h2 class="modal-title">ORE CODEX</h2>
    <div class="modal-sub">발견한 광물 도감 (${discovered.size} / ${ORES.length})</div>
    <div class="codex-list">`;

  ORES.forEach(o => {
    const isDiscovered = discovered.has(o.id);
    const rar = rarity(o.rarity);

    html += `<div class="codex-entry">
      <b style="color:${isDiscovered ? rar.color : '#666'}">
        ${isDiscovered ? o.emoji + ' ' + o.name : '？？？？'}
      </b>
      <small>
        ${isDiscovered ? rar.name + ' 등급 · 가치 ' + o.value.toLocaleString() + ' G' : '미발견 (지하 ' + o.depth + '층 출현)'}
      </small>
    </div>`;
  });

  html += `</div>`;
  el.innerHTML = html;
}

addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  activeKeys.add(e.code);
  activeKeys.add(e.key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }
});

addEventListener("keyup", e => {
  activeKeys.delete(e.code);
  activeKeys.delete(e.key);
});

function resetAllKeys() {
  activeKeys.clear();
  for (let k in held) held[k] = false;
}

addEventListener("blur", resetAllKeys);
addEventListener("focus", resetAllKeys);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetAllKeys();
});

document.querySelectorAll(".nav-btn").forEach(b => {
  b.onclick = () => openModal(b.dataset.tab);
});

$("closeModal").onclick = () => $("gameModal").classList.add("hidden");
$("gameModal").addEventListener("click", e => {
  if (e.target.id === "gameModal") $("gameModal").classList.add("hidden");
});

$("soundBtn").onclick = () => {
  sound = !sound;
  $("soundBtn").textContent = sound ? "♫" : "♪";
  toast(sound ? "효과음 켜짐" : "효과음 꺼짐");
};

document.querySelectorAll("[data-move]").forEach(b => {
  const k = b.dataset.move;
  b.addEventListener("pointerdown", e => { e.preventDefault(); held[k] = true; });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => {
    b.addEventListener(ev, () => held[k] = false);
  });
});

$("mobileMine").onclick = () => {
  if (mineTarget) {
    mineTarget.hp = 0;
    mine(0);
  }
};

makeMap();
requestAnimationFrame(render);

initFirebaseAuth();

addEventListener("beforeunload", () => save(true));
})();
