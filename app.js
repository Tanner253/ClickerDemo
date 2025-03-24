// Game state
let clickCount = 0;
let totalClicks = 0;
let coinCount = 0;
let coinPerClick = 1;
let goldRushActive = false;
let lastGoldRushTrigger = 0;

const upgrades = [
  {
    id: 'auto',
    name: 'Auto Clicker',
    cps: 0.1,
    baseCost: 10,
    cost: 10,
    owned: 0,
    icon: 'https://cdn-icons-png.flaticon.com/512/104/104739.png',
    multiplier: 1.5
  },
  {
    id: 'miner',
    name: 'Miner',
    cps: 1,
    baseCost: 100,
    cost: 100,
    owned: 0,
    icon: 'https://cdn-icons-png.flaticon.com/512/3185/3185927.png',
    multiplier: 1.6
  },
  {
    id: 'machine',
    name: 'Machining',
    cps: 10,
    baseCost: 1000,
    cost: 1000,
    owned: 0,
    icon: 'https://cdn-icons-png.flaticon.com/512/2622/2622706.png', // New icon
    multiplier: 1.7
  },
  {
    id: 'drill',
    name: 'Drill',
    cps: 50,
    baseCost: 5000,
    cost: 5000,
    owned: 0,
    icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933556.png',
    multiplier: 1.8
  },
  {
    id: 'lab',
    name: 'Gold Lab',
    cps: 200,
    baseCost: 20000,
    cost: 20000,
    owned: 0,
    icon: 'https://cdn-icons-png.flaticon.com/512/3050/3050122.png',
    multiplier: 1.9
  }
];

const clickDisplay = document.getElementById('click-count');
const coinDisplay = document.getElementById('coin-count');
const cpsDisplay = document.getElementById('cps');
const upgradeContainer = document.getElementById('upgrade-buttons');
const goldBar = document.getElementById('gold-bar');

// Click handler
goldBar.addEventListener('click', () => {
  clickCount++;
  totalClicks++;
  coinCount += coinPerClick;
  updateStats();
  const totalClicks = clickCount;
  maybeTriggerGoldRush();
});

function renderUpgrades() {
  upgradeContainer.innerHTML = '';
  upgrades.forEach(upg => {
    const btn = document.createElement('button');
    btn.classList.add('upgrade-button');
    btn.innerHTML = `
      <img src="${upg.icon}" width="24">
      <div class="owned">Owned: <span id="${upg.id}-count">${upg.owned}</span></div>
      <div class="title">${upg.name}</div>
      <div class="cps">${upg.cps} CPS</div>
      <div class="cost">Cost: <span id="${upg.id}-cost">${upg.cost}</span></div>
    `;
    btn.addEventListener('click', () => buyUpgrade(upg.id));
    upgradeContainer.appendChild(btn);
  });
}

function buyUpgrade(type) {
  const upg = upgrades.find(u => u.id === type);
  if (!upg || coinCount < upg.cost) return;
  coinCount -= upg.cost;
  upg.owned++;
  upg.cost = Math.floor(upg.cost * upg.multiplier);
  updateStats();
  renderUpgrades();
}

function updateStats() {
  let totalCps = 0;
  upgrades.forEach(upg => {
    document.getElementById(`${upg.id}-count`).textContent = upg.owned;
    document.getElementById(`${upg.id}-cost`).textContent = upg.cost;
    totalCps += upg.owned * upg.cps;
  });
  clickDisplay.textContent = clickCount;
  coinDisplay.textContent = coinCount.toFixed(1);
  cpsDisplay.textContent = totalCps.toFixed(1);
}

function maybeTriggerGoldRush() {
  if (!goldRushActive && totalClicks - lastGoldRushTrigger >= 100) {
    lastGoldRushTrigger = totalClicks;
    startGoldRush();
  }
}

function startGoldRush() {
  goldRushActive = true;
  coinPerClick = 5;
  setTimeout(() => {
    goldRushActive = false;
    coinPerClick = 1;
  }, 5000);
}

setInterval(() => {
  let totalCps = 0;
  let totalCps = 0;
  upgrades.forEach(upg => {
    totalCps += upg.owned * upg.cps;
  });
  const multiplier = goldRushActive ? 5 : 1;
  coinCount += totalCps * multiplier;
  totalClicks += totalCps;
  maybeTriggerGoldRush();
  updateStats();
}, 1000);

renderUpgrades();
updateStats();
