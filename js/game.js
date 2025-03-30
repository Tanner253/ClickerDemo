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
    prestigeMultiplier: 1.0
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

// Initialize upgrade production tracking
Object.keys(game.upgrades).forEach(type => {
  game.stats.upgradeProduction[type] = 0;
});

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
    powerMeterFill: document.getElementById('power-meter-fill'),
    instructionOverlay: document.getElementById('instruction-overlay'),
    
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
    hamburgerBtn: document.getElementById('hamburger-btn'),
    upgradesSidebar: document.getElementById('upgrades-sidebar'),
    closeUpgradesBtn: document.getElementById('close-upgrades'),
    container: document.querySelector('.container')
  };

  // Ensure power meter starts at 0%
  if (game.elements.powerMeterFill) {
    game.elements.powerMeterFill.style.height = '0%';
  }
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
  if (document.getElementById('analyticsModal').classList.contains('show')) {
    updateAnalytics();
  }
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

  // Mobile Navigation
  const mobileUpgrades = document.getElementById('mobile-upgrades');
  const mobileAnalytics = document.getElementById('mobile-analytics');
  const mobileSettings = document.getElementById('mobile-settings');
  const mobilePrestige = document.getElementById('mobile-prestige');

  if (mobileUpgrades) {
    mobileUpgrades.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling
      toggleUpgradesSidebar();
    });
  }

  if (mobileAnalytics) {
    mobileAnalytics.addEventListener('click', (e) => {
      e.preventDefault();
      const analyticsModal = new bootstrap.Modal(document.getElementById('analyticsModal'));
      analyticsModal.show();
      updateMobileNavActive('mobile-analytics');
    });
  }

  if (mobileSettings) {
    mobileSettings.addEventListener('click', (e) => {
      e.preventDefault();
      const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
      settingsModal.show();
      updateMobileNavActive('mobile-settings');
    });
  }

  if (mobilePrestige) {
    mobilePrestige.addEventListener('click', (e) => {
      e.preventDefault();
      prestige();
      updateMobileNavActive('mobile-prestige');
    });
  }

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (game.elements.upgradesSidebar.classList.contains('open') &&
        !game.elements.upgradesSidebar.contains(e.target) &&
        !e.target.closest('#mobile-upgrades')) {
      closeSidebar();
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
      prestigeMultiplier: 1.0
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
    initPowerMonitor();
    updateAnalytics();
  });

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

// Add function to update mobile navigation active state
function updateMobileNavActive(activeId) {
  // Remove active class from all nav items
  const navItems = document.querySelectorAll('.mobile-nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  
  // Add active class to clicked item
  const activeItem = document.getElementById(activeId);
  if (activeItem) {
    activeItem.classList.add('active');
  }
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
  // Apply both power and prestige multipliers
  const clickValue = baseClickAmount * multiplier * game.stats.currentPowerMultiplier * game.stats.prestigeMultiplier;
  
  game.stats.totalClicks += baseClickAmount;
  game.stats.manualClicks += baseClickAmount;
  
  // Record all manual clicks for power meter, but only as single clicks
  game.stats.lastClicks.push({
    time: now,
    amount: 1, // Always count as 1 for power meter
    isManual: true
  });
  
  if (!game.stats.goldRushActive) {
    game.stats.clicksSinceLastGoldRush += baseClickAmount;
  }
  
  game.stats.coinCount += clickValue;
  game.stats.totalGoldEarned += clickValue;
  
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
        
        // Record auto-clicks for CPS calculation (but not power meter)
        game.stats.lastClicks.push({
          time: now,
          amount: upgrade.count * upgrade.cps,
          isManual: false
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
  
  if (game.stats.coinCount >= upgrade.cost) {
    game.stats.totalGoldSpent += upgrade.cost;
    game.stats.coinCount -= upgrade.cost;
    upgrade.count++;
    upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);
    
    updateUpgradeDisplay(type);
    updateStats();
    updateAnalytics();
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
  // Update coin count display
  game.elements.coinCount.textContent = formatNumber(game.stats.coinCount);
  
  // Show/hide instruction overlay based on coin count
  if (game.stats.coinCount === 0) {
    game.elements.instructionOverlay.style.display = 'flex';
  } else {
    game.elements.instructionOverlay.style.display = 'none';
  }
  
  // Calculate actual CPS from recent clicks
  const cps = calculateActualCPS();
  
  // Update displays if elements exist
  if (game.elements.coinCount) {
    game.elements.coinCount.textContent = formatNumber(game.stats.coinCount);
  }
  
  // Update power meter and CPS display
  updatePowerMeter(cps);
  
  // Update upgrade buttons state
  updateUpgradeButtons();
}

function updatePowerMeter(cps) {
  // Calculate manual CPS from recent clicks only
  const now = Date.now();
  const recentManualClicks = game.stats.lastClicks
    .filter(click => {
      // Only count clicks from the last second AND only manual clicks
      return now - click.time <= 1000 && click.isManual === true;
    })
    .reduce((total, click) => total + click.amount, 0);
  
  // Calculate height percentage based on manual CPS only (max CPS is 10 for manual clicks)
  const maxManualCPS = 10;
  const percentage = Math.min((recentManualClicks / maxManualCPS) * 100, 100);
  
  // Calculate power multiplier based on percentage (1x to 2x)
  game.stats.currentPowerMultiplier = 1 + (percentage / 100);
  
  // Update height if element exists - ensure it starts at 0
  if (game.elements.powerMeterFill) {
    // Set initial height to 0 if not already set
    if (!game.elements.powerMeterFill.style.height) {
      game.elements.powerMeterFill.style.height = '0%';
    }
    
    game.elements.powerMeterFill.style.height = `${percentage}%`;
    
    // Add/remove high-power class based on manual CPS
    if (recentManualClicks > maxManualCPS * 0.7) { // Over 70% of max
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
      startTime: game.stats.startTime,
      totalGoldEarned: game.stats.totalGoldEarned,
      totalGoldSpent: game.stats.totalGoldSpent,
      goldRushCount: game.stats.goldRushCount,
      peakPower: game.stats.peakPower,
      upgradeProduction: game.stats.upgradeProduction,
      currentPowerMultiplier: game.stats.currentPowerMultiplier
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
    game.stats.totalGoldEarned = parsed.stats.totalGoldEarned || 0;
    game.stats.totalGoldSpent = parsed.stats.totalGoldSpent || 0;
    game.stats.goldRushCount = parsed.stats.goldRushCount || 0;
    game.stats.peakPower = parsed.stats.peakPower || 0;
    game.stats.upgradeProduction = parsed.stats.upgradeProduction || {};
    game.stats.currentPowerMultiplier = parsed.stats.currentPowerMultiplier || 1;
    
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

// Update toggle upgrades sidebar function
function toggleUpgradesSidebar() {
  const isOpen = game.elements.upgradesSidebar.classList.contains('open');
  const mobileUpgradesBtn = document.getElementById('mobile-upgrades');
  
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
  
  // Update mobile navigation active state
  updateMobileNavActive(isOpen ? null : 'mobile-upgrades');
}

// Split toggle into open/close functions
function openSidebar() {
  game.elements.upgradesSidebar.classList.add('open');
  game.elements.container.classList.add('sidebar-open');
  document.getElementById('mobile-upgrades').classList.add('active');
}

function closeSidebar() {
  game.elements.upgradesSidebar.classList.remove('open');
  game.elements.container.classList.remove('sidebar-open');
  document.getElementById('mobile-upgrades').classList.remove('active');
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

// Power Monitor
let powerMonitor = null;
let powerData = Array(600).fill(0); // Store 10 minutes of data (600 seconds)
let powerDataIndex = 0;
let lastPowerUpdate = 0;
let animationFrameId = null;

function initPowerMonitor() {
  const canvas = document.getElementById('powerMonitor');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  function animate() {
    if (!document.getElementById('analyticsModal').classList.contains('show')) {
      requestAnimationFrame(animate);
      return;
    }
    
    // Semi-transparent background for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Get current power level from power meter
    const powerMeterFill = document.getElementById('power-meter-fill');
    const powerPercentage = powerMeterFill ? 
      parseFloat(powerMeterFill.style.height) || 0 : 0;
    
    // Update power data array every second
    const now = Date.now();
    if (now - lastPowerUpdate >= 1000) {
      powerData[powerDataIndex] = powerPercentage;
      powerDataIndex = (powerDataIndex + 1) % 600; // Wrap around after 10 minutes
      lastPowerUpdate = now;
    }
    
    // Draw grid with more lines for better readability
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (every minute)
    for (let x = 0; x < width; x += (width / 10)) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Add time labels (every minute)
      const minutes = Math.floor((x / width) * 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${minutes}m`, x, height - 5);
    }
    
    // Horizontal grid lines (every 20% power)
    for (let y = 0; y <= height; y += (height / 5)) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Add power level labels
      const powerLevel = 100 - Math.floor((y / height) * 100);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${powerLevel}%`, 5, y + 4);
    }
    
    // Draw power line with gradient effect
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const hue = 120 * (1 - powerPercentage/100); // Green to Red
    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue + 20}, 100%, 50%)`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    
    // Draw the line with smooth curves
    let firstPoint = true;
    for (let i = 0; i < powerData.length; i++) {
      const x = (i / powerData.length) * width;
      const y = height - (powerData[i] / 100) * height;
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        // Use quadratic curves for smoother lines
        const prevX = ((i - 1) / powerData.length) * width;
        const prevY = height - (powerData[i - 1] / 100) * height;
        const xc = (x + prevX) / 2;
        const yc = (y + prevY) / 2;
        ctx.quadraticCurveTo(prevX, prevY, xc, yc);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Calculate min and max power levels
    const minPower = Math.min(...powerData);
    const maxPower = Math.max(...powerData);
    
    // Add power level indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Current: ${powerPercentage.toFixed(1)}%`, width - 10, 20);
    ctx.fillText(`Peak: ${maxPower.toFixed(1)}%`, width - 10, 40);
    ctx.fillText(`Low: ${minPower.toFixed(1)}%`, width - 10, 60);
    
    // Add time range indicator
    ctx.textAlign = 'left';
    ctx.fillText('Last 10 minutes', 10, 20);
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

function updateAnalytics() {
  // Update gold metrics
  document.getElementById('total-gold-earned').textContent = formatNumber(game.stats.totalGoldEarned || 0);
  document.getElementById('total-gold-spent').textContent = formatNumber(game.stats.totalGoldSpent || 0);
  document.getElementById('net-worth').textContent = formatNumber(game.stats.coinCount || 0);
  document.getElementById('gold-rush-count').textContent = game.stats.goldRushCount || 0;
  
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

// Update click me overlay
function updateClickMeOverlay() {
  if (game.elements.instructionOverlay) {
    game.elements.instructionOverlay.style.display = game.stats.coinCount > 0 ? 'none' : 'flex';
  }
}

// Add CSS for active mobile nav state
const style = document.createElement('style');
style.textContent = `
  .mobile-nav-item.active {
    color: #ffd700;
    transform: scale(1.1);
  }
  .mobile-nav-item.active i {
    color: #ffd700;
  }
`;
document.head.appendChild(style);

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 