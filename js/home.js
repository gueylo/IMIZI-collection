// js/home.js
// ─────────────────────────────────────────────────────────
// Handles the new eCommerce homepage layout
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    const allProducts = await getProducts();
    if (!allProducts || allProducts.length === 0) return;

    // ── Hero Banner Slider ──────────────────────────────────
    let featuredProducts = allProducts.filter(p => p.featured);
    if (featuredProducts.length === 0 && allProducts.length > 0) {
        featuredProducts = [allProducts[0]]; // Failsafe so the banner doesn't crash if 0 are featured
    }
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


    // Helper: Create New Stock Card HTML
    function createNewStockCardHTML(p) {
        return `
            <div class="product-card fade-in-up" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
                <div class="product-img-wrapper">
                    <img src="${p.images[0]}" alt="${p.name}" class="product-img">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">
                        <span class="text-primary">${p.price.toLocaleString()} RWF</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ── New Stock Grid ────────────────────────────────────
    const newStockGrid = document.getElementById('new-stock-grid');
    if (newStockGrid) {
        // Take the first 8 products as "New Stock" (they are sorted by newest first in store.js)
        const newStockProducts = allProducts.slice(0, 8);
        newStockGrid.innerHTML = newStockProducts.map(p => createNewStockCardHTML(p)).join('') + `
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
            btnNext.onclick = () => { newStockGrid.scrollBy({ left: 300, behavior: 'smooth' }); };
            btnPrev.onclick = () => { newStockGrid.scrollBy({ left: -300, behavior: 'smooth' }); };
        }
    }

    // ── Category Lines ────────────────────────────────────
    const categoryLines = ['Men', 'Women', 'Shoes', 'Accessories'];
    categoryLines.forEach(cat => {
        const grid = document.getElementById(`line-${cat.toLowerCase()}-grid`);
        if (grid) {
            const catProducts = allProducts.filter(p => p.mainCategory === cat).slice(0, 8);
            if (catProducts.length > 0) {
                grid.innerHTML = catProducts.map(p => createNewStockCardHTML(p)).join('') + `
                    <div class="product-card fade-in-up" style="display:flex; align-items:center; justify-content:center; cursor:pointer; background: transparent; border: 1px dashed var(--border); box-shadow: none;" onclick="window.location.href='shop.html?category=${cat}'">
                        <div style="text-align:center; color:var(--text-muted); font-size:16px; font-weight:bold; padding: 20px;">
                            See All ${cat}<br><br><i class="fa-solid fa-arrow-right" style="font-size: 24px;"></i>
                        </div>
                    </div>
                `;
            } else {
                grid.innerHTML = `<div style="padding: 20px; color: var(--text-muted); font-style: italic;">More ${cat} coming soon...</div>`;
            }
        }
    });

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

