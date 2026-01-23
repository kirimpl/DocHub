const backButton = document.querySelector('.back-btn');

if (backButton) {
    backButton.addEventListener('click', function() {
        
        window.location.href = '/'; 
    });
}