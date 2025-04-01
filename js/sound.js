class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.musicVolume = 0.3;
        
        // Initialize sounds
        this.initSounds();
        
        // Create volume controls
        this.createVolumeControls();

        // Load mute state from localStorage
        const savedMute = localStorage.getItem('soundMuted');
        if (savedMute === 'true') {
            this.toggleMute();
        }

        // Load volume from localStorage
        const savedVolume = localStorage.getItem('soundVolume');
        if (savedVolume !== null) {
            this.setVolume(parseFloat(savedVolume));
        }
    }

    initSounds() {
        // Click sound
        this.sounds.click = new Audio('assets/sounds/click.wav');
        this.sounds.click.volume = this.volume;

        // Gold Rush sound
        this.sounds.goldRush = new Audio('assets/sounds/jackpot.wav');
        this.sounds.goldRush.volume = this.volume * 0.8; // Slightly quieter due to larger file

        // Lemon pop sound
        this.sounds.lemonPop = new Audio('assets/sounds/lemon.wav');
        this.sounds.lemonPop.volume = this.volume;

        // Upgrade purchase sound (reusing click sound for now)
        this.sounds.upgrade = new Audio('assets/sounds/click.wav');
        this.sounds.upgrade.volume = this.volume * 0.7; // Slightly quieter for upgrades

        // Background music
        this.music = new Audio('assets/sounds/music.mp3');
        this.music.volume = this.musicVolume;
        this.music.loop = true; // Make the music loop

        // About me background music
        this.aboutMusic = new Audio('assets/sounds/skny_intro.mp3');
        this.aboutMusic.volume = this.musicVolume;
        this.aboutMusic.loop = true;

        // Add error handling for all sounds
        const handleError = (e) => {
            console.log('Sound loading error:', e);
        };

        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('error', handleError);
        });
    }

    createVolumeControls() {
        // Create volume control container
        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'volume-controls';
        volumeContainer.innerHTML = `
            <div class="volume-header">
                <button class="volume-btn" id="toggle-mute">
                    <i class="fas fa-volume-up"></i>
                </button>
                <span class="volume-percentage">50%</span>
            </div>
            <input type="range" id="volume-slider" min="0" max="100" value="50">
            <div class="volume-labels">
                <span>Sound Effects</span>
                <span id="volume-value">50%</span>
            </div>
            <div class="volume-labels">
                <span>Background Music</span>
                <span id="music-volume-value">30%</span>
            </div>
        `;

        // Add to settings modal
        const settingsBody = document.querySelector('#settingsModal .modal-body');
        const settingsSection = document.createElement('div');
        settingsSection.className = 'settings-section';
        settingsSection.innerHTML = '<h6><i class="fas fa-volume-up"></i> Sound Settings</h6>';
        settingsSection.appendChild(volumeContainer);
        settingsBody.insertBefore(settingsSection, settingsBody.firstChild);

        // Add event listeners
        const toggleMuteBtn = document.getElementById('toggle-mute');
        const volumeSlider = document.getElementById('volume-slider');

        toggleMuteBtn.addEventListener('click', () => this.toggleMute());
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.setVolume(value);
            this.updateVolumeDisplay(value);
        });
    }

    updateVolumeDisplay(value) {
        const percentage = Math.round(value * 100);
        const musicPercentage = Math.round(value * 60); // Music is 60% of main volume
        
        document.querySelector('.volume-percentage').textContent = `${percentage}%`;
        document.getElementById('volume-value').textContent = `${percentage}%`;
        document.getElementById('music-volume-value').textContent = `${musicPercentage}%`;
        
        // Save volume to localStorage
        localStorage.setItem('soundVolume', value.toString());
    }

    playSound(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Create a clone for overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = this.volume;
            clone.play().catch(error => console.log('Sound play failed:', error));
            
            // Clean up clone after it finishes playing
            clone.addEventListener('ended', () => {
                clone.remove();
            });
        }
    }

    startMusic() {
        if (this.isMuted) return;
        this.music.play().catch(error => console.log('Music play failed:', error));
    }

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }

    startAboutMusic() {
        if (this.isMuted) return;
        // Stop regular background music
        this.stopMusic();
        // Start about music
        this.aboutMusic.play().catch(error => console.log('About music play failed:', error));
    }

    stopAboutMusic() {
        this.aboutMusic.pause();
        this.aboutMusic.currentTime = 0;
        // Resume regular background music
        this.startMusic();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('toggle-mute');
        muteBtn.innerHTML = this.isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
        
        if (this.isMuted) {
            this.stopMusic();
            this.stopAboutMusic();
        } else {
            // If about section is open, play about music, otherwise play regular music
            const aboutSection = document.getElementById('about-section');
            if (aboutSection && aboutSection.classList.contains('active')) {
                this.startAboutMusic();
            } else {
                this.startMusic();
            }
        }

        // Save mute state to localStorage
        localStorage.setItem('soundMuted', this.isMuted.toString());
    }

    setVolume(value) {
        this.volume = value;
        this.musicVolume = value * 0.6; // Music slightly quieter than effects
        
        // Update all sound volumes
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
        
        // Update music volumes
        this.music.volume = this.musicVolume;
        this.aboutMusic.volume = this.musicVolume;
        
        // Update the slider and display
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = value * 100;
            // Update the slider's visual track
            volumeSlider.style.setProperty('--value', `${value * 100}%`);
        }
        
        // Update the volume display
        this.updateVolumeDisplay(value);
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Export for use in other files
window.soundManager = soundManager; 