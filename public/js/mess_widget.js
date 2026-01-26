document.addEventListener('DOMContentLoaded', () => {
    const h_btn1 = document.getElementById('h_btn1');
    const popup = document.getElementById('notifPopup');
    
    h_btn1.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if(!popup.contains(e.target) && popup.classList.contains('active')){
            popup.classList.remove('active');
        }
    });

    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});