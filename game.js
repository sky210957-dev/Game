// ========== Game State ==========
const state = {
  coins: 0,
  energy: 100,
  maxEnergy: 100,
  level: 1,
  clickPower: 1,
  autoIncome: 0,       // เหรียญต่อวินาที
  energyRegen: 5,       // พลังงานฟื้นต่อวินาที
  upgrades: {
    click: 1,
    auto: 0,
    energy: 1,
    maxEnergy: 1,
  },
};

// ========== Shop Items ==========
const shopItems = [
  { id: 'click',   name: '⚡ กำลังแตะ',     baseCost: 50,   growth: 1.5, desc: '+1 เหรียญ/แตะ' },
  { id: 'auto',    name: '🤖 ปั๊มเหรียญ',   baseCost: 100,  growth: 1.6, desc: '+1 เหรียญ/วิ' },
  { id: 'energy',  name: '🔋 ฟื้นฟูไว',     baseCost: 75,   growth: 1.4, desc: '+2 พลังงาน/วิ' },
  { id: 'maxEnergy', name: '❤️ พลังงานสูงสุด', baseCost: 150, growth: 1.7, desc: '+20 Max Energy' },
];

const clickCosts = {};
const autoCosts = {};
const energyCosts = {};
const maxEnergyCosts = {};

// ========== DOM Elements ==========
const $coins     = document.getElementById('coins');
const $energy    = document.getElementById('energy');
const $level     = document.getElementById('level');
const $pokBtn    = document.getElementById('pok-btn');
const $feedback  = document.getElementById('click-feedback');
const $progress  = document.getElementById('progress-bar');
const $shop      = document.getElementById('shop-items');
const $upgrade   = document.getElementById('upgrade-items');

// ========== Helpers ==========
function getCost(type) {
  const item = shopItems.find(i => i.id === type);
  const count = state.upgrades[type];
  return Math.floor(item.baseCost * Math.pow(item.growth, count - 1));
}

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(0);
}

// ========== Render ==========
function renderShop() {
  $shop.innerHTML = '';
  shopItems.slice(0, 2).forEach(item => {
    const cost = getCost(item.id);
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div>
        <div><b>${item.name}</b></div>
        <small>${item.desc} | Lv.${state.upgrades[item.id]}</small>
      </div>
      <button data-id="${item.id}" ${state.coins < cost ? 'disabled' : ''}>
        ${formatNum(cost)} 💰
      </button>`;
    $shop.appendChild(div);
  });

  $upgrade.innerHTML = '';
  shopItems.slice(2).forEach(item => {
    const cost = getCost(item.id);
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div>
        <div><b>${item.name}</b></div>
        <small>${item.desc} | Lv.${state.upgrades[item.id]}</small>
      </div>
      <button data-id="${item.id}" ${state.coins < cost ? 'disabled' : ''}>
        ${formatNum(cost)} 💰
      </button>`;
    $upgrade.appendChild(div);
  });

  // attach listeners
  document.querySelectorAll('.shop-item button').forEach(btn => {
    btn.onclick = () => buy(btn.dataset.id);
  });
}

function render() {
  $coins.textContent  = formatNum(state.coins);
  $energy.textContent = Math.floor(state.energy) + '/' + state.maxEnergy;
  $level.textContent  = state.level;
  $progress.style.width = (state.energy / state.maxEnergy * 100) + '%';
  renderShop();
}

// ========== Actions ==========
function pok() {
  if (state.energy < 1) return;
  const gain = state.clickPower;
  state.coins += gain;
  state.energy -= 1;
  showFeedback('+' + formatNum(gain));
  checkLevelUp();
  render();
}

function showFeedback(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    position:absolute; top:20px; left:50%; transform:translateX(-50%);
    font-size:22px; font-weight:bold; color:#ffe680;
    text-shadow:0 2px 6px #000; pointer-events:none;
    animation: floatUp 0.8s ease-out forwards;`;
  document.getElementById('pok-area').appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function buy(type) {
  const cost = getCost(type);
  if (state.coins < cost) return;
  state.coins -= cost;
  state.upgrades[type]++;
  applyUpgrades();
  checkLevelUp();
  render();
}

function applyUpgrades() {
  state.clickPower  = state.upgrades.click;
  state.autoIncome  = state.upgrades.auto;
  state.energyRegen = 5 + (state.upgrades.energy - 1) * 2;
  state.maxEnergy   = 100 + (state.upgrades.maxEnergy - 1) * 20;
}

function checkLevelUp() {
  const newLevel = Math.floor(Math.sqrt(state.coins / 50)) + 1;
  if (newLevel > state.level) {
    state.level = newLevel;
    showFeedback('🎉 Level ' + newLevel + '!');
  }
}

// ========== Game Loop ==========
let lastTick = performance.now();
function loop(now) {
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  // auto income
  if (state.autoIncome > 0) {
    state.coins += state.autoIncome * dt;
  }

  // energy regen
  if (state.energy < state.maxEnergy) {
    state.energy = Math.min(state.maxEnergy, state.energy + state.energyRegen * dt);
  }

  checkLevelUp();
  render();
  requestAnimationFrame(loop);
}

// ========== Save / Load ==========
const SAVE_KEY = 'pokpok_save_v1';

function save() {
  const data = { ...state, upgrades: { ...state.upgrades } };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  showFeedback('💾 บันทึกแล้ว');
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
    if (data.upgrades) Object.assign(state.upgrades, data.upgrades);
    applyUpgrades();
  } catch (e) { console.warn('Load failed', e); }
}

function reset() {
  if (!confirm('รีเซ็ตเกมทั้งหมด?')) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// ========== Init ==========
document.getElementById('pok-btn').addEventListener('click', pok);
document.getElementById('save-btn').addEventListener('click', save);
document.getElementById('reset-btn').addEventListener('click', reset);

// auto-save ทุก 15 วิ
setInterval(save, 15000);

load();
applyUpgrades();
render();
requestAnimationFrame(loop);
