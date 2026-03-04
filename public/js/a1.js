// Client-side interactions
document.addEventListener('DOMContentLoaded', () => {

    // ===== BUY BUTTON (Главная страница) =====
    const buyBtn = document.getElementById('buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position:fixed; top:20px; left:50%; transform:translateX(-50%);
                background:#2A2743; color:#fff; padding:15px 30px;
                border-radius:50px; box-shadow:0 5px 15px rgba(0,0,0,0.3);
                z-index:1000; border:1px solid rgba(255,255,255,0.1);
                font-family:"Unbounded", sans-serif; font-size:0.85rem;
            `;
            notification.innerText = 'Пожалуйста, войдите или зарегистрируйтесь для заказа.';
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.transition = 'opacity 0.5s ease';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        });
    }

    // ===== CAROUSEL (natives scroll + snap) =====
    const trackContainer = document.getElementById('carouselTrack')
        ? document.getElementById('carouselTrack').parentElement
        : null;
    const track  = document.getElementById('carouselTrack');
    const dotsEl = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (track && trackContainer) {
        let cards = track.querySelectorAll('.carousel-card');
        let currentIndex = 0;
        let visibleCount = 3;
        let autoTimer = null;

        function updateVisibleCount() {
            if (window.innerWidth <= 768) visibleCount = 1;
            else if (window.innerWidth <= 1100) visibleCount = 2;
            else visibleCount = 3;
        }

        function getMaxIndex() {
            return Math.max(0, cards.length - visibleCount);
        }

        function buildDots() {
            if (!dotsEl) return;
            dotsEl.innerHTML = '';
            const max = getMaxIndex();
            for (let i = 0; i <= max; i++) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
                dot.addEventListener('click', () => goTo(i));
                dotsEl.appendChild(dot);
            }
        }

        function updateDots() {
            if (!dotsEl) return;
            const dots = dotsEl.querySelectorAll('.carousel-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        function goTo(index) {
            updateVisibleCount();
            currentIndex = Math.min(Math.max(0, index), getMaxIndex());

            const card = cards[currentIndex];
            if (card) {
                // Нативный scroll — snap сам выровняет карточку
                trackContainer.scrollLeft = card.offsetLeft - track.offsetLeft;
            }

            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();

            updateDots();
        }

        function next() {
            const max = getMaxIndex();
            if (currentIndex >= max) goTo(0);
            else goTo(currentIndex + 1);
        }

        function prev() {
            if (currentIndex <= 0) goTo(getMaxIndex());
            else goTo(currentIndex - 1);
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { resetAuto(); prev(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { resetAuto(); next(); });

        function startAuto() {
            autoTimer = setInterval(next, 5000);
        }

        function resetAuto() {
            clearInterval(autoTimer);
            startAuto();
        }

        window.addEventListener('resize', () => {
            updateVisibleCount();
            buildDots();
            goTo(currentIndex);
        });

        // Init
        updateVisibleCount();
        buildDots();
        goTo(0);
        startAuto();
    }
});

