// js/home.js
// ─────────────────────────────────────────────────────────
// Handles the new eCommerce homepage layout
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    const allProducts = await getProducts();
    if (!allProducts || allProducts.length === 0) return;

    // ── Hero Banner Slider ──────────────────────────────────
    let featuredProducts = allProducts.filter(p => p.featured);
    if (featuredProducts.length < 3) featuredProducts = [...featuredProducts, ...allProducts.slice(0, 3 - featuredProducts.length)];
    
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const heroImg = document.getElementById('hero-promo-img');
    const heroAction = document.getElementById('hero-action-btn');
    const heroWrapper = document.getElementById('hero-content-wrapper');
    const dotsContainer = document.getElementById('hero-dots-container');
    
    let currentHeroIdx = 0;
    let heroInterval;

    if (heroTitle && heroImg && featuredProducts.length > 0) {
        // Create dots
        dotsContainer.innerHTML = featuredProducts.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join('');
        const dots = dotsContainer.querySelectorAll('.dot');
        
        const updateHero = (idx) => {
            currentHeroIdx = idx;
            const p = featuredProducts[idx];
            
            // Fade out
            heroWrapper.style.opacity = '0';
            setTimeout(() => {
                heroTitle.innerHTML = `${p.name}<br><span style="font-style: italic; font-size: 24px;" class="text-primary">${p.price.toLocaleString()} RWF</span>`;
                heroDesc.textContent = p.description;
                heroImg.src = p.images[0];
                heroAction.onclick = () => window.location.href='product.html?id=' + p.id;
                
                dots.forEach(d => d.classList.remove('active'));
                dots[idx].classList.add('active');
                
                // Fade in
                heroWrapper.style.opacity = '1';
            }, 300);
        };
        
        // Initial load
        updateHero(0);
        
        const nextHero = () => {
            const nextIdx = (currentHeroIdx + 1) % featuredProducts.length;
            updateHero(nextIdx);
        };
        
        heroInterval = setInterval(nextHero, 30000);
        
        // Dot clicks
        dots.forEach(d => {
            d.addEventListener('click', (e) => {
                clearInterval(heroInterval);
                updateHero(parseInt(e.target.dataset.idx));
                heroInterval = setInterval(nextHero, 30000);
            });
        });
    }


    // Helper: Create Flash Sale Card HTML
    function createFlashCardHTML(p) {
        const percentSold = Math.floor(Math.random() * 50) + 40; // Random 40-90% sold
        return `
            <div class="product-card fade-in-up" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
                <div class="product-img-wrapper" style="aspect-ratio: 4 / 5; height: auto;">
                    <img src="${p.images[0]}" alt="${p.name}" class="product-img">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">
                        <span class="text-primary">${(p.price * 0.5).toLocaleString()} RWF</span>
                        <span style="text-decoration: line-through; color: var(--text-muted); font-size: 12px; margin-left: 8px;">${p.price.toLocaleString()}</span>
                    </div>
                    
                    <div class="flash-progress">
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${percentSold}%;"></div>
                        </div>
                        <div class="progress-text">${percentSold}% Sold</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ── Flash Sale Grid ────────────────────────────────────
    const flashGrid = document.getElementById('flash-sale-grid');
    if (flashGrid) {
        // Just take the first 8 products as "Flash Sale"
        const flashProducts = allProducts.slice(0, 8);
        flashGrid.innerHTML = flashProducts.map(p => createFlashCardHTML(p)).join('') + `
            <div class="product-card fade-in-up" style="display:flex; align-items:center; justify-content:center; cursor:pointer; background: transparent; border: 1px dashed var(--border); box-shadow: none;" onclick="window.location.href='shop.html'">
                <div style="text-align:center; color:var(--text-muted); font-size:16px; font-weight:bold; padding: 20px;">
                    See All <br><br><i class="fa-solid fa-arrow-right" style="font-size: 24px;"></i>
                </div>
                </div>
            </div>
        `;

        const btnPrev = document.getElementById('flash-prev');
        const btnNext = document.getElementById('flash-next');

        if (btnPrev && btnNext) {
            btnNext.onclick = () => { flashGrid.scrollBy({ left: 300, behavior: 'smooth' }); };
            btnPrev.onclick = () => { flashGrid.scrollBy({ left: -300, behavior: 'smooth' }); };
        }

        // Countdown Timer Logic
        let hours = 9, minutes = 17, seconds = 56;
        const spans = document.querySelectorAll('.countdown-timer span');
        if (spans.length === 3) {
            setInterval(() => {
                seconds--;
                if (seconds < 0) { seconds = 59; minutes--; }
                if (minutes < 0) { minutes = 59; hours--; }
                if (hours < 0) { hours = 23; }
                
                spans[0].textContent = hours.toString().padStart(2, '0');
                spans[1].textContent = minutes.toString().padStart(2, '0');
                spans[2].textContent = seconds.toString().padStart(2, '0');
            }, 1000);
        }
    }

    // ── Todays For You! Grid ────────────────────────────────
    const todaysGrid = document.getElementById('todays-grid');
    if (todaysGrid) {
        // Take a random selection or next batch for "Todays picks"
        const todaysProducts = allProducts.slice(0, 10);
        todaysGrid.innerHTML = todaysProducts.map(p => window.createProductCardHTML ? window.createProductCardHTML(p) : '').join('');
        
        // Ensure createProductCardHTML is loaded from app.js
        if (!window.createProductCardHTML) {
            console.error("createProductCardHTML is not globally available. Make sure app.js is loaded and exposes it.");
        }

        // Pill logic
        const pills = document.querySelectorAll('.todays-picks-section .pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                // Shuffle array to simulate different picks
                const shuffled = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 10);
                todaysGrid.innerHTML = shuffled.map(p => window.createProductCardHTML ? window.createProductCardHTML(p) : '').join('');
            });
        });
    }

    // ── Curated Collections ────────────────────────────────
    const collectionGrid = document.getElementById('collection-grid');
    if (collectionGrid) {
        const featured = allProducts.filter(p => p.featured).slice(0, 4);
        const fallback = allProducts.slice(0, 4);
        const collectionProducts = featured.length ? featured : fallback;
        
        collectionGrid.innerHTML = collectionProducts.map(p => `
            <div class="product-card fade-in-up" style="border-radius: 0; cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
                <div class="product-img-wrapper">
                    <img src="${p.images[0]}" alt="${p.name}" class="product-img">
                </div>
                <div class="product-info" style="padding: 10px;">
                    <h3 class="product-title" style="font-size: 14px;">${p.name}</h3>
                    <div class="product-price" style="font-size: 14px;">${p.price.toLocaleString()} RWF</div>
                </div>
            </div>
        `).join('');
    }
});

