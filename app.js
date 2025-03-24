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
  spawnClickFeedback('+1');
  updateStats();
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
  function spawnClickFeedback(text) {
  const feedback = document.createElement('div');
  feedback.textContent = text;
  feedback.style.position = 'absolute';
  feedback.style.left = `${Math.random() * 100 + 40}px`;
  feedback.style.top = `${Math.random() * 40 + 80}px`;
  feedback.style.fontSize = '1em';
  feedback.style.fontWeight = 'bold';
  feedback.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
  feedback.style.opacity = '1';
  feedback.style.transition = 'all 1s ease-out';
  feedback.style.pointerEvents = 'none';
  feedback.style.zIndex = '999';
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.transform = 'translateY(-20px)';
    feedback.style.opacity = '0';
  }, 10);

  setTimeout(() => {
    document.body.removeChild(feedback);
  }, 1000);
}

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
  showGoldRushBanner();
  goldRushActive = true;
  coinPerClick = 5;
  let countdown = 5;
  const banner = document.createElement('div');
  banner.id = 'gold-rush-banner';
  banner.textContent = `GOLD RUSH! x5 for ${countdown}s`;
  Object.assign(banner.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'gold',
    color: 'black',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '1.2em',
    fontWeight: 'bold',
    zIndex: '1000'
  });
  document.body.appendChild(banner);

  const interval = setInterval(() => {
    countdown--;
    banner.textContent = `GOLD RUSH! x5 for ${countdown}s`;
    if (countdown <= 0) {
      clearInterval(interval);
      goldRushActive = false;
      coinPerClick = 1;
      banner.remove();
    }
  }, 1000);
  goldRushActive = true;
  coinPerClick = 5;
  setTimeout(() => {
    goldRushActive = false;
    coinPerClick = 1;
  }, 5000);
}

setInterval(() => {
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
