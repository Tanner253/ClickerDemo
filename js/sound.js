class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        // Separate volume controls
        this.musicVolume = 0.3; // Default music volume
        this.sfxVolume = 0.75; // Default SFX volume
        
        // Load volumes from localStorage
        const savedMusicVolume = localStorage.getItem('musicVolume');
        if (savedMusicVolume !== null) {
            this.musicVolume = parseFloat(savedMusicVolume);
        }
        const savedSfxVolume = localStorage.getItem('sfxVolume');
        if (savedSfxVolume !== null) {
            this.sfxVolume = parseFloat(savedSfxVolume);
        }

        // Initialize sounds (will set initial volumes based on the above)
        this.initSounds();
        
        // Setup listeners for the static sliders in index.html
        this.setupVolumeSliderListeners();

        // Load mute state from localStorage
        const savedMute = localStorage.getItem('soundMuted');
        if (savedMute === 'true') {
            // Call toggleMute but prevent it from playing sound on init
            this.toggleMute(true); 
        }
    }

    initSounds() {
        // Click sound
        this.sounds.click = new Audio('assets/sounds/click.wav');
        this.sounds.click.volume = this.sfxVolume; // Use SFX volume

        // Gold Rush sound
        this.sounds.goldRush = new Audio('assets/sounds/jackpot.wav');
        this.sounds.goldRush.volume = this.sfxVolume; // Use SFX volume

        // Lemon pop sound
        this.sounds.lemonPop = new Audio('assets/sounds/lemon.wav');
        this.sounds.lemonPop.volume = this.sfxVolume; // Use SFX volume

        // Upgrade purchase sound (reusing click sound for now)
        this.sounds.upgrade = new Audio('assets/sounds/click.wav');
        this.sounds.upgrade.volume = this.sfxVolume * 0.7; // Slightly quieter SFX

        // Background music
        this.music = new Audio('assets/sounds/music.mp3');
        this.music.volume = this.musicVolume; // Use Music volume
        this.music.loop = true; // Make the music loop

        // About me background music
        this.aboutMusic = new Audio('assets/sounds/skny_intro.mp3');
        this.aboutMusic.volume = this.musicVolume; // Use Music volume
        this.aboutMusic.loop = true;

        // Add error handling for all sounds
        const handleError = (e) => {
            console.log('Sound loading error:', e);
        };

        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('error', handleError);
        });
        this.music.addEventListener('error', handleError);
        this.aboutMusic.addEventListener('error', handleError);
    }
    
    // New method to setup listeners for existing sliders
    setupVolumeSliderListeners() {
        const musicSlider = document.getElementById('music-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');
        const muteBtn = document.getElementById('toggle-mute'); // Assuming a mute button might exist elsewhere or could be added

        if (musicSlider) {
            musicSlider.value = this.musicVolume * 100; // Set initial slider value
            musicSlider.addEventListener('input', (e) => {
                this.setMusicVolume(e.target.value / 100);
            });
        } else {
             console.warn("Music volume slider not found!");
        }

        if (sfxSlider) {
            sfxSlider.value = this.sfxVolume * 100; // Set initial slider value
            sfxSlider.addEventListener('input', (e) => {
                this.setSfxVolume(e.target.value / 100);
            });
        } else {
            console.warn("SFX volume slider not found!");
        }
        
        // Add listener for a potential global mute button if needed
        // For now, we only connect the sliders. A separate mute button might need its own logic.
        // if (muteBtn) {
        //    muteBtn.addEventListener('click', () => this.toggleMute());
        // }
    }

    playSound(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Create a clone for overlapping sounds
            const clone = sound.cloneNode();
            // Set volume based on the specific sound's base setting or global SFX volume
            // Using global SFX volume for simplicity now
            clone.volume = this.sfxVolume * (soundName === 'upgrade' ? 0.7 : 1); // Apply specific adjustments if needed
            
            // Ensure playback starts from the beginning
            clone.currentTime = 0; 
            
            clone.play().catch(error => console.log('Sound play failed:', error));
            
            // Clean up clone after it finishes playing
            clone.addEventListener('ended', () => {
                clone.remove();
            });
        } else {
            console.warn(`Sound not found: ${soundName}`);
        }
    }

    startMusic() {
        if (this.isMuted || this.music.paused) {
            this.music.volume = this.musicVolume; // Ensure volume is set
            this.music.play().catch(error => console.log('Music play failed:', error));
        }
    }

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }

    startAboutMusic() {
         if (this.isMuted || this.aboutMusic.paused) {
            // Stop regular background music
            this.stopMusic();
            // Start about music
            this.aboutMusic.volume = this.musicVolume; // Ensure volume is set
            this.aboutMusic.play().catch(error => console.log('About music play failed:', error));
         }
    }

    stopAboutMusic() {
        this.aboutMusic.pause();
        this.aboutMusic.currentTime = 0;
        // Optionally resume regular background music if app isn't muted and about isn't active
        // This needs context from main.js - handle music resuming there or pass state.
        // For simplicity, we'll let the main logic decide when to call startMusic() again.
        // if (!this.isMuted) {
        //    this.startMusic();
        // }
    }

    // Added 'initializing' flag to prevent sound playback during setup
    toggleMute(initializing = false) {
        this.isMuted = !this.isMuted;
        
        // Optional: Update a mute button's visual state if one exists
        const muteBtn = document.getElementById('toggle-mute'); 
        if (muteBtn) {
             muteBtn.innerHTML = this.isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        }
       
        if (this.isMuted) {
            this.stopMusic();
            this.stopAboutMusic();
            // Mute currently playing SFX clones (tricky, maybe unnecessary if brief)
        } else if (!initializing) { 
             // Only resume music if not during initial load
             // Determine which music to play based on game state (needs context)
             // For now, just try resuming main music as default unless about is active
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

    // New method to set Music volume
    setMusicVolume(value) {
        this.musicVolume = value;
        this.music.volume = this.musicVolume;
        this.aboutMusic.volume = this.musicVolume;
        localStorage.setItem('musicVolume', value.toString());

        // Optional: Update display if needed (e.g., a percentage label)
        // const musicValueLabel = document.getElementById('music-volume-value-label');
        // if (musicValueLabel) musicValueLabel.textContent = `${Math.round(value * 100)}%`;
    }

    // New method to set SFX volume
    setSfxVolume(value) {
        this.sfxVolume = value;
        // Update base volumes (optional, as playSound sets clone volume)
        // this.sounds.click.volume = this.sfxVolume;
        // this.sounds.goldRush.volume = this.sfxVolume; 
        // etc. 
        localStorage.setItem('sfxVolume', value.toString());
        
        // Optional: Update display if needed
        // const sfxValueLabel = document.getElementById('sfx-volume-value-label');
        // if (sfxValueLabel) sfxValueLabel.textContent = `${Math.round(value * 100)}%`;
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Export for use in other files
window.soundManager = soundManager; 