import { getProducts, addToCart } from './store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    try {
        const allProducts = await getProducts();
        const product = allProducts.find(p => p.id === productId);

        if (!product) {
            document.getElementById('pv-title').textContent = 'Product not found';
            return;
        }

        // Render Data
        document.getElementById('pv-breadcrumb-name').textContent = product.name;
        document.getElementById('pv-title').textContent = product.name;

        const topCat = document.getElementById('pv-top-category');
        if (topCat) topCat.textContent = `${product.mainCategory} / ${product.subCategory}`;

        const metaDetails = document.getElementById('pv-meta-details');
        if (metaDetails) {
            metaDetails.innerHTML = `<span style="color:var(--text);">${product.gender}</span> • ${product.stock} in stock`;
        }

        const shortDesc = document.getElementById('pv-short-desc');
        if (shortDesc) shortDesc.textContent = product.description;

        document.getElementById('pv-price').textContent = `${product.price.toLocaleString()} RWF`;

        // Mock Old Price (just for UI styling as requested)
        document.getElementById('pv-old-price').textContent = `${(product.price * 2).toLocaleString()} RWF`;

        // Render Thumbnails
        const thumbnailsContainer = document.getElementById('pv-thumbnails');
        thumbnailsContainer.innerHTML = '';

        // If product only has 1 image, duplicate it a few times for the UI demo effect
        let displayImages = [...product.images];
        if (displayImages.length === 1) {
            displayImages = [displayImages[0], displayImages[0], displayImages[0], displayImages[0]];
        }

        const mainImage = document.getElementById('pv-main-image');
        mainImage.src = displayImages[0];

        displayImages.forEach((imgSrc, idx) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = `pv-thumb ${idx === 0 ? 'active' : ''}`;
            img.onclick = () => {
                document.querySelectorAll('.pv-thumb').forEach(t => t.classList.remove('active'));
                img.classList.add('active');
                mainImage.src = imgSrc;
            };
            thumbnailsContainer.appendChild(img);
        });

        // Render Colors
        const colorsContainer = document.getElementById('pv-colors');
        colorsContainer.innerHTML = '';
        const prodColors = Array.isArray(product.colors) ? product.colors : [];
        if (prodColors.length > 0) {
            prodColors.forEach((color, idx) => {
                const cBtn = document.createElement('button');
                cBtn.className = `pv-size-btn ${idx === 0 ? 'active' : ''}`; // Reuse the brutalist button style
                cBtn.textContent = color;
                cBtn.onclick = () => {
                    document.querySelectorAll('#pv-colors .pv-size-btn').forEach(b => b.classList.remove('active'));
                    cBtn.classList.add('active');
                };
                colorsContainer.appendChild(cBtn);
            });
        } else {
            // Fallback if no colors
            colorsContainer.style.display = 'none';
        }

        // Render Sizes
        const sizesContainer = document.getElementById('pv-sizes');
        sizesContainer.innerHTML = '';
        const prodSizes = Array.isArray(product.sizes) ? product.sizes : [];
        let selectedSize = prodSizes.length > 0 ? prodSizes[0] : null;

        if (prodSizes.length > 0) {
            prodSizes.forEach((size, idx) => {
                const btn = document.createElement('button');
                btn.className = `pv-size-btn ${idx === 0 ? 'active' : ''}`;
                btn.textContent = size;
                btn.onclick = () => {
                    document.querySelectorAll('.pv-size-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedSize = size;
                };
                sizesContainer.appendChild(btn);
            });
        }

        // Quantity Logic
        const qtyInput = document.getElementById('pv-qty-input');
        const qtyMinus = document.getElementById('pv-qty-minus');
        const qtyPlus = document.getElementById('pv-qty-plus');

        if (qtyInput && qtyMinus && qtyPlus) {
            qtyMinus.addEventListener('click', () => {
                let current = parseInt(qtyInput.value) || 1;
                if (current > 1) qtyInput.value = current - 1;
            });
            qtyPlus.addEventListener('click', () => {
                let current = parseInt(qtyInput.value) || 1;
                qtyInput.value = current + 1;
            });
        }

        // Actions
        document.getElementById('pv-buy-btn').onclick = () => {
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            addToCart(product, qty, selectedSize);
            window.location.href = 'index.html'; // Or redirect to checkout later
        };
        document.getElementById('pv-cart-btn').onclick = () => {
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            addToCart(product, qty, selectedSize);
            // The cart sidebar should automatically update because of store.js observers if implemented
            const cartToggle = document.getElementById('cart-toggle');
            if (cartToggle) cartToggle.click();
        };

        // Render Related Products (Similar Products)
        const relatedGrid = document.getElementById('pv-related-grid');
        let related = allProducts.filter(p => p.id !== product.id && (p.mainCategory === product.mainCategory || p.subCategory === product.subCategory));
        if (related.length === 0) {
            related = allProducts.filter(p => p.id !== product.id); // fallback if no similar products
        }
        related = related.slice(0, 12);
        relatedGrid.innerHTML = related.map(p => window.createProductCardHTML ? window.createProductCardHTML(p) : `
            <div class="product-card fade-in-up" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
                <div class="product-img-wrapper" style="aspect-ratio: 4 / 5; height: auto;">
                    <img src="${p.images[0]}" alt="${p.name}" class="product-img">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">${p.price.toLocaleString()} RWF</div>
                </div>
            </div>
        `).join('');



        // ── Interaction Logic for Utilities & Actions ──

        // Utilities
        document.getElementById('pv-chat-btn')?.addEventListener('click', () => {
            alert('Opening live chat with IDDY COLLECTION support...');
        });

        const wishlistBtn = document.getElementById('pv-wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                const icon = wishlistBtn.querySelector('i');
                if (icon.classList.contains('fa-regular')) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    wishlistBtn.style.color = 'var(--primary)';
                } else {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                    wishlistBtn.style.color = '';
                }
            });
        }

        document.getElementById('pv-share-btn')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Product link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy', err);
            }
        });

        // Size Guide
        document.getElementById('pv-size-guide-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Size guide modal opening...\n(Standard sizing applies. Stick to your usual size for a regular fit, or size up for an oversized streetwear look.)');
        });

        // Follow Button
        const followBtn = document.getElementById('pv-follow-btn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                if (followBtn.textContent === 'Follow') {
                    followBtn.textContent = 'Following';
                    followBtn.style.background = 'var(--text)';
                    followBtn.style.color = 'var(--bg)';
                } else {
                    followBtn.textContent = 'Follow';
                    followBtn.style.background = '';
                    followBtn.style.color = '';
                }
            });
        }

        // Related Carousel Navigation
        const rPrev = document.getElementById('pv-related-prev');
        const rNext = document.getElementById('pv-related-next');
        const rGrid = document.getElementById('pv-related-grid');
        if (rPrev && rNext && rGrid) {
            rPrev.addEventListener('click', () => rGrid.scrollBy({ left: -300, behavior: 'smooth' }));
            rNext.addEventListener('click', () => rGrid.scrollBy({ left: 300, behavior: 'smooth' }));
        }

    } catch (err) {
        console.error("Error loading product:", err);
    }
});
