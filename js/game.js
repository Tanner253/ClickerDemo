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
    pickaxe: { count: 0, cost: 50, cps: 0.5, costMultiplier: 1.35, name: "Pickaxe" },
    miner: { count: 0, cost: 100, cps: 1, costMultiplier: 1.4, name: "Miner" },
    excavator: { count: 0, cost: 500, cps: 5, costMultiplier: 1.45, name: "Excavator" },
    machine: { count: 0, cost: 1000, cps: 10, costMultiplier: 1.5, name: "Machining" },
    drill: { count: 0, cost: 5000, cps: 50, costMultiplier: 1.6, name: "Drill" },
    refinery: { count: 0, cost: 10000, cps: 100, costMultiplier: 1.65, name: "Refinery" },
    lab: { count: 0, cost: 20000, cps: 200, costMultiplier: 1.7, name: "Gold Lab" },
    quantum: { count: 0, cost: 50000, cps: 500, costMultiplier: 1.75, name: "Quantum Miner" },
    singularity: { count: 0, cost: 100000, cps: 1000, costMultiplier: 1.8, name: "Singularity" }
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
    cpsDisplay: document.getElementById('cps-display'),
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
    pickaxe: {
      btn: document.getElementById('buy-pickaxe'),
      count: document.getElementById('pickaxe-count'),
      cost: document.getElementById('pickaxe-cost')
    },
    miner: {
      btn: document.getElementById('buy-miner'),
      count: document.getElementById('miner-count'),
      cost: document.getElementById('miner-cost')
    },
    excavator: {
      btn: document.getElementById('buy-excavator'),
      count: document.getElementById('excavator-count'),
      cost: document.getElementById('excavator-cost')
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
    refinery: {
      btn: document.getElementById('buy-refinery'),
      count: document.getElementById('refinery-count'),
      cost: document.getElementById('refinery-cost')
    },
    lab: {
      btn: document.getElementById('buy-lab'),
      count: document.getElementById('lab-count'),
      cost: document.getElementById('lab-cost')
    },
    quantum: {
      btn: document.getElementById('buy-quantum'),
      count: document.getElementById('quantum-count'),
      cost: document.getElementById('quantum-cost')
    },
    singularity: {
      btn: document.getElementById('buy-singularity'),
      count: document.getElementById('singularity-count'),
      cost: document.getElementById('singularity-cost')
    },
    powerMeterFill: document.getElementById('power-meter-fill'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    upgradesSidebar: document.getElementById('upgrades-sidebar'),
    closeUpgradesBtn: document.getElementById('close-upgrades'),
    container: document.querySelector('.container')
  };
}

// Initialize Game
function initGame() {
  cacheElements();
  setupEventListeners();
  
  // Set initial sidebar state based on screen size and saved preference
  if (window.innerWidth > 768) {
    const wasOpen = localStorage.getItem('sidebarOpen');
    if (wasOpen === null || wasOpen === 'true') {
      openSidebar();
    }
  } else {
    closeSidebar();
  }
  
  // Load saved game state
  loadGame();
  
  // Start auto-clicker interval
  game.intervals.autoClicker = setInterval(autoClickLoop, 1000);
  
  // Start the game loop for other updates
  gameLoop();
  
  // Update stats display
  updateStats();
}

// Main game loop (for visual updates only)
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
  game.elements.pickaxe.btn.addEventListener('click', () => buyUpgrade('pickaxe'));
  game.elements.miner.btn.addEventListener('click', () => buyUpgrade('miner'));
  game.elements.excavator.btn.addEventListener('click', () => buyUpgrade('excavator'));
  game.elements.machine.btn.addEventListener('click', () => buyUpgrade('machine'));
  game.elements.drill.btn.addEventListener('click', () => buyUpgrade('drill'));
  game.elements.refinery.btn.addEventListener('click', () => buyUpgrade('refinery'));
  game.elements.lab.btn.addEventListener('click', () => buyUpgrade('lab'));
  game.elements.quantum.btn.addEventListener('click', () => buyUpgrade('quantum'));
  game.elements.singularity.btn.addEventListener('click', () => buyUpgrade('singularity'));
  
  // Shift-click for bulk purchases
  game.elements.auto.btn.addEventListener('click', (e) => e.shiftKey && buyMax('auto'));
  game.elements.pickaxe.btn.addEventListener('click', (e) => e.shiftKey && buyMax('pickaxe'));
  game.elements.miner.btn.addEventListener('click', (e) => e.shiftKey && buyMax('miner'));
  game.elements.excavator.btn.addEventListener('click', (e) => e.shiftKey && buyMax('excavator'));
  game.elements.machine.btn.addEventListener('click', (e) => e.shiftKey && buyMax('machine'));
  game.elements.drill.btn.addEventListener('click', (e) => e.shiftKey && buyMax('drill'));
  game.elements.refinery.btn.addEventListener('click', (e) => e.shiftKey && buyMax('refinery'));
  game.elements.lab.btn.addEventListener('click', (e) => e.shiftKey && buyMax('lab'));
  game.elements.quantum.btn.addEventListener('click', (e) => e.shiftKey && buyMax('quantum'));
  game.elements.singularity.btn.addEventListener('click', (e) => e.shiftKey && buyMax('singularity'));
  
  // Tooltips for upgrades
  setupTooltips();

  // Hamburger menu controls
  game.elements.hamburgerBtn.addEventListener('click', toggleUpgradesSidebar);
  game.elements.closeUpgradesBtn.addEventListener('click', toggleUpgradesSidebar);

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (game.elements.upgradesSidebar.classList.contains('open') &&
        !game.elements.upgradesSidebar.contains(e.target) &&
        !game.elements.hamburgerBtn.contains(e.target)) {
      toggleUpgradesSidebar();
    }
  });

  // Prevent clicks inside sidebar from closing it
  game.elements.upgradesSidebar.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Settings button click handler
  document.getElementById('settings-btn').addEventListener('click', () => {
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    settingsModal.show();
  });

  // Reset game button click handler
  document.getElementById('resetGameBtn').addEventListener('click', () => {
    const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    settingsModal.hide();
    const resetConfirmModal = new bootstrap.Modal(document.getElementById('resetConfirmModal'));
    resetConfirmModal.show();
  });

  // Confirm reset button click handler
  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    // Reset game state
    game.stats = {
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
    };

    // Reset upgrades
    Object.keys(game.upgrades).forEach(type => {
      game.upgrades[type].count = 0;
      game.upgrades[type].cost = game.upgrades[type].cost;
    });

    // Clear saved game
    localStorage.removeItem('goldBarClickerSave');

    // Update displays
    updateStats();
    Object.keys(game.upgrades).forEach(type => updateUpgradeDisplay(type));

    // Close both modals
    const resetConfirmModal = document.getElementById('resetConfirmModal');
    const settingsModal = document.getElementById('settingsModal');
    
    // Hide both modals and remove their backdrops
    bootstrap.Modal.getInstance(resetConfirmModal).hide();
    bootstrap.Modal.getInstance(settingsModal).hide();
    
    // Remove modal backdrops
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].remove();
    }
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });
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

// Auto-clicker Logic (runs every second)
function autoClickLoop() {
  const now = Date.now();
  const multiplier = game.stats.goldRushActive ? 5 : 1;
  
  // Process each upgrade type separately to show individual feedback
  Object.entries(game.upgrades).forEach(([type, upgrade]) => {
    if (upgrade.count > 0) {
      // Calculate earnings for this upgrade
      const earned = upgrade.count * upgrade.cps * multiplier;
      
      if (earned > 0) {
        // Update game stats
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
  
  // Update stats display
  updateStats();
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
  
  // Always show feedback when sidebar is open
  feedback.style.opacity = '1';
  feedback.style.transform = 'translateY(-40px)';
  
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => feedback.remove(), 300);
  }, 1000);
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
  
  // Create 150 pieces of confetti with varied colors and shapes
  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position
    confetti.style.left = `${Math.random() * 100}%`;
    
    // Random colors (gold, yellow, orange variations)
    const hue = Math.random() * 60 + 30; // 30-90 range for gold colors
    const lightness = Math.random() * 20 + 50; // 50-70% lightness
    confetti.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;
    
    // Random size
    const size = Math.random() * 8 + 6; // 6-14px
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    
    // Random rotation and animation duration
    confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    
    // Random shape (square or circle)
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }
    
    container.appendChild(confetti);
  }
  
  document.body.appendChild(container);
}

function createGoldRushBanner() {
  const banner = document.createElement('div');
  banner.className = 'gold-rush-banner';
  
  // Create rainbow text effect by wrapping each character in a span
  const text = 'GOLD RUSH! x5';
  text.split('').forEach(char => {
    const span = document.createElement('span');
    if (char === ' ') {
      // For spaces, use a non-breaking space and add extra margin
      span.innerHTML = '&nbsp;';
      span.style.marginRight = '10px';
    } else {
      span.textContent = char;
    }
    banner.appendChild(span);
  });
  
  document.body.appendChild(banner);
  
  // Remove the banner after Gold Rush ends
  setTimeout(() => {
    banner.style.opacity = '0';
    banner.style.transform = 'translate(-50%, 0) scale(0)';
    setTimeout(() => banner.remove(), 500);
  }, 4500);
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

// Stats and Display
function calculateTotalCPS() {
  return Object.values(game.upgrades).reduce((total, upgrade) => {
    return total + (upgrade.count * upgrade.cps);
  }, 0);
}

function calculateActualCPS() {
  const now = Date.now();
  // Remove clicks older than 1 second
  game.stats.lastClicks = game.stats.lastClicks.filter(click => now - click.time <= 1000);
  
  // Sum all clicks in the last second
  const recentClicks = game.stats.lastClicks.reduce((total, click) => total + click.amount, 0);
  
  // Add auto-clicker CPS
  const autoCPS = calculateTotalCPS();
  
  return recentClicks + autoCPS;
}

function updateStats() {
  // Calculate actual CPS from recent clicks
  const cps = calculateActualCPS();
  
  // Update displays
  game.elements.coinCount.textContent = formatNumber(game.stats.coinCount);
  
  // Update power meter and CPS display
  updatePowerMeter(cps);
  
  // Update upgrade buttons state
  updateUpgradeButtons();
}

function updatePowerMeter(cps) {
  // Calculate height percentage (max CPS is 200)
  const maxCPS = 200;
  const percentage = Math.min((cps / maxCPS) * 100, 100);
  
  // Update height
  game.elements.powerMeterFill.style.height = `${percentage}%`;
  
  // Update CPS text
  game.elements.cpsDisplay.textContent = `${cps.toFixed(1)} CPS`;
  
  // Add/remove high-power class based on CPS
  if (cps > maxCPS * 0.7) { // Over 70% of max
    game.elements.powerMeterFill.classList.add('high-power');
  } else {
    game.elements.powerMeterFill.classList.remove('high-power');
  }
}

// Add number formatting function
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(1);
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
    
    // Create tooltip content with upgrade description
    let description = `<div class="upgrade-tooltip">`;
    description += `<div class="tooltip-title">${upgrade.name}</div>`;
    description += `<div class="tooltip-stats">`;
    description += `Base Production: ${upgrade.cps} CPS<br>`;
    description += `Cost Increase: ${Math.round((upgrade.costMultiplier - 1) * 100)}% per purchase<br>`;
    description += `</div>`;
    description += `<div class="tooltip-tip">Shift-click to buy max</div>`;
    description += `</div>`;

    // Initialize Bootstrap tooltip
    new bootstrap.Tooltip(element.btn, {
      title: description,
      html: true,
      placement: 'right',
      trigger: 'hover',
      container: 'body',
      animation: true,
      delay: { show: 100, hide: 100 }
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
      pickaxe: { count: game.upgrades.pickaxe.count, cost: game.upgrades.pickaxe.cost },
      miner: { count: game.upgrades.miner.count, cost: game.upgrades.miner.cost },
      excavator: { count: game.upgrades.excavator.count, cost: game.upgrades.excavator.cost },
      machine: { count: game.upgrades.machine.count, cost: game.upgrades.machine.cost },
      drill: { count: game.upgrades.drill.count, cost: game.upgrades.drill.cost },
      refinery: { count: game.upgrades.refinery.count, cost: game.upgrades.refinery.cost },
      lab: { count: game.upgrades.lab.count, cost: game.upgrades.lab.cost },
      quantum: { count: game.upgrades.quantum.count, cost: game.upgrades.quantum.cost },
      singularity: { count: game.upgrades.singularity.count, cost: game.upgrades.singularity.cost }
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
    
    game.upgrades.pickaxe.count = parsed.upgrades.pickaxe.count || 0;
    game.upgrades.pickaxe.cost = parsed.upgrades.pickaxe.cost || 50;
    
    game.upgrades.miner.count = parsed.upgrades.miner.count || 0;
    game.upgrades.miner.cost = parsed.upgrades.miner.cost || 100;
    
    game.upgrades.excavator.count = parsed.upgrades.excavator.count || 0;
    game.upgrades.excavator.cost = parsed.upgrades.excavator.cost || 500;
    
    game.upgrades.machine.count = parsed.upgrades.machine.count || 0;
    game.upgrades.machine.cost = parsed.upgrades.machine.cost || 1000;
    
    game.upgrades.drill.count = parsed.upgrades.drill.count || 0;
    game.upgrades.drill.cost = parsed.upgrades.drill.cost || 5000;
    
    game.upgrades.refinery.count = parsed.upgrades.refinery.count || 0;
    game.upgrades.refinery.cost = parsed.upgrades.refinery.cost || 10000;
    
    game.upgrades.lab.count = parsed.upgrades.lab.count || 0;
    game.upgrades.lab.cost = parsed.upgrades.lab.cost || 20000;
    
    game.upgrades.quantum.count = parsed.upgrades.quantum.count || 0;
    game.upgrades.quantum.cost = parsed.upgrades.quantum.cost || 50000;
    
    game.upgrades.singularity.count = parsed.upgrades.singularity.count || 0;
    game.upgrades.singularity.cost = parsed.upgrades.singularity.cost || 100000;
    
    // Update displays
    updateStats();
    Object.keys(game.upgrades).forEach(type => updateUpgradeDisplay(type));
  } catch (e) {
    console.error('Failed to load save:', e);
  }
}

// Add new function for toggling the upgrades sidebar
function toggleUpgradesSidebar() {
  if (game.elements.upgradesSidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// Split toggle into open/close functions
function openSidebar() {
  game.elements.upgradesSidebar.classList.add('open');
  game.elements.container.classList.add('sidebar-open');
  game.elements.hamburgerBtn.classList.add('hidden');
  localStorage.setItem('sidebarOpen', 'true');
  
  // Animate hamburger
  const lines = game.elements.hamburgerBtn.querySelectorAll('.hamburger-line');
  lines.forEach(line => line.style.width = '70%');
}

function closeSidebar() {
  game.elements.upgradesSidebar.classList.remove('open');
  game.elements.container.classList.remove('sidebar-open');
  game.elements.hamburgerBtn.classList.remove('hidden');
  localStorage.setItem('sidebarOpen', 'false');
  
  // Animate hamburger
  const lines = game.elements.hamburgerBtn.querySelectorAll('.hamburger-line');
  lines.forEach(line => line.style.width = '100%');
}

// Update handleResize function
function handleResize() {
  if (window.innerWidth > 768) {
    // On desktop, restore the last state or default to open
    const wasOpen = localStorage.getItem('sidebarOpen');
    if (wasOpen === null || wasOpen === 'true') {
      openSidebar();
    }
  } else {
    // On mobile, always close
    closeSidebar();
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 
document.addEventListener('DOMContentLoaded', initGame); 