// js/app.js
// ─────────────────────────────────────────────
// Global helpers called on all pages
// ─────────────────────────────────────────────

const WISHLIST_KEY = 'iddy_wishlist';

function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('wishlistUpdated'));
}

function toggleWishlist(productId) {
    let list = getWishlist();
    const idx = list.indexOf(productId);
    if (idx === -1) list.push(productId);
    else list.splice(idx, 1);
    saveWishlist(list);
}

function isWishlisted(productId) {
    return getWishlist().includes(productId);
}

// ─── Skeleton helpers ───────────────────────
function skeletonCardHTML() {
    return `
    <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
    </div>`;
}

function showSkeletons(gridEl, count = 8) {
    gridEl.innerHTML = Array(count).fill(skeletonCardHTML()).join('');
}

// ─── Product card builder ────────────────────
function createProductCardHTML(product) {
    return `
    <div class="product-card">
        <div class="product-img-wrapper" style="cursor:pointer;" onclick="window.location.href='product.html?id=${product.id}'">
            <img src="${product.images[0]}" alt="${product.name}" class="product-img" loading="lazy">
            <button class="add-to-cart-btn"
                    onclick="event.stopPropagation(); addToCart('${product.id}')"
                    title="Add to Cart">🛒</button>
        </div>
        <div class="product-info" style="cursor:pointer;" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-category">${product.mainCategory} · ${product.gender}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price text-primary">${product.price.toLocaleString()} RWF</div>
        </div>
    </div>`;
}

function updateWishlistCount() {
    // Left empty since wishlist is removed
}

// ─────────────────────────────────────────────
// DOM-dependent initialisation
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // ── Page transition ──────────────────────
    setTimeout(() => {
        const pt = document.querySelector('.page-transition');
        if (pt) pt.style.transform = 'translateY(-100%)';
    }, 400);

    // ── Theme ────────────────────────────────
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // ── Hamburger ────────────────────────────
    const hamburger  = document.getElementById('hamburger');
    const mobileNav  = document.getElementById('mobile-nav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNav.classList.toggle('open');
        });
        // close on link click
        mobileNav.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileNav.classList.remove('open');
            })
        );
    }

    // ── Nav Search toggle & syncing ──────────
    const searchToggle = document.getElementById('search-toggle');
    const navSearch    = document.getElementById('nav-search');
    const shopInput    = document.getElementById('search-input');

    if (searchToggle && navSearch) {
        // Toggle behavior: search if open and contains text, otherwise toggle visibility
        searchToggle.addEventListener('click', () => {
            const isOpen = navSearch.classList.contains('open');
            const q = navSearch.value.trim();

            if (isOpen && q) {
                if (shopInput) {
                    shopInput.value = q;
                    shopInput.dispatchEvent(new Event('input'));
                } else {
                    window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
                }
            } else {
                navSearch.classList.toggle('open');
                if (navSearch.classList.contains('open')) {
                    navSearch.focus();
                }
            }
        });

        // Handle Enter keypress (allows searching empty string to clear search)
        navSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = navSearch.value.trim();
                if (shopInput) {
                    shopInput.value = q;
                    shopInput.dispatchEvent(new Event('input'));
                } else {
                    window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
                }
            }
        });

        // Close search and clear on Escape key
        navSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                navSearch.classList.remove('open');
                navSearch.value = '';
                if (shopInput) {
                    shopInput.value = '';
                    shopInput.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    // Sync header navSearch and main shopInput if on shop page
    if (shopInput && navSearch) {
        // Initialize values from URL
        const params = new URLSearchParams(window.location.search);
        const urlQ = params.get('q') || '';
        navSearch.value = urlQ;
        shopInput.value = urlQ;
        if (urlQ) {
            navSearch.classList.add('open');
        }

        // On input in navSearch, sync with shopInput and trigger search
        navSearch.addEventListener('input', () => {
            shopInput.value = navSearch.value;
            shopInput.dispatchEvent(new Event('input'));
        });

        // On input in shopInput, sync with navSearch
        shopInput.addEventListener('input', () => {
            navSearch.value = shopInput.value;
            if (shopInput.value && !navSearch.classList.contains('open')) {
                navSearch.classList.add('open');
            }
        });
    }


    // ── Cart ─────────────────────────────────
    const cartToggle          = document.getElementById('cart-toggle');
    const closeCartBtn        = document.getElementById('close-cart');
    const cartSidebar         = document.getElementById('cart-sidebar');
    const cartOverlay         = document.getElementById('cart-overlay');
    const cartItemsContainer  = document.getElementById('cart-items-container');
    const cartTotalPriceEl    = document.getElementById('cart-total-price');
    const cartCountEl         = document.getElementById('cart-count');

    window.openCart = function () {
        if (cartSidebar) cartSidebar.classList.add('open');
        if (cartOverlay) cartOverlay.classList.add('active');
        renderCart();
    };

    function closeCartSidebar() {
        if (cartSidebar) cartSidebar.classList.remove('open');
        if (cartOverlay) cartOverlay.classList.remove('active');
    }

    if (cartToggle)  cartToggle.addEventListener('click', window.openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartSidebar);
    if (cartOverlay)  cartOverlay.addEventListener('click', closeCartSidebar);

    function renderCart() {
        if (!cartItemsContainer) return;
        const cart = getCart();
        let total = 0, count = 0;
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML =
                '<p style="text-align:center;color:var(--text-muted);margin-top:50px;">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                total += item.price * item.quantity;
                count += item.quantity;
                const el = document.createElement('div');
                el.style.cssText = 'display:flex;gap:15px;align-items:center;border-bottom:1px solid var(--border);padding-bottom:15px;';
                el.innerHTML = `
                    <img src="${item.images[0]}" alt="${item.name}"
                         style="width:70px;height:70px;object-fit:cover;border-radius:8px;background:var(--bg);">
                    <div style="flex:1;">
                        <h4 style="font-size:13px;margin-bottom:4px;">${item.name}</h4>
                        ${item.selectedSize ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Size: ${item.selectedSize}</div>` : ''}
                        <div style="color:var(--primary);font-weight:600;font-size:13px;">
                            ${(item.price * item.quantity).toLocaleString()} RWF</div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:5px;">
                            <button class="qty-btn" data-id="${item.id}" data-size="${item.selectedSize || ''}" data-action="minus"
                                    style="background:var(--bg);border:1px solid var(--border);color:var(--text);width:24px;height:24px;cursor:pointer;border-radius:4px;">-</button>
                            <span style="font-size:13px;">${item.quantity}</span>
                            <button class="qty-btn" data-id="${item.id}" data-size="${item.selectedSize || ''}" data-action="plus"
                                    style="background:var(--bg);border:1px solid var(--border);color:var(--text);width:24px;height:24px;cursor:pointer;border-radius:4px;">+</button>
                        </div>
                    </div>
                    <button class="remove-btn" data-id="${item.id}" data-size="${item.selectedSize || ''}"
                            style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;">🗑</button>`;
                cartItemsContainer.appendChild(el);
            });
        }

        if (cartCountEl) cartCountEl.textContent = count;
        if (cartTotalPriceEl) cartTotalPriceEl.textContent = total.toLocaleString() + ' RWF';

        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id  = btn.dataset.id;
                const size = btn.dataset.size || null;
                const act = btn.dataset.action;
                const item = getCart().find(i => i.id === id && (i.selectedSize || null) === (size || null));
                if (item) updateCartQuantity(id, size, act === 'plus' ? item.quantity + 1 : item.quantity - 1);
            });
        });
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id  = btn.dataset.id;
                const size = btn.dataset.size || null;
                removeFromCart(id, size);
            });
        });
    }

    window.addEventListener('cartUpdated', renderCart);
    renderCart();

    // ── Checkout & Receipt System Modals HTML ─
    const checkoutInfoHtml = `
    <div class="modal" id="checkout-info-modal">
        <div class="checkout-modal-content">
            <button id="close-checkout-info" style="position:absolute;top:15px;right:15px;background:transparent;
                border:none;color:var(--text-muted);font-size:18px;cursor:pointer;">✕</button>
            <h3 class="checkout-modal-title">Checkout Details</h3>
            <p class="checkout-modal-subtitle">Provide your details to generate the order receipt.</p>
            <form id="checkout-info-form">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="checkout-name" style="display:block;margin-bottom:5px;font-size:12px;color:var(--text-muted);">Your Name</label>
                    <input type="text" id="checkout-name" class="form-control" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);" placeholder="e.g. John Doe" autocomplete="off" required>
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="checkout-phone" style="display:block;margin-bottom:5px;font-size:12px;color:var(--text-muted);">WhatsApp Number</label>
                    <input type="tel" id="checkout-phone" class="form-control" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);" placeholder="Enter your WhatsApp number" autocomplete="off" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;">Generate Receipt</button>
            </form>
        </div>
    </div>`;

    const receiptModalHtml = `
    <div class="modal" id="receipt-modal">
        <div class="receipt-modal-content">
            <button id="close-receipt-modal" style="position:absolute;top:15px;right:15px;background:rgba(0,0,0,0.5);
                border:none;color:#fff;width:32px;height:32px;border-radius:50%;
                font-size:16px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;">✕</button>
            
            <div class="receipt-header">
                <img src="assets/logo.png" alt="IDDY" style="height: 45px; margin-bottom: 10px;">
                <div class="receipt-title">IDDY COLLECTION</div>
                <div style="font-size: 11px; color: var(--text-muted); letter-spacing: 2px;">LUXURY STREETWEAR</div>
            </div>

            <div class="receipt-body">
                <div class="receipt-meta">
                    <span id="receipt-order-id">Order: #IMZ-XXXXXX</span>
                    <span id="receipt-date">Date: 2026-05-20 12:00</span>
                </div>

                <div class="receipt-section-title">Customer Info</div>
                <div class="receipt-info-block">
                    <strong>Customer:</strong> <span id="receipt-cust-name"></span><br>
                    <strong>WhatsApp:</strong> <span id="receipt-cust-phone"></span>
                </div>

                <div class="receipt-section-title">Items Ordered</div>
                <div class="receipt-items-list" id="receipt-items-container">
                    <!-- Row items injected here -->
                </div>

                <div class="receipt-total-row">
                    <span>Total Amount:</span>
                    <span id="receipt-total-val" class="text-primary">0 RWF</span>
                </div>

                <div class="receipt-barcode">||||||| | ||||| | || ||||| | ||||</div>
            </div>

            <div class="receipt-footer">
                <button class="btn btn-primary" id="receipt-checkout-btn" style="width:100%;padding:14px;">Checkout</button>
                <button class="btn btn-outline" id="receipt-print-btn" style="width:100%;padding:12px;">Print Receipt</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', checkoutInfoHtml);
    document.body.insertAdjacentHTML('beforeend', receiptModalHtml);

    // ── Checkout & Receipt Wiring ──────────────
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutInfoModal = document.getElementById('checkout-info-modal');
    const closeCheckoutInfo = document.getElementById('close-checkout-info');
    const checkoutInfoForm = document.getElementById('checkout-info-form');
    
    const receiptModal = document.getElementById('receipt-modal');
    const closeReceiptModal = document.getElementById('close-receipt-modal');
    const receiptCheckoutBtn = document.getElementById('receipt-checkout-btn');
    const receiptPrintBtn = document.getElementById('receipt-print-btn');

    let currentOrderMsg = '';
    let currentOrderPhone = '';

    if (checkoutBtn && checkoutInfoModal) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (!cart.length) { alert('Your cart is empty!'); return; }
            closeCartSidebar(); // close the cart sidebar
            checkoutInfoModal.classList.add('active');
        });
    }

    if (closeCheckoutInfo) {
        closeCheckoutInfo.addEventListener('click', () => {
            checkoutInfoModal.classList.remove('active');
        });
    }

    if (checkoutInfoForm) {
        checkoutInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cart = getCart();
            if (!cart.length) return;

            const nameInput = document.getElementById('checkout-name');
            const phoneInput = document.getElementById('checkout-phone');
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            currentOrderPhone = phone.replace(/[^0-9]/g, '');
            nameInput.value = '';
            phoneInput.value = '';
            const orderId = `#IMZ-${Math.floor(100000 + Math.random() * 900000)}`;
            const dateStr = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculate total
            let total = 0;
            cart.forEach(item => {
                total += item.price * item.quantity;
            });

            // Build Receipt Modal details
            document.getElementById('receipt-order-id').textContent = `Order: ${orderId}`;
            document.getElementById('receipt-date').textContent = `Date: ${dateStr}`;
            document.getElementById('receipt-cust-name').textContent = name;
            document.getElementById('receipt-cust-phone').textContent = phone;
            document.getElementById('receipt-total-val').textContent = `${total.toLocaleString()} RWF`;

            // Build list of items
            const itemsContainer = document.getElementById('receipt-items-container');
            itemsContainer.innerHTML = '';
            cart.forEach(item => {
                const row = document.createElement('div');
                row.className = 'receipt-item-row';
                row.innerHTML = `
                    <div class="receipt-item-details">
                        <img src="${item.images[0]}" alt="${item.name}" class="receipt-item-img">
                        <div class="receipt-item-text">
                            <span style="font-weight:600;">${item.name}</span>
                            <span style="font-size:11px;color:var(--text-muted);">
                                Qty: ${item.quantity} · Size: ${item.selectedSize || '—'}
                            </span>
                        </div>
                    </div>
                    <div style="font-weight:600;">${(item.price * item.quantity).toLocaleString()} RWF</div>
                `;
                itemsContainer.appendChild(row);
            });

            // Build WhatsApp Message
            let msg = `🧾 *IDDY COLLECTION ORDER RECEIPT*\n`;
            msg += `*Order Number:* ${orderId}\n`;
            msg += `*Date:* ${dateStr}\n\n`;
            msg += `*Customer Details:*\n`;
            msg += `• Name: ${name}\n`;
            msg += `• WhatsApp: ${phone}\n\n`;
            msg += `*Items Ordered:*\n`;

            let index = 1;
            cart.forEach(item => {
                msg += `${index}. *${item.name}* ${item.selectedSize ? `(Size: ${item.selectedSize})` : ''}\n`;
                msg += `   Qty: ${item.quantity}\n`;
                msg += `   Price: ${(item.price * item.quantity).toLocaleString()} RWF\n`;
                const absoluteImgUrl = item.images[0].startsWith('http') 
                    ? item.images[0] 
                    : `${window.location.origin}/${item.images[0]}`;
                msg += `   Image: ${absoluteImgUrl}\n\n`;
                index++;
            });

            msg += `*TOTAL AMOUNT: ${total.toLocaleString()} RWF*\n\n`;
            msg += `Please confirm my order and guide me on payment. Thank you!`;

            currentOrderMsg = encodeURIComponent(msg);

            // Transition modals
            checkoutInfoModal.classList.remove('active');
            receiptModal.classList.add('active');

            // Clear Cart after receipt is generated
            clearCart();
        });
    }

    const closeAllReceipt = () => {
        if (receiptModal) receiptModal.classList.remove('active');
        // Reset order variables to prevent any trace in memory
        currentOrderMsg = '';
        currentOrderPhone = '';
        // Clear receipt modal DOM elements to ensure 100% complete privacy
        const receiptOrderIdEl = document.getElementById('receipt-order-id');
        const receiptDateEl = document.getElementById('receipt-date');
        const receiptNameEl = document.getElementById('receipt-cust-name');
        const receiptPhoneEl = document.getElementById('receipt-cust-phone');
        const receiptTotalEl = document.getElementById('receipt-total-val');
        const receiptItemsEl = document.getElementById('receipt-items-container');

        if (receiptOrderIdEl) receiptOrderIdEl.textContent = 'Order: #IMZ-XXXXXX';
        if (receiptDateEl) receiptDateEl.textContent = '';
        if (receiptNameEl) receiptNameEl.textContent = '';
        if (receiptPhoneEl) receiptPhoneEl.textContent = '';
        if (receiptTotalEl) receiptTotalEl.textContent = '0 RWF';
        if (receiptItemsEl) receiptItemsEl.innerHTML = '';
    };

    if (closeReceiptModal) {
        closeReceiptModal.addEventListener('click', closeAllReceipt);
    }

    if (receiptCheckoutBtn) {
        receiptCheckoutBtn.addEventListener('click', () => {
            sendOrderToWhatsApp();
        });
    }

    let cachedWhatsAppNumber = '250794476826';
    if (typeof getSettings === 'function') {
        getSettings().then(settings => {
            if (settings) {
                if (settings.whatsapp_number) {
                    cachedWhatsAppNumber = settings.whatsapp_number.replace(/[^0-9]/g, '');
                }
                
                // Update footer social links if they exist on the page
                const footerIg = document.getElementById('footer-ig');
                if (footerIg && settings.instagram_link) {
                    footerIg.href = settings.instagram_link;
                    footerIg.style.display = 'inline-block';
                }
                const footerTk = document.getElementById('footer-tk');
                if (footerTk && settings.tiktok_link) {
                    footerTk.href = settings.tiktok_link;
                    footerTk.style.display = 'inline-block';
                }
            }
        }).catch(e => console.error("Error fetching settings:", e));
    }

    function sendOrderToWhatsApp() {
        if (currentOrderMsg) {
            const waUrl = `https://wa.me/${cachedWhatsAppNumber}?text=${currentOrderMsg}`;
            window.open(waUrl, '_blank');
            // Auto-close and wipe the receipt details immediately upon redirect for absolute privacy
            closeAllReceipt();
        }
    }

    if (receiptPrintBtn) {
        receiptPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // ── Quick View Modal ──────────────────────
    const qvHtml = `
    <div class="modal" id="quick-view-modal">
        <div class="modal-content qv-container">
            <button id="close-qv" style="position:absolute;top:15px;right:15px;background:rgba(0,0,0,0.5);
                border:none;color:#fff;width:32px;height:32px;border-radius:50%;
                font-size:16px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;">✕</button>

            <div class="qv-slider" style="flex-direction:column;">
                <img src="" id="qv-main-img" class="qv-img" alt="Product Image"
                     style="flex:1;max-height:380px;padding:20px;">
                <!-- thumbnail strip -->
                <div class="qv-thumbnails" id="qv-thumbs"></div>
                <!-- prev / next arrows only when >1 image -->
                <div id="qv-arrows" style="display:none;position:absolute;top:50%;
                     left:0;right:0;display:flex;justify-content:space-between;padding:0 10px;pointer-events:none;">
                    <button class="carousel-btn" id="qv-prev-btn"
                            style="width:36px;height:36px;pointer-events:all;font-size:16px;">←</button>
                    <button class="carousel-btn" id="qv-next-btn"
                            style="width:36px;height:36px;pointer-events:all;font-size:16px;">→</button>
                </div>
            </div>

            <div class="qv-info">
                <h2 id="qv-title" style="font-size:22px;margin-bottom:8px;"></h2>
                <div id="qv-price" class="text-primary"
                     style="font-family:var(--font-display);font-size:22px;margin-bottom:14px;"></div>
                <p id="qv-desc" style="color:var(--text-muted);margin-bottom:16px;line-height:1.6;font-size:14px;"></p>
                <div style="margin-bottom:20px;font-size:13px;color:var(--text-muted);line-height:1.8;">
                    <strong>Category:</strong> <span id="qv-category" style="color:var(--text);"></span><br>
                    <strong>Gender:</strong>   <span id="qv-gender"   style="color:var(--text);"></span><br>
                    <strong>Stock:</strong>    <span id="qv-stock"    style="color:var(--text);"></span> units
                </div>
                <div style="margin-bottom:20px;" id="qv-sizes-wrap">
                    <strong style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:8px;">Select Size:</strong>
                    <div id="qv-sizes-container" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
                </div>
                <button class="btn btn-primary" id="qv-add-cart"
                        style="width:100%;padding:15px;font-size:15px;">Add to Cart</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', qvHtml);


    // ── Quick View wiring ─────────────────────
    const qvModal   = document.getElementById('quick-view-modal');
    const closeQv   = document.getElementById('close-qv');
    const qvImg     = document.getElementById('qv-main-img');
    const qvPrev    = document.getElementById('qv-prev-btn');
    const qvNext    = document.getElementById('qv-next-btn');
    const qvArrows  = document.getElementById('qv-arrows');
    const qvAddCart = document.getElementById('qv-add-cart');
    const qvThumbs  = document.getElementById('qv-thumbs');

    let currentQvImages = [];
    let currentQvIndex  = 0;
    let currentQvId     = null;

    closeQv.addEventListener('click', () => qvModal.classList.remove('active'));
    qvModal.addEventListener('click', e => { if (e.target === qvModal) qvModal.classList.remove('active'); });

    function setQvImage(idx) {
        currentQvIndex = (idx + currentQvImages.length) % currentQvImages.length;
        qvImg.style.opacity = 0;
        setTimeout(() => {
            qvImg.src = currentQvImages[currentQvIndex];
            qvImg.style.opacity = 1;
            // update thumb highlight
            qvThumbs.querySelectorAll('.qv-thumb').forEach((t, i) =>
                t.classList.toggle('active', i === currentQvIndex));
        }, 150);
    }

    if (qvPrev) qvPrev.addEventListener('click', () => setQvImage(currentQvIndex - 1));
    if (qvNext) qvNext.addEventListener('click', () => setQvImage(currentQvIndex + 1));

    qvAddCart.addEventListener('click', () => {
        if (currentQvId) {
            let selectedSize = null;
            const activeChip = document.querySelector('#qv-sizes-container .qv-size-chip.selected');
            if (activeChip) {
                selectedSize = activeChip.textContent;
            }
            addToCart(currentQvId, 1, selectedSize);
            qvModal.classList.remove('active');
            window.openCart();
        }
    });

    window.openQuickView = async function (productId) {
        const products = await getProducts();
        const p = products.find(pr => pr.id === productId);
        if (!p) return;

        currentQvId     = p.id;
        currentQvImages = p.images && p.images.length ? p.images : [''];
        currentQvIndex  = 0;

        document.getElementById('qv-title').textContent    = p.name;
        document.getElementById('qv-price').textContent    = p.price.toLocaleString() + ' RWF';
        document.getElementById('qv-desc').textContent     = p.description;
        document.getElementById('qv-category').textContent = p.mainCategory + ' › ' + p.subCategory;
        document.getElementById('qv-gender').textContent   = p.gender;
        document.getElementById('qv-stock').textContent    = p.stock;

        // Build thumbnail strip
        qvThumbs.innerHTML = currentQvImages.map((src, i) =>
            `<img src="${src}" class="qv-thumb ${i === 0 ? 'active' : ''}"
                  onclick="setQvImgPublic(${i})" alt="Image ${i + 1}">`).join('');

        // Show/hide arrows
        const hasMulti = currentQvImages.length > 1;
        if (qvArrows) qvArrows.style.display = hasMulti ? 'flex' : 'none';

        // Populate sizes
        const sizeContainer = document.getElementById('qv-sizes-container');
        const sizeWrap = document.getElementById('qv-sizes-wrap');
        if (sizeContainer && sizeWrap) {
            sizeContainer.innerHTML = '';
            const sizes = p.sizes || [];
            if (sizes.length > 0) {
                sizeWrap.style.display = 'block';
                sizes.forEach((size, idx) => {
                    const chip = document.createElement('div');
                    chip.className = 'qv-size-chip';
                    if (idx === 0) chip.classList.add('selected');
                    chip.textContent = size;
                    chip.addEventListener('click', () => {
                        sizeContainer.querySelectorAll('.qv-size-chip').forEach(c => c.classList.remove('selected'));
                        chip.classList.add('selected');
                    });
                    sizeContainer.appendChild(chip);
                });
            } else {
                sizeWrap.style.display = 'none';
            }
        }

        qvImg.src = currentQvImages[0];
        qvModal.classList.add('active');
    };

    // expose setQvImage for thumbnails inline onclick
    window.setQvImgPublic = (idx) => setQvImage(idx);

    // ── Active Nav Link Highlight ─────────────
    function highlightActiveLinks() {
        const path = window.location.pathname;
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const category = params.get('category');

        const navLinks = document.querySelectorAll('header nav ul li a, .mobile-nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (!href) return;

            if (href === 'index.html' || href === '/') {
                if (path.endsWith('index.html') || path === '/' || path === '' || path.endsWith('/')) {
                    link.classList.add('active');
                }
            } else if (href.includes('shop.html')) {
                if (href.includes('category=')) {
                    const linkCat = new URL(href, window.location.origin).searchParams.get('category');
                    if (path.endsWith('shop.html') && category === linkCat) {
                        link.classList.add('active');
                    }
                } else {
                    if (path.endsWith('shop.html') && !category) {
                        link.classList.add('active');
                    }
                }
            }
        });
    }
    highlightActiveLinks();

}); // end DOMContentLoaded
