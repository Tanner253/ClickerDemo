// Game State
const game = {
  stats: {
    totalClicks: 0,
    manualClicks: 0,
    autoClicks: 0,
    coinCount: 0,
    clicksSinceLastGoldRush: 0,
    goldRushActive: false,
    startTime: performance.now(),
    lastAutoClickTime: 0,
    lastManualClickTime: 0,
    lastClicks: [],
    goldRushThreshold: 100
  },
  upgrades: {
    auto: { count: 0, cost: 10, cps: 0.1, costMultiplier: 1.3, name: "Auto Clicker" },
    miner: { count: 0, cost: 100, cps: 1, costMultiplier: 1.4, name: "Miner" },
    machine: { count: 0, cost: 1000, cps: 10, costMultiplier: 1.5, name: "Machining" },
    drill: { count: 0, cost: 5000, cps: 50, costMultiplier: 1.6, name: "Drill" },
    lab: { count: 0, cost: 20000, cps: 200, costMultiplier: 1.7, name: "Gold Lab" }
  },
  elements: {},
  intervals: {},
  goldRushTimeout: null,
  holdClickInterval: null
};

// DOM References
function cacheElements() {
  game.elements = {
    goldBar: document.getElementById('gold-bar'),
    coinCount: document.getElementById('coin-count'),
    cpsDisplay: document.getElementById('cps'),
    cpsContainer: document.getElementById('cps-container'),
    clickCount: document.getElementById('click-count'),
    goldRushFill: document.getElementById('gold-rush-fill'),
    goldRushText: document.getElementById('gold-rush-text'),
    
    // Upgrade buttons
    auto: {
      btn: document.getElementById('buy-auto'),
      count: document.getElementById('auto-count'),
      cost: document.getElementById('auto-cost')
    },
    miner: {
      btn: document.getElementById('buy-miner'),
      count: document.getElementById('miner-count'),
      cost: document.getElementById('miner-cost')
    },
    machine: {
      btn: document.getElementById('buy-machine'),
      count: document.getElementById('machine-count'),
      cost: document.getElementById('machine-cost')
    },
    drill: {
      btn: document.getElementById('buy-drill'),
      count: document.getElementById('drill-count'),
      cost: document.getElementById('drill-cost')
    },
    lab: {
      btn: document.getElementById('buy-lab'),
      count: document.getElementById('lab-count'),
      cost: document.getElementById('lab-cost')
    }
  };
}

// Initialize Game
function initGame() {
  cacheElements();
  setupEventListeners();
  loadGame();
  
  // Main game loop (runs every second for auto-clickers)
  game.intervals.autoClick = setInterval(autoClickLoop, 1000);
  
  // Stats update loop
  game.intervals.statsUpdate = setInterval(updateStats, 250);
  
  // Start animation frame loop
  requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop() {
  updateGoldRushProgress();
  requestAnimationFrame(gameLoop);
}

// Event Listeners
function setupEventListeners() {
  // Gold bar click
  game.elements.goldBar.addEventListener('click', handleClick);
  game.elements.goldBar.addEventListener('mousedown', startHoldClick);
  game.elements.goldBar.addEventListener('mouseup', stopHoldClick);
  game.elements.goldBar.addEventListener('mouseleave', stopHoldClick);
  
  // Upgrade purchases
  game.elements.auto.btn.addEventListener('click', () => buyUpgrade('auto'));
  game.elements.miner.btn.addEventListener('click', () => buyUpgrade('miner'));
  game.elements.machine.btn.addEventListener('click', () => buyUpgrade('machine'));
  game.elements.drill.btn.addEventListener('click', () => buyUpgrade('drill'));
  game.elements.lab.btn.addEventListener('click', () => buyUpgrade('lab'));
  
  // Shift-click for bulk purchases
  game.elements.auto.btn.addEventListener('click', (e) => e.shiftKey && buyMax('auto'));
  game.elements.miner.btn.addEventListener('click', (e) => e.shiftKey && buyMax('miner'));
  game.elements.machine.btn.addEventListener('click', (e) => e.shiftKey && buyMax('machine'));
  game.elements.drill.btn.addEventListener('click', (e) => e.shiftKey && buyMax('drill'));
  game.elements.lab.btn.addEventListener('click', (e) => e.shiftKey && buyMax('lab'));
  
  // Tooltips for upgrades
  setupTooltips();
}

// Click Handling
function handleClick(e) {
  const now = Date.now();
  // Prevent multiple clicks from hold-to-click
  if (now - game.stats.lastManualClickTime < 200) return;
  game.stats.lastManualClickTime = now;
  
  const isShift = e.shiftKey;
  const baseClickAmount = isShift ? 10 : 1;
  const multiplier = game.stats.goldRushActive ? 5 : 1;
  const clickValue = baseClickAmount * multiplier;
  
  game.stats.totalClicks += baseClickAmount;
  game.stats.manualClicks += baseClickAmount;
  
  // Record click for CPS calculation
  game.stats.lastClicks.push({
    time: now,
    amount: baseClickAmount
  });
  
  if (!game.stats.goldRushActive) {
    game.stats.clicksSinceLastGoldRush += baseClickAmount;
  }
  
  game.stats.coinCount += clickValue;
  
  spawnClickFeedback(clickValue, e.clientX, e.clientY);
  updateStats();
  
  // Check for Gold Rush
  if (game.stats.clicksSinceLastGoldRush >= game.stats.goldRushThreshold && 
      !game.stats.goldRushActive && 
      !game.goldRushTimeout) {
    startGoldRush();
  }
  
  // Save game state after each click
  saveGame();
}

// Hold-to-click functionality
function startHoldClick(e) {
  if (game.holdClickInterval) clearInterval(game.holdClickInterval);
  handleClick(e); // Initial click
  game.holdClickInterval = setInterval(() => handleClick(e), 300); // Subsequent clicks with delay
}

function stopHoldClick() {
  if (game.holdClickInterval) {
    clearInterval(game.holdClickInterval);
    game.holdClickInterval = null;
  }
}

// Auto-clicker Logic (now runs once per second)
function autoClickLoop() {
  const now = Date.now();
  const multiplier = game.stats.goldRushActive ? 5 : 1;
  
  // Process each upgrade type separately to show individual feedback
  Object.entries(game.upgrades).forEach(([type, upgrade]) => {
    if (upgrade.count > 0) {
      const earned = upgrade.count * upgrade.cps * multiplier;
      
      if (earned > 0) {
        game.stats.coinCount += earned;
        game.stats.autoClicks += upgrade.count * upgrade.cps;
        game.stats.totalClicks += upgrade.count * upgrade.cps;
        
        // Record auto-clicks for CPS calculation
        game.stats.lastClicks.push({
          time: now,
          amount: upgrade.count * upgrade.cps
        });
        
        if (!game.stats.goldRushActive) {
          game.stats.clicksSinceLastGoldRush += upgrade.count * upgrade.cps;
        }
        
        // Visual feedback for each upgrade type
        spawnAutoClickFeedback(earned, type);
      }
    }
  });
  
  // Visual feedback for auto-clicks
  game.elements.goldBar.classList.add('auto-click');
  setTimeout(() => {
    game.elements.goldBar.classList.remove('auto-click');
  }, 300);
  
  // Save game state periodically
  if (now - game.stats.lastAutoClickTime > 5000) {
    saveGame();
    game.stats.lastAutoClickTime = now;
  }
}

// Upgrade System
function buyUpgrade(type) {
  const upgrade = game.upgrades[type];
  
  if (game.stats.coinCount >= upgrade.cost) {
    game.stats.coinCount -= upgrade.cost;
    upgrade.count++;
    upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);
    
    updateUpgradeDisplay(type);
    updateStats();
    saveGame();
  }
}

// Buy as many as possible (shift-click)
function buyMax(type) {
  const upgrade = game.upgrades[type];
  let affordable = 0;
  let currentCost = upgrade.cost;
  let totalCost = 0;
  
  while (totalCost + currentCost <= game.stats.coinCount) {
    totalCost += currentCost;
    currentCost = Math.floor(currentCost * upgrade.costMultiplier);
    affordable++;
  }
  
  if (affordable > 0) {
    game.stats.coinCount -= totalCost;
    upgrade.count += affordable;
    upgrade.cost = currentCost;
    
    updateUpgradeDisplay(type);
    updateStats();
    saveGame();
  }
}

// Gold Rush System
function updateGoldRushProgress() {
  const progress = Math.min(game.stats.clicksSinceLastGoldRush, game.stats.goldRushThreshold);
  const percentage = (progress / game.stats.goldRushThreshold) * 100;
  game.elements.goldRushFill.style.width = `${percentage}%`;
  
  if (game.stats.goldRushActive) {
    // Count down during Gold Rush
    const remaining = game.goldRushTimeout ? 
      Math.ceil((game.goldRushTimeout - Date.now()) / 1000) : 0;
    game.elements.goldRushText.textContent = `GOLD RUSH! ${remaining}s`;
  } else {
    game.elements.goldRushText.textContent = `Gold Rush: ${Math.floor(progress)}/${game.stats.goldRushThreshold}`;
  }
}

function startGoldRush() {
  game.stats.goldRushActive = true;
  game.goldRushTimeout = Date.now() + 5000; // 5 seconds from now
  
  // Increase threshold for next Gold Rush by 10%
  game.stats.goldRushThreshold = Math.floor(game.stats.goldRushThreshold * 1.4);
  
  createConfetti();
  createGoldRushBanner();
  
  // Set timeout to end Gold Rush
  setTimeout(() => {
    game.stats.goldRushActive = false;
    game.stats.clicksSinceLastGoldRush = 0;
    game.goldRushTimeout = null;
    
    // Remove visual effects
    document.querySelectorAll('.confetti-container, .gold-rush-banner').forEach(el => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    });
  }, 5000);
}

// Visual Effects
function createConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  
  // Create 100 pieces of confetti
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(confetti);
  }
  
  document.body.appendChild(container);
  
  // Remove after animation completes
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 500);
  }, 5000);
}

function createGoldRushBanner() {
  const banner = document.createElement('div');
  banner.className = 'gold-rush-banner';
  banner.textContent = 'GOLD RUSH! x5';
  document.body.appendChild(banner);
  
  // Fade in
  setTimeout(() => {
    banner.style.opacity = '1';
  }, 10);
}

function spawnClickFeedback(amount, x, y) {
  const feedback = document.createElement('div');
  feedback.className = 'click-feedback';
  feedback.textContent = `+${amount}`;
  feedback.style.left = `${x + (Math.random() * 40 - 20)}px`;
  feedback.style.top = `${y + (Math.random() * 40 - 20)}px`;
  feedback.style.color = `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.transform = 'translateY(-40px)';
    feedback.style.opacity = '0';
  }, 10);
  
  setTimeout(() => feedback.remove(), 1000);
}

function spawnAutoClickFeedback(amount, type) {
  const feedback = document.createElement('div');
  feedback.className = 'auto-click-feedback';
  feedback.textContent = `+${amount.toFixed(1)} (${game.upgrades[type].name})`;
  
  // Position near the upgrade button
  const upgradeBtn = game.elements[type].btn;
  const rect = upgradeBtn.getBoundingClientRect();
  
  feedback.style.left = `${rect.left + (Math.random() * 40 - 20)}px`;
  feedback.style.top = `${rect.top + (Math.random() * 40 - 20)}px`;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.transform = 'translateY(-40px)';
    feedback.style.opacity = '0';
  }, 10);
  
  setTimeout(() => feedback.remove(), 1500);
}

// Stats and Display
function calculateTotalCPS() {
  return Object.values(game.upgrades).reduce((total, upgrade) => {
    return total + (upgrade.count * upgrade.cps);
  }, 0);
}

function calculateActualCPS() {
  const now = Date.now();
  // Remove clicks older than 1 second
  game.stats.lastClicks = game.stats.lastClicks.filter(click => now - click.time < 1000);
  
  // Sum all clicks in the last second
  return game.stats.lastClicks.reduce((total, click) => total + click.amount, 0);
}

function updateStats() {
  // Calculate actual CPS from recent clicks
  const cps = calculateActualCPS();
  
  // Update displays
  game.elements.clickCount.textContent = game.stats.totalClicks;
  game.elements.coinCount.textContent = game.stats.coinCount.toFixed(1);
  game.elements.cpsDisplay.textContent = cps.toFixed(1);
  
  // Update CPS meter color
  updateCPSMeterColor(cps);
  
  // Update upgrade buttons state
  updateUpgradeButtons();
}

function updateCPSMeterColor(cps) {
  let bgColor;
  
  if (cps > 100) bgColor = 'linear-gradient(to right, #ff0000, #cc0000)';
  else if (cps > 75) bgColor = 'linear-gradient(to right, #ff6600, #ff3300)';
  else if (cps > 50) bgColor = 'linear-gradient(to right, #ffcc00, #ff9900)';
  else if (cps > 25) bgColor = 'linear-gradient(to right, #ccff66, #ffff66)';
  else if (cps > 10) bgColor = 'linear-gradient(to right, #e0ffe0, #c8ffc8)';
  else bgColor = 'linear-gradient(to top left, var(--gold-light), var(--gold-dark))';
  
  game.elements.cpsContainer.style.background = bgColor;
}

function updateUpgradeDisplay(type) {
  const upgrade = game.upgrades[type];
  const element = game.elements[type];
  
  element.count.textContent = upgrade.count;
  element.cost.textContent = upgrade.cost;
}

function updateUpgradeButtons() {
  Object.keys(game.upgrades).forEach(type => {
    const upgrade = game.upgrades[type];
    const element = game.elements[type];
    
    if (game.stats.coinCount >= upgrade.cost) {
      element.btn.disabled = false;
      element.btn.style.opacity = '1';
    } else {
      element.btn.disabled = true;
      element.btn.style.opacity = '0.7';
    }
  });
}

// Tooltips
function setupTooltips() {
  Object.keys(game.upgrades).forEach(type => {
    const element = game.elements[type];
    const upgrade = game.upgrades[type];
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = `Each ${type} produces ${upgrade.cps} clicks per second`;
    element.btn.appendChild(tooltip);
    
    element.btn.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });
    
    element.btn.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

// Save/Load System
function saveGame() {
  const saveData = {
    stats: {
      totalClicks: game.stats.totalClicks,
      manualClicks: game.stats.manualClicks,
      autoClicks: game.stats.autoClicks,
      coinCount: game.stats.coinCount,
      clicksSinceLastGoldRush: game.stats.clicksSinceLastGoldRush,
      goldRushThreshold: game.stats.goldRushThreshold,
      startTime: game.stats.startTime
    },
    upgrades: {
      auto: { count: game.upgrades.auto.count, cost: game.upgrades.auto.cost },
      miner: { count: game.upgrades.miner.count, cost: game.upgrades.miner.cost },
      machine: { count: game.upgrades.machine.count, cost: game.upgrades.machine.cost },
      drill: { count: game.upgrades.drill.count, cost: game.upgrades.drill.cost },
      lab: { count: game.upgrades.lab.count, cost: game.upgrades.lab.cost }
    }
  };
  
  localStorage.setItem('goldBarClickerSave', JSON.stringify(saveData));
}

function loadGame() {
  const saveData = localStorage.getItem('goldBarClickerSave');
  if (!saveData) return;
  
  try {
    const parsed = JSON.parse(saveData);
    
    // Load stats
    game.stats.totalClicks = parsed.stats.totalClicks || 0;
    game.stats.manualClicks = parsed.stats.manualClicks || 0;
    game.stats.autoClicks = parsed.stats.autoClicks || 0;
    game.stats.coinCount = parsed.stats.coinCount || 0;
    game.stats.clicksSinceLastGoldRush = parsed.stats.clicksSinceLastGoldRush || 0;
    game.stats.goldRushThreshold = parsed.stats.goldRushThreshold || 100;
    
    // Load upgrades
    game.upgrades.auto.count = parsed.upgrades.auto.count || 0;
    game.upgrades.auto.cost = parsed.upgrades.auto.cost || 10;
    
    game.upgrades.miner.count = parsed.upgrades.miner.count || 0;
    game.upgrades.miner.cost = parsed.upgrades.miner.cost || 100;
    
    game.upgrades.machine.count = parsed.upgrades.machine.count || 0;
    game.upgrades.machine.cost = parsed.upgrades.machine.cost || 1000;
    
    game.upgrades.drill.count = parsed.upgrades.drill.count || 0;
    game.upgrades.drill.cost = parsed.upgrades.drill.cost || 5000;
    
    game.upgrades.lab.count = parsed.upgrades.lab.count || 0;
    game.upgrades.lab.cost = parsed.upgrades.lab.cost || 20000;
    
    // Update displays
    updateStats();
    Object.keys(game.upgrades).forEach(type => updateUpgradeDisplay(type));
  } catch (e) {
    console.error('Failed to load save:', e);
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 