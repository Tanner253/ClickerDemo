document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.getElementById('about-section');
    const closeAboutBtn = document.getElementById('close-about');
    const cardImage = document.querySelector('.card-image');
    const profileImage = document.getElementById('profile-image');
    const fullscreenImage = document.getElementById('fullscreen-image');

    // Image peek effect
    cardImage.addEventListener('mousemove', function(e) {
        const rect = cardImage.getBoundingClientRect();
        const x = e.clientX - rect.left; // Mouse X relative to card
        const y = e.clientY - rect.top;  // Mouse Y relative to card
        
        // Calculate position percentages (-20 to 20 range for subtle movement)
        const xPercent = ((x / rect.width) * 40 - 20).toFixed(2);
        const yPercent = ((y / rect.height) * 40 - 20).toFixed(2);
        
        // Apply the transformation
        profileImage.style.objectPosition = `${50 + xPercent}% ${50 + yPercent}%`;
    });

    // Reset image position when mouse leaves
    cardImage.addEventListener('mouseleave', function() {
        profileImage.style.objectPosition = 'center center';
    });

    // Close about section
    closeAboutBtn.addEventListener('click', function() {
        aboutSection.classList.remove('active');
        fullscreenImage.classList.remove('active');
        profileImage.style.objectPosition = 'center center'; // Reset position
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
            profileImage.style.objectPosition = 'center center'; // Reset position
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
        profileImage.style.objectPosition = 'center center'; // Reset position
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