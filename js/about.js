document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.getElementById('about-section');
    const closeAboutBtn = document.getElementById('close-about');
    const cardImage = document.querySelector('.card-image');
    const profileImage = document.getElementById('profile-image');
    const fullscreenImage = document.getElementById('fullscreen-image');

    // Close about section
    closeAboutBtn.addEventListener('click', function() {
        aboutSection.classList.remove('active');
        fullscreenImage.classList.remove('active');
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
            fullscreenImage.classList.remove('active');
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

    // Handle image click for fullscreen
    cardImage.addEventListener('click', function() {
        fullscreenImage.classList.add('active');
        // profileImage.style.objectPosition = 'center center'; // Reset position - No longer needed
    });

    // Close fullscreen image when clicking outside
    fullscreenImage.addEventListener('click', function(e) {
        if (e.target === fullscreenImage) {
            fullscreenImage.classList.remove('active');
        }
    });

    // Close fullscreen image with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fullscreenImage.classList.remove('active');
        }
    });
}); 