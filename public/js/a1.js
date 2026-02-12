// Client-side interactions
document.addEventListener('DOMContentLoaded', () => {
    const buyBtn = document.getElementById('buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            // Create a custom notification instead of alert
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#2A2743';
            notification.style.color = '#fff';
            notification.style.padding = '15px 30px';
            notification.style.borderRadius = '50px';
            notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            notification.style.zIndex = '1000';
            notification.style.border = '1px solid rgba(255,255,255,0.1)';
            notification.style.fontFamily = '"Unbounded", sans-serif';
            notification.innerText = 'Пожалуйста, войдите или зарегистрируйтесь для заказа.';
            
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.transition = 'opacity 0.5s ease';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        });
    }
});
