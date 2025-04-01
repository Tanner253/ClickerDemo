document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.getElementById('about-section');
    const closeAboutBtn = document.getElementById('close-about');

    // Close about section
    closeAboutBtn.addEventListener('click', function() {
        aboutSection.classList.remove('active');
        // Resume game when about section is closed
        if (typeof resumeGame === 'function') {
            resumeGame();
        }
        // Stop about music and resume regular music
        if (typeof soundManager !== 'undefined') {
            soundManager.stopAboutMusic();
        }
    });

    // Close about section when clicking outside
    aboutSection.addEventListener('click', function(e) {
        if (e.target === aboutSection) {
            aboutSection.classList.remove('active');
            // Resume game when about section is closed
            if (typeof resumeGame === 'function') {
                resumeGame();
            }
            // Stop about music and resume regular music
            if (typeof soundManager !== 'undefined') {
                soundManager.stopAboutMusic();
            }
        }
    });
}); 