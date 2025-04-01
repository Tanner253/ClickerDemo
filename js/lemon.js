let lemonsCaught = 0;
let activeLemons = [];
let lemonPowerMultiplier = 1;
let lemonPowerTimer = null;
let powerBoostIndicator = null;

function createPowerBoostIndicator() {
    if (!powerBoostIndicator) {
        powerBoostIndicator = document.createElement('div');
        powerBoostIndicator.className = 'power-boost-indicator';
        powerBoostIndicator.innerHTML = '⚡ POWER BOOST ACTIVE ⚡';
        document.body.appendChild(powerBoostIndicator);
    }
}

function createLemon() {
    const lemon = document.createElement('div');
    lemon.className = 'lemon';
    
    // Random starting position
    const startX = Math.random() * (window.innerWidth - 40);
    lemon.style.left = `${startX}px`;
    
    // Add click handler
    lemon.addEventListener('click', () => catchLemon(lemon));
    
    // Add to document
    document.body.appendChild(lemon);
    activeLemons.push(lemon);
    
    // Remove lemon after animation
    setTimeout(() => {
        if (lemon.parentNode) {
            lemon.remove();
            activeLemons = activeLemons.filter(l => l !== lemon);
        }
    }, 3000);
}

function catchLemon(lemon) {
    if (lemon.classList.contains('caught')) return;
    
    // Play lemon pop sound
    soundManager.playSound('lemonPop');
    
    lemon.classList.add('caught');
    lemonsCaught++;
    
    // Update analytics counter
    const lemonsCaughtElement = document.getElementById('lemons-caught');
    if (lemonsCaughtElement) {
        lemonsCaughtElement.textContent = lemonsCaught;
    }
    
    // Double power level
    lemonPowerMultiplier *= 2;
    
    // Add visual effects
    activatePowerBoost();
    
    // Clear existing timer if any
    if (lemonPowerTimer) {
        clearTimeout(lemonPowerTimer);
    }
    
    // Set new timer
    lemonPowerTimer = setTimeout(() => {
        lemonPowerMultiplier /= 2;
        if (lemonPowerMultiplier === 1) {
            deactivatePowerBoost();
        }
    }, 30000);
}

function activatePowerBoost() {
    const powerMeterContainer = document.querySelector('.power-meter-container');
    if (powerMeterContainer) {
        powerMeterContainer.classList.add('powered-up');
    }
    
    createPowerBoostIndicator();
    powerBoostIndicator.classList.add('active');
}

function deactivatePowerBoost() {
    const powerMeterContainer = document.querySelector('.power-meter-container');
    if (powerMeterContainer) {
        powerMeterContainer.classList.remove('powered-up');
    }
    
    if (powerBoostIndicator) {
        powerBoostIndicator.classList.remove('active');
    }
}

let lemonSpawnerInterval = null;

// Randomly spawn lemons
function startLemonSpawner() {
    // Clear any existing interval
    if (lemonSpawnerInterval) {
        clearInterval(lemonSpawnerInterval);
    }
    
    lemonSpawnerInterval = setInterval(() => {
        if (Math.random() < 0.2) { // 20% chance every 5 seconds
            createLemon();
        }
    }, 5000);
}

// Initialize lemon system
function initLemonSystem() {
    // Start the lemon system immediately
    createPowerBoostIndicator();
    startLemonSpawner();
    
    // Override updatePowerMeter if it exists
    if (typeof window.updatePowerMeter === 'function') {
        const originalUpdatePowerMeter = window.updatePowerMeter;
        window.updatePowerMeter = function(cps) {
            originalUpdatePowerMeter(cps);
            
            const powerMeterFill = document.getElementById('power-meter-fill');
            if (powerMeterFill) {
                const currentHeight = parseFloat(powerMeterFill.style.height) || 0;
                const newHeight = Math.min(currentHeight * lemonPowerMultiplier, 100);
                powerMeterFill.style.height = `${newHeight}%`;
                
                const multiplierDisplay = document.getElementById('current-multiplier');
                if (multiplierDisplay) {
                    const baseMultiplier = parseFloat(multiplierDisplay.textContent) || 1;
                    multiplierDisplay.textContent = (baseMultiplier * lemonPowerMultiplier).toFixed(2);
                }
                
                const currentPowerDisplay = document.getElementById('current-power');
                if (currentPowerDisplay) {
                    currentPowerDisplay.textContent = `${newHeight.toFixed(1)}%`;
                }
            }
        };
    }
    
    // Override handleClick if it exists
    if (typeof window.handleClick === 'function') {
        const originalHandleClick = window.handleClick;
        window.handleClick = function(e) {
            // Store original multiplier
            const originalMultiplier = game.stats.currentPowerMultiplier;
            
            // Apply lemon multiplier to the final calculation
            game.stats.currentPowerMultiplier *= lemonPowerMultiplier;
            
            // Call original handleClick
            originalHandleClick(e);
            
            // Restore original multiplier
            game.stats.currentPowerMultiplier = originalMultiplier;
        };
    }
}

// Export functions for use in main.js
window.initLemonSystem = initLemonSystem;
window.lemonPowerMultiplier = lemonPowerMultiplier; 