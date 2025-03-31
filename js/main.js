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
    goldRushThreshold: 100,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    goldRushCount: 0,
    peakPower: 0,
    upgradeProduction: {},
    currentPowerMultiplier: 1,
    prestigeLevel: 0,
    prestigeMultiplier: 1.0,
    hasShiftClick: false
  },
  upgrades: {
    shiftClick: { count: 0, cost: 1500000, cps: 0, costMultiplier: 1, name: "Shift Click Power" },
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
  holdClickInterval: null,
  instructionOverlayTimeout: null
};

// Initialize upgrade production tracking
Object.keys(game.upgrades).forEach(type => {
  game.stats.upgradeProduction[type] = 0;
});

// DOM References
function cacheElements() {
  game.elements = {
    goldBar: document.getElementById('gold-bar'),
    coinCount: document.getElementById('coin-count'),
    upgradesGoldCount: document.getElementById('upgrades-gold-count'),
    cpsDisplay: document.getElementById('cps-display'),
    cpsContainer: document.getElementById('cps-container'),
    clickCount: document.getElementById('click-count'),
    goldRushFill: document.getElementById('gold-rush-fill'),
    goldRushText: document.getElementById('gold-rush-text'),
    powerMeterFill: document.getElementById('power-meter-fill'),
    instructionOverlay: document.getElementById('instruction-overlay'),
    
    // Upgrade buttons
    shiftClick: {
      btn: document.getElementById('buy-shift-click'),
      count: document.getElementById('shift-click-count'),
      cost: document.getElementById('shift-click-cost')
    },
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
    hamburgerBtn: document.getElementById('hamburger-btn'),
    upgradesSidebar: document.getElementById('upgrades-sidebar'),
    closeUpgradesBtn: document.getElementById('close-upgrades'),
    container: document.querySelector('.container')
  };

  // Ensure power meter starts at 0%
  if (game.elements.powerMeterFill) {
    game.elements.powerMeterFill.style.height = '0%';
  }

  // Initialize feedback elements
  Object.keys(game.upgrades).forEach(type => {
    const element = game.elements[type];
    if (element && element.btn) {
      element.feedback = document.createElement('div');
      element.feedback.className = 'upgrade-feedback';
      element.btn.appendChild(element.feedback);
    }
  });
}

function initializePowerMeter() {
  const container = document.querySelector('.power-meter');
  if (!container) return;
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'power-meter-tooltip';
  tooltip.innerHTML = `
    <strong>Power Multiplier</strong><br>
    Click faster to increase your power level!<br><br>
    Power multiplies ALL click values:<br>
    • Regular clicks<br>
    • Shift-clicks (10x)<br>
    • Gold Rush bonus (5x)<br><br>
    <em>Current: <span id="current-multiplier">1.00</span>x</em>
  `;
  
  container.parentElement.appendChild(tooltip);
}

// Add this function before initGame
function updateSessionDuration() {
  const sessionDurationElement = document.getElementById('session-duration');
  if (!sessionDurationElement) return;
  
  const now = Date.now();
  const startTime = game.stats.startTime || now;
  const duration = Math.floor((now - startTime) / 1000);
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  sessionDurationElement.textContent = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize Game
function initGame() {
  cacheElements();
  initializePowerMeter();
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
  
  // Add CSS for falling money animation
  const moneyStyle = document.createElement('style');
  moneyStyle.textContent = `
    .falling-money {
      position: fixed;
      z-index: 1000;
      pointer-events: none;
      will-change: transform;
      filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
    }
  `;
  document.head.appendChild(moneyStyle);
  
  // Load saved game state
  loadGame();
  
  // Start auto-clicker interval
  game.intervals.autoClicker = setInterval(autoClickLoop, 1000);
  
  // Start the game loop for other updates
  gameLoop();
  
  // Update stats display
  updateStats();
  
  // Initialize session start time if not already set
  if (!game.stats.startTime) {
    game.stats.startTime = Date.now();
  }
  
  // Start session duration timer
  setInterval(updateSessionDuration, 1000);
  
  // Initial click me overlay state
  updateClickMeOverlay();
}

// Main game loop (for visual updates only)
function gameLoop() {
  updateGoldRushProgress();
  updateStats();
  if (document.getElementById('analyticsModal').classList.contains('show')) {
    updateAnalytics();
  }
  requestAnimationFrame(gameLoop);
}

// Event Listeners
function setupEventListeners() {
  // Gold bar click
  game.elements.goldBar.addEventListener('click', (e) => {
    const now = performance.now();
    const timeSinceLastClick = now - game.stats.lastManualClickTime;
    
    // Check if shift is pressed and if player has the upgrade
    const isShiftClick = e.shiftKey && game.stats.hasShiftClick;
    const baseClickAmount = isShiftClick ? 2 : 1; // Changed from 200000/100000 to 2/1
    const multiplier = game.stats.goldRushActive ? 5 : 1;
    
    // Apply both power and prestige multipliers
    const clickValue = baseClickAmount * multiplier * game.stats.currentPowerMultiplier * game.stats.prestigeMultiplier;
    
    // Add gold based on all multipliers
    game.stats.coinCount += clickValue;
    game.stats.totalGoldEarned += clickValue;
    
    // Update click stats
    game.stats.totalClicks += baseClickAmount;
    game.stats.manualClicks += baseClickAmount;
    game.stats.lastManualClickTime = now;
    game.stats.lastClicks.push({
      time: now,
      amount: 1, // Always count as 1 for power meter
      isManual: true,
      upgradeType: 'manual'
    });
    
    // Update gold rush progress
    if (!game.stats.goldRushActive) {
      game.stats.clicksSinceLastGoldRush += baseClickAmount;
    }
    
    // Update displays
    updateStats();
    
    // Save game
    saveGame();
  });
  
  game.elements.goldBar.addEventListener('mousedown', startHoldClick);
  game.elements.goldBar.addEventListener('mouseup', stopHoldClick);
  game.elements.goldBar.addEventListener('mouseleave', stopHoldClick);

  // Upgrade purchases
  game.elements.shiftClick.btn.addEventListener('click', () => buyUpgrade('shiftClick'));
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
  game.elements.shiftClick.btn.addEventListener('click', (e) => e.shiftKey && buyMax('shiftClick'));
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

  // Close sidebar when clicking outside, but not when clicking gold bar in desktop mode
  document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 768;
    const isGoldBar = game.elements.goldBar.contains(e.target);
    
    if (game.elements.upgradesSidebar.classList.contains('open') &&
        !game.elements.upgradesSidebar.contains(e.target) &&
        !game.elements.hamburgerBtn.contains(e.target) &&
        !(isGoldBar && !isMobile)) { // Don't close if clicking gold bar on desktop
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
      goldRushThreshold: 100,
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      goldRushCount: 0,
      peakPower: 0,
      upgradeProduction: {},
      currentPowerMultiplier: 1,
      prestigeLevel: 0,
      prestigeMultiplier: 1.0,
      hasShiftClick: false
    };

    // Reset upgrades to initial values
    game.upgrades = {
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
    };

    // Initialize upgrade production tracking
    Object.keys(game.upgrades).forEach(type => {
      game.stats.upgradeProduction[type] = 0;
    });

    // Clear saved game
    localStorage.removeItem('goldBarClickerSave');

    // Update displays
    updateStats();
    Object.keys(game.upgrades).forEach(type => updateUpgradeDisplay(type));
    
    // Show click me overlay since gold bars are 0
    updateClickMeOverlay();

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

  // Analytics button click handler
  document.getElementById('analytics-btn').addEventListener('click', () => {
    const analyticsModal = new bootstrap.Modal(document.getElementById('analyticsModal'));
    analyticsModal.show();
    
    // Initialize power monitor after modal is shown
    analyticsModal._element.addEventListener('shown.bs.modal', function () {
      setTimeout(() => {
        initPowerMonitor();
        updateAnalytics();
      }, 100);
    });
  });

  // Mobile Analytics button click handler
  if (game.elements.mobileAnalytics) {
    game.elements.mobileAnalytics.addEventListener('click', (e) => {
      e.preventDefault();
      const analyticsModal = new bootstrap.Modal(document.getElementById('analyticsModal'));
      analyticsModal.show();
      
      // Initialize power monitor after modal is shown
      analyticsModal._element.addEventListener('shown.bs.modal', function () {
        setTimeout(() => {
          initPowerMonitor();
          updateAnalytics();
        }, 100);
      });
      
      updateMobileNavActive('mobile-analytics');
    });
  }

  // Prestige button
  const prestigeBtn = document.getElementById('prestige-btn');
  if (prestigeBtn) {
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'prestige-tooltip';
    tooltip.innerHTML = `
      <div class="prestige-tooltip-title">Prestige System</div>
      <div class="prestige-tooltip-stats">
        Current Level: <span id="prestige-level">0</span><br>
        Current Multiplier: <span id="prestige-multiplier">1.0</span>x<br>
        Cost: <span id="prestige-cost">1,000,000</span> gold bars
      </div>
      <div class="prestige-tooltip-tip">
        Prestige to reset your game but keep a permanent multiplier!
      </div>
    `;
    prestigeBtn.appendChild(tooltip);
    
    // Add click handler
    prestigeBtn.addEventListener('click', prestige);
    
    // Update tooltip periodically
    setInterval(() => {
      const cost = calculatePrestigeCost();
      document.getElementById('prestige-level').textContent = game.stats.prestigeLevel;
      document.getElementById('prestige-multiplier').textContent = game.stats.prestigeMultiplier.toFixed(1);
      document.getElementById('prestige-cost').textContent = formatNumber(cost);
      
      // Enable/disable button based on affordability
      prestigeBtn.disabled = game.stats.coinCount < cost;
    }, 100);
  }
}

// Click Handling
function handleClick(e) {
  const now = Date.now();
  // Prevent multiple clicks from hold-to-click
  if (now - game.stats.lastManualClickTime < 200) return;
  game.stats.lastManualClickTime = now;
  
  // Check if shift is pressed and if player has the upgrade
  const isShiftClick = e.shiftKey && game.stats.hasShiftClick;
  const baseClickAmount = isShiftClick ? 2 : 1; // Changed from 200000/100000 to 2/1
  const multiplier = game.stats.goldRushActive ? 5 : 1;
  // Apply both power and prestige multipliers
  const clickValue = baseClickAmount * multiplier * game.stats.currentPowerMultiplier * game.stats.prestigeMultiplier;
  
  game.stats.totalClicks += baseClickAmount;
  game.stats.manualClicks += baseClickAmount;
  
  // Record all manual clicks for power meter, but only as single clicks
  game.stats.lastClicks.push({
    time: now,
    amount: 1, // Always count as 1 for power meter
    isManual: true,
    upgradeType: 'manual'
  });
  
  if (!game.stats.goldRushActive) {
    game.stats.clicksSinceLastGoldRush += baseClickAmount;
  }
  
  game.stats.coinCount += clickValue;
  game.stats.totalGoldEarned += clickValue;
  
  spawnClickFeedback(clickValue, e.clientX, e.clientY);
  
  // Create falling money effect from top of screen
  // Generate fewer coins (reduced by 50%)
  const numberOfCoins = Math.ceil(multiplier * 1.5); // Reduced from multiplier * 3
  for (let i = 0; i < numberOfCoins; i++) {
    createFallingMoney(e.clientX, e.clientY);
  }
  
  updateStats();
  
  // Check for Gold Rush
  if (game.stats.clicksSinceLastGoldRush >= game.stats.goldRushThreshold && 
      !game.stats.goldRushActive && 
      !game.goldRushTimeout) {
    startGoldRush();
  }
  
  // Save game state after each click
  saveGame();
  
  // Update click me overlay
  updateClickMeOverlay();
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
        game.stats.totalGoldEarned += earned;
        game.stats.upgradeProduction[type] += earned;
        
        // Record auto-clicks for CPS calculation with upgrade type
        game.stats.lastClicks.push({
          time: now,
          amount: upgrade.count * upgrade.cps,
          isManual: false,
          upgradeType: type
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
  
  // Check for Gold Rush in auto-clicker as well
  if (game.stats.clicksSinceLastGoldRush >= game.stats.goldRushThreshold && 
      !game.stats.goldRushActive && 
      !game.goldRushTimeout) {
    startGoldRush();
  }
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
  if (!upgrade) return;

  // Special handling for shift click power
  if (type === 'shiftClick') {
    if (game.stats.hasShiftClick) return; // Already purchased
    if (game.stats.coinCount >= upgrade.cost) {
      game.stats.coinCount -= upgrade.cost;
      game.stats.totalGoldSpent += upgrade.cost;
      game.stats.hasShiftClick = true;
      game.elements[type].btn.classList.add('shift-click-purchased');
      game.elements[type].btn.disabled = true;
      updateStats();
      showUpgradeFeedback(type, 1);
      saveGame();
    }
    return;
  }

  // Regular upgrade purchase logic
  if (game.stats.coinCount >= upgrade.cost) {
    game.stats.coinCount -= upgrade.cost;
    game.stats.totalGoldSpent += upgrade.cost;
    upgrade.count++;
    upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);
    updateStats();
    updateUpgradeDisplay(type);
    showUpgradeFeedback(type, 1);
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
  
  if (game.stats.goldRushActive) {
    // Count down during Gold Rush
    const remaining = game.goldRushTimeout ? 
      Math.ceil((game.goldRushTimeout - Date.now()) / 1000) : 0;
    game.elements.goldRushText.textContent = `GOLD RUSH! ${remaining}s`;
    
    // Shrink the fill bar during Gold Rush
    const shrinkPercentage = (remaining / 5) * 100; // 5 seconds total
    game.elements.goldRushFill.style.width = `${shrinkPercentage}%`;
  } else {
    game.elements.goldRushText.textContent = `Gold Rush: ${Math.floor(progress)}/${game.stats.goldRushThreshold}`;
    game.elements.goldRushFill.style.width = `${percentage}%`;
  }
}

function startGoldRush() {
  game.stats.goldRushCount++;
  game.stats.goldRushActive = true;
  game.goldRushTimeout = Date.now() + 5000; // 5 seconds from now
  
  // Increase threshold for next Gold Rush by 10%
  game.stats.goldRushThreshold = Math.floor(game.stats.goldRushThreshold * 1.4);
  
  // Create visual effects
  createConfetti();
  createGoldRushBanner();
  
  // Create falling money from top of screen during Gold Rush (reduced by 50%)
  for (let i = 0; i < 2; i++) { // Reduced from 5 to 2
    const x = Math.random() * window.innerWidth;
    createFallingMoney(x, 0, 5);
  }
  
  // Add screen shake effect
  document.body.classList.add('gold-rush-active');
  
  // Set timeout to end Gold Rush
  setTimeout(() => {
    game.stats.goldRushActive = false;
    game.stats.clicksSinceLastGoldRush = 0;
    game.goldRushTimeout = null;
    
    // Remove visual effects
    document.body.classList.remove('gold-rush-active');
    document.querySelectorAll('.confetti-container, .gold-rush-banner').forEach(el => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    });
  }, 5000);
}

function createConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  
  // Create 200 pieces of confetti with varied colors and shapes
  for (let i = 0; i < 200; i++) {
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
  feedback.textContent = `+${amount.toFixed(1)}`;
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
  // Update gold count displays
  game.elements.coinCount.textContent = formatNumber(game.stats.coinCount);
  game.elements.upgradesGoldCount.textContent = formatNumber(game.stats.coinCount);
  
  // Update upgrade buttons
  updateUpgradeButtons();
  
  // Update gold rush progress
  updateGoldRushProgress();
  
  // Update power meter
  updatePowerMeter(calculateActualCPS());
  
  // Update analytics if modal is open
  if (document.getElementById('analyticsModal').classList.contains('show')) {
    updateAnalytics();
  }
}

function updatePowerMeter(cps) {
  // Calculate manual CPS and auto-clicks from first upgrade only
  const now = Date.now();
  const recentClicks = game.stats.lastClicks
    .filter(click => {
      // Count clicks from the last second AND either manual clicks or auto-clicks from first upgrade
      return now - click.time <= 1000 && 
        (click.isManual === true || (click.isManual === false && click.upgradeType === 'auto'));
    })
    .reduce((total, click) => {
      // If it's an auto-click, count it as half
      if (click.isManual === false) {
        return total + (click.amount * 0.5);
      }
      return total + click.amount;
    }, 0);
  
  // Calculate height percentage based on total CPS (max CPS is 10)
  const maxCPS = 10;
  const percentage = Math.min((recentClicks / maxCPS) * 100, 100);
  
  // Calculate power multiplier based on percentage (1x to 2x)
  game.stats.currentPowerMultiplier = 1 + (percentage / 100);
  
  // Update height if element exists - ensure it starts at 0
  if (game.elements.powerMeterFill) {
    // Set initial height to 0 if not already set
    if (!game.elements.powerMeterFill.style.height) {
      game.elements.powerMeterFill.style.height = '0%';
    }
    
    game.elements.powerMeterFill.style.height = `${percentage}%`;
    
    // Add/remove high-power class based on CPS
    if (recentClicks > maxCPS * 0.7) { // Over 70% of max
      game.elements.powerMeterFill.classList.add('high-power');
    } else {
      game.elements.powerMeterFill.classList.remove('high-power');
    }
  }
  
  // Update multiplier display
  const multiplierDisplay = document.getElementById('current-multiplier');
  if (multiplierDisplay) {
    multiplierDisplay.textContent = game.stats.currentPowerMultiplier.toFixed(2);
  }
  
  // Update CPS text if element exists
  if (game.elements.cpsDisplay) {
    game.elements.cpsDisplay.textContent = `${cps.toFixed(1)} CPS`;
  }
  
  // Update peak power if current percentage is higher
  if (percentage > game.stats.peakPower) {
    game.stats.peakPower = percentage;
  }
}

// Add number formatting function
function formatNumber(num) {
  // Handle undefined, null, or NaN values
  if (num === undefined || num === null || isNaN(num)) {
    return '0.0';
  }
  
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
  if (!upgrade || !element) return;

  // Special handling for shift click power
  if (type === 'shiftClick') {
    if (game.stats.hasShiftClick) {
      element.count.textContent = '1';
      element.btn.classList.add('shift-click-purchased');
      element.btn.disabled = true;
    }
    return;
  }

  // Regular upgrade display update
  element.count.textContent = upgrade.count;
  element.cost.textContent = formatNumber(upgrade.cost);
}

function updateUpgradeButtons() {
  Object.keys(game.upgrades).forEach(type => {
    const element = game.elements[type];
    if (!element || !element.btn) return;

    const upgrade = game.upgrades[type];
    const canAfford = game.stats.coinCount >= upgrade.cost;
    
    // Update button disabled state
    element.btn.disabled = !canAfford;
    
    // Update cost display
    if (element.cost) {
      element.cost.textContent = formatNumber(upgrade.cost);
    }
    
    // Update count display
    if (element.count) {
      element.count.textContent = upgrade.count;
    }
  });
}

function showUpgradeFeedback(type, amount) {
  // Feedback removed as requested
}

// Tooltips
function setupTooltips() {
  Object.keys(game.upgrades).forEach(type => {
    const element = game.elements[type];
    const upgrade = game.upgrades[type];
    
    // Create info icon
    const infoIcon = document.createElement('div');
    infoIcon.className = 'upgrade-info-icon';
    infoIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
    
    // Create info panel
    const infoPanel = document.createElement('div');
    infoPanel.className = 'upgrade-info-panel';
    infoPanel.innerHTML = `
      <button class="info-panel-close">&times;</button>
      <div class="info-title">${upgrade.name}</div>
      <div class="info-stats">
        <div>Base Production: ${upgrade.cps} CPS</div>
        <div>Cost Increase: ${Math.round((upgrade.costMultiplier - 1) * 100)}% per purchase</div>
      </div>
      <div class="info-tip">Shift-click to buy max</div>
    `;
    
    // Add click handler for info icon
    infoIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close any other open panels
      document.querySelectorAll('.upgrade-info-panel.active').forEach(panel => {
        if (panel !== infoPanel) {
          panel.classList.remove('active');
        }
      });
      // Toggle this panel
      infoPanel.classList.toggle('active');
    });
    
    // Add click handler for close button
    const closeBtn = infoPanel.querySelector('.info-panel-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      infoPanel.classList.remove('active');
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!infoIcon.contains(e.target) && !infoPanel.contains(e.target)) {
        infoPanel.classList.remove('active');
      }
    });
    
    // Add elements to the button
    element.btn.appendChild(infoIcon);
    element.btn.appendChild(infoPanel);
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
      startTime: game.stats.startTime,
      totalGoldEarned: game.stats.totalGoldEarned,
      totalGoldSpent: game.stats.totalGoldSpent,
      goldRushCount: game.stats.goldRushCount,
      peakPower: game.stats.peakPower,
      upgradeProduction: game.stats.upgradeProduction,
      currentPowerMultiplier: game.stats.currentPowerMultiplier,
      prestigeLevel: game.stats.prestigeLevel,
      prestigeMultiplier: game.stats.prestigeMultiplier,
      hasShiftClick: game.stats.hasShiftClick
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
      singularity: { count: game.upgrades.singularity.count, cost: game.upgrades.singularity.cost },
      shiftClick: { count: game.upgrades.shiftClick.count, cost: game.upgrades.shiftClick.cost }
    }
  };
  
  localStorage.setItem('goldBarClickerSave', JSON.stringify(saveData));
}

function loadGame() {
  const savedGame = localStorage.getItem('goldBarClickerSave');
  if (savedGame) {
    const parsed = JSON.parse(savedGame);
    
    // Load stats
    Object.assign(game.stats, parsed.stats);
    
    // Load upgrades
    Object.keys(parsed.upgrades).forEach(type => {
      if (game.upgrades[type]) {
        game.upgrades[type].count = parsed.upgrades[type].count;
        game.upgrades[type].cost = parsed.upgrades[type].cost;
      }
    });

    // Update UI
    updateStats();
    Object.keys(game.upgrades).forEach(type => {
      updateUpgradeDisplay(type);
    });
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

// Power Monitor Variables
let powerData = new Array(600).fill(0); // Store 10 minutes of data (600 seconds)
let powerDataIndex = 0;
let lastPowerUpdate = 0;
let animationFrameId = null;
let currentTimeScale = 300; // Default to 5 minutes (300 seconds)
let isCollectingData = true; // Flag to control data collection

// Function to collect power data
function collectPowerData() {
  if (!isCollectingData) return;
  
  const powerMeterFill = document.getElementById('power-meter-fill');
  const currentPower = powerMeterFill ? parseFloat(powerMeterFill.style.height) || 0 : 0;
  
  const now = Date.now();
  if (now - lastPowerUpdate >= 50) { // Update more frequently for smoother animation
    powerData[powerDataIndex] = currentPower;
    powerDataIndex = (powerDataIndex + 1) % 600;
    lastPowerUpdate = now;
  }
}

// Function to render power monitor
function renderPowerMonitor() {
  const canvas = document.getElementById('powerMonitor');
  if (!canvas) return;

  const container = canvas.closest('.power-monitor');
  if (!container) return;

  const containerWidth = container.clientWidth - 30;
  const containerHeight = 200;

  canvas.width = containerWidth;
  canvas.height = containerHeight;
  canvas.style.width = '100%';
  canvas.style.height = '200px';
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  
  function animate() {
    if (!document.getElementById('analyticsModal').classList.contains('show')) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }

    // Clear canvas with semi-transparent background
    ctx.fillStyle = 'rgba(44, 44, 44, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(184, 134, 11, 0.2)';
    ctx.lineWidth = 1;

    // Vertical grid lines and time labels
    const timeIntervals = currentTimeScale / 10;
    for (let x = 0; x < canvas.width; x += canvas.width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();

      // Add time labels
      const seconds = Math.floor((x / canvas.width) * currentTimeScale);
      ctx.fillStyle = 'rgba(184, 134, 11, 0.5)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      if (seconds === 0) {
        ctx.fillText('now', x + 20, canvas.height - 5);
      } else {
        ctx.fillText(`-${seconds}s`, x + 20, canvas.height - 5);
      }
    }

    // Horizontal grid lines and power level labels
    for (let y = 0; y < canvas.height; y += canvas.height / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();

      // Add power level labels
      const powerLevel = 100 - Math.floor((y / canvas.height) * 100);
      ctx.fillStyle = 'rgba(184, 134, 11, 0.5)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${powerLevel}%`, 5, y + 12);
    }

    // Get current power level from power meter
    const powerMeterFill = document.getElementById('power-meter-fill');
    const currentPower = powerMeterFill ? parseFloat(powerMeterFill.style.height) || 0 : 0;
    
    // Draw power line
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calculate color based on power percentage (red for low, green for high)
    const powerPercentage = currentPower / 100;
    const red = Math.round(255 * (1 - powerPercentage));
    const green = Math.round(255 * powerPercentage);
    
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, `rgba(${red}, ${green}, 0, 1)`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, 0, 0.7)`);
    
    ctx.strokeStyle = gradient;
    ctx.shadowColor = `rgba(${red}, ${green}, 0, 0.5)`;
    ctx.shadowBlur = 5;

    // Draw the line based on current time scale
    let firstPoint = true;
    const dataPoints = currentTimeScale;
    const step = canvas.width / dataPoints;

    for (let i = 0; i < dataPoints; i++) {
      const dataIndex = ((powerDataIndex - i + 600) % 600);
      const x = canvas.width - (i * step);
      const y = canvas.height - (powerData[dataIndex] / 100 * canvas.height);
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Update stats display
    const currentPowerDisplay = document.getElementById('current-power');
    const peakPowerDisplay = document.getElementById('peak-power');
    
    if (currentPowerDisplay) {
      currentPowerDisplay.textContent = currentPower.toFixed(1) + '%';
      currentPowerDisplay.style.color = `rgb(${red}, ${green}, 0)`;
    }
    
    if (peakPowerDisplay) {
      const peakPower = Math.max(...powerData);
      peakPowerDisplay.textContent = peakPower.toFixed(1) + '%';
      peakPowerDisplay.style.color = '#4CAF50';
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Start animation
  animate();
}

function initPowerMonitor() {
  const container = document.querySelector('.power-monitor');
  if (!container) return;

  // Check if time scale controls already exist
  let timeScaleControls = container.querySelector('.time-scale-controls');
  if (!timeScaleControls) {
    timeScaleControls = document.createElement('div');
    timeScaleControls.className = 'time-scale-controls';
    timeScaleControls.innerHTML = `
      <button class="time-scale-btn active" data-seconds="300">5m</button>
      <button class="time-scale-btn" data-seconds="600">10m</button>
      <button class="time-scale-btn" data-seconds="1800">30m</button>
      <button class="time-scale-btn" data-seconds="3600">1h</button>
    `;
    container.insertBefore(timeScaleControls, container.firstChild);

    // Add event listeners to time scale buttons
    timeScaleControls.querySelectorAll('.time-scale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seconds = parseInt(e.target.dataset.seconds);
        currentTimeScale = seconds;
        
        // Update active button
        timeScaleControls.querySelectorAll('.time-scale-btn').forEach(b => {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
      });
    });
  }

  // Start data collection
  isCollectingData = true;
  setInterval(collectPowerData, 50); // Collect data every 50ms

  // Initialize renderer
  renderPowerMonitor();
}

function updateAnalytics() {
  // Update gold metrics
  document.getElementById('total-gold-earned').textContent = formatNumber(game.stats.totalGoldEarned || 0);
  document.getElementById('total-gold-spent').textContent = formatNumber(game.stats.totalGoldSpent || 0);
  document.getElementById('net-worth').textContent = formatNumber(game.stats.coinCount || 0);
  document.getElementById('gold-rush-count').textContent = game.stats.goldRushCount || 0;
  
  // Update prestige stats
  document.getElementById('analytics-prestige-level').textContent = game.stats.prestigeLevel || 0;
  document.getElementById('analytics-prestige-multiplier').textContent = `${(game.stats.prestigeMultiplier || 1).toFixed(1)}x`;
  
  // Calculate current CPS from both manual clicks and auto-clickers
  const currentCPS = calculateActualCPS();
  const autoCPS = calculateTotalCPS();
  
  // Calculate average manual CPS from recent clicks
  const now = Date.now();
  const recentManualClicks = game.stats.lastClicks
    .filter(click => now - click.time <= 60000) // Last minute of clicks
    .reduce((total, click) => total + click.amount, 0);
  const averageManualCPS = recentManualClicks / 60; // Convert to per second
  
  // Calculate projected daily earnings
  const secondsPerDay = 86400; // 24 * 60 * 60
  const projectedDailyFromAuto = autoCPS * secondsPerDay;
  const projectedDailyFromManual = averageManualCPS * secondsPerDay;
  const totalProjectedDaily = projectedDailyFromAuto + projectedDailyFromManual;
  
  // Update production rates
  document.getElementById('current-cps').textContent = `${formatNumber(currentCPS)} /s`;
  document.getElementById('gold-per-minute').textContent = `${formatNumber(currentCPS * 60)} /min`;
  document.getElementById('gold-per-hour').textContent = `${formatNumber(currentCPS * 3600)} /hr`;
  document.getElementById('gold-per-day').textContent = `${formatNumber(totalProjectedDaily)} /day`;
  
  // Update session stats
  const sessionDuration = Math.floor((performance.now() - game.stats.startTime) / 1000);
  const hours = Math.floor(sessionDuration / 3600);
  const minutes = Math.floor((sessionDuration % 3600) / 60);
  const seconds = sessionDuration % 60;
  document.getElementById('session-duration').textContent = 
    `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  document.getElementById('manual-clicks').textContent = formatNumber(game.stats.manualClicks || 0);
  document.getElementById('auto-clicks').textContent = formatNumber(game.stats.autoClicks || 0);
  
  const totalClicks = (game.stats.manualClicks || 0) + (game.stats.autoClicks || 0);
  const efficiency = totalClicks > 0 ? ((game.stats.autoClicks || 0) / totalClicks * 100) : 0;
  document.getElementById('click-efficiency').textContent = `${efficiency.toFixed(1)}%`;
  
  // Update upgrade analytics
  const upgradeAnalytics = document.getElementById('upgrade-analytics');
  upgradeAnalytics.innerHTML = '';
  
  Object.entries(game.upgrades).forEach(([type, upgrade]) => {
    const row = document.createElement('tr');
    const totalCPS = (upgrade.count || 0) * (upgrade.cps || 0);
    const lifetimeProduction = game.stats.upgradeProduction[type] || 0;
    const roi = upgrade.count > 0 ? (upgrade.cost / (totalCPS * 3600)) : 0;
    
    row.innerHTML = `
      <td>${upgrade.name || type}</td>
      <td>${upgrade.count || 0}</td>
      <td>${(upgrade.cps || 0).toFixed(1)}</td>
      <td>${totalCPS.toFixed(1)}</td>
      <td>${formatNumber(lifetimeProduction)}</td>
      <td>${roi.toFixed(2)}</td>
    `;
    
    upgradeAnalytics.appendChild(row);
  });
}

// Add prestige cost calculation function
function calculatePrestigeCost() {
  const baseCost = 1000000; // 1 million
  const multiplier = 1 + (game.stats.prestigeLevel * 0.5); // Each prestige increases cost by 50%
  return Math.floor(baseCost * multiplier);
}

// Add prestige function
function prestige() {
  const cost = calculatePrestigeCost();
  if (game.stats.coinCount >= cost) {
    // Increase prestige level and multiplier
    game.stats.prestigeLevel++;
    game.stats.prestigeMultiplier = 1 + (game.stats.prestigeLevel * 0.5);
    
    // Save prestige stats before reset
    const prestigeStats = {
      prestigeLevel: game.stats.prestigeLevel,
      prestigeMultiplier: game.stats.prestigeMultiplier
    };
    
    // Reset all other stats
    game.stats = {
      ...prestigeStats,
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
      goldRushThreshold: 100,
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      goldRushCount: 0,
      peakPower: 0,
      upgradeProduction: {}
    };
    
    // Reset upgrades
    Object.keys(game.upgrades).forEach(type => {
      game.upgrades[type].count = 0;
      game.upgrades[type].cost = game.upgrades[type].cost;
    });
    
    // Initialize upgrade production tracking
    Object.keys(game.upgrades).forEach(type => {
      game.stats.upgradeProduction[type] = 0;
    });
    
    // Update displays
    updateStats();
    Object.keys(game.upgrades).forEach(type => updateUpgradeDisplay(type));
    
    // Save game
    saveGame();
    
    // Show prestige animation
    showPrestigeAnimation();
  }
}

// Add prestige animation function
function showPrestigeAnimation() {
  // Create prestige effect
  const effect = document.createElement('div');
  effect.className = 'prestige-effect';
  effect.innerHTML = `
    <div class="prestige-text">PRESTIGE ${game.stats.prestigeLevel}</div>
    <div class="prestige-multiplier">${game.stats.prestigeMultiplier.toFixed(1)}x MULTIPLIER</div>
  `;
  document.body.appendChild(effect);
  
  // Remove effect after animation
  setTimeout(() => effect.remove(), 3000);
}

// Add updateClickMeOverlay function
function updateClickMeOverlay() {
  if (game.elements.instructionOverlay) {
    if (game.stats.coinCount > 0) {
      game.elements.instructionOverlay.style.display = 'none';
      // Clear any existing timeout when hiding
      if (game.instructionOverlayTimeout) {
        clearTimeout(game.instructionOverlayTimeout);
        game.instructionOverlayTimeout = null;
      }
    } else {
      game.elements.instructionOverlay.style.display = 'flex';
      // Set a 10-second timeout to auto-dismiss
      if (!game.instructionOverlayTimeout) {
        game.instructionOverlayTimeout = setTimeout(() => {
          game.elements.instructionOverlay.style.display = 'none';
          game.instructionOverlayTimeout = null;
        }, 10000);
      }
    }
  }
}

// Add createFallingMoney function at the end of the file
function createFallingMoney(x, y, multiplier = 1) {
  const moneyImages = [
    'assets/dollar.png',
    'assets/money.png',
    'assets/money-bags.png'
  ];
  const count = Math.ceil(multiplier * 1.5); // Reduced from multiplier * 3
  
  for (let i = 0; i < count; i++) {
    const money = document.createElement('img');
    money.className = 'falling-money';
    money.src = moneyImages[Math.floor(Math.random() * moneyImages.length)];
    
    // Random position across the entire viewport width if starting from top (y=0)
    // Otherwise, use the provided x position with some randomness
    const randomX = y === 0 ? Math.random() * window.innerWidth : x + (Math.random() * 100 - 50);
    money.style.left = `${randomX}px`;
    money.style.top = y === 0 ? '-50px' : `${y - 50}px`; // Start slightly above if from top
    
    // Random rotation and animation duration
    const duration = Math.random() * 1.5 + 1.5; // 1.5-3 seconds
    
    // Random size (slightly larger for better visibility)
    const size = Math.random() * 30 + 25; // 25-55px
    money.style.width = `${size}px`;
    money.style.height = `${size}px`;
    
    // Random initial rotation and fall path
    const rotation = Math.random() * 360;
    const horizontalMovement = Math.random() * 200 - 100; // -100px to +100px horizontal movement
    
    // Create keyframe animation for this specific element
    const keyframeStyle = document.createElement('style');
    const animationName = `fall${Date.now()}${i}`;
    keyframeStyle.textContent = `
      @keyframes ${animationName} {
        0% {
          transform: translateX(0) translateY(0) rotate(${rotation}deg);
          opacity: 1;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateX(${horizontalMovement}px) translateY(${window.innerHeight + 100}px) rotate(${rotation + 720}deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(keyframeStyle);
    
    // Apply the unique animation
    money.style.animation = `${animationName} ${duration}s ease-in forwards`;
    
    document.body.appendChild(money);
    
    // Cleanup after animation
    setTimeout(() => {
      money.remove();
      keyframeStyle.remove();
    }, duration * 1000);
  }
} 