document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.querySelector('.btn-more');
    const card = document.querySelector('.lectures-card');

    if (toggleBtn && card) {
        toggleBtn.addEventListener('click', function() {
            card.classList.toggle('collapsed');
        });
    }
});