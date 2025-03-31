document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.getElementById('about-section');
    const aboutNavBtn = document.getElementById('about-nav-btn');
    const closeAboutBtn = document.getElementById('close-about');

    // Open about section
    aboutNavBtn.addEventListener('click', function() {
        aboutSection.classList.add('active');
        // Pause game when about section is open
        if (typeof pauseGame === 'function') {
            pauseGame();
        }
    });

    // Close about section
    closeAboutBtn.addEventListener('click', function() {
        aboutSection.classList.remove('active');
        // Resume game when about section is closed
        if (typeof resumeGame === 'function') {
            resumeGame();
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
        }
    });
}); 