// js/store.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase Client
const SUPABASE_URL = 'https://ycilgtlhbotpoourhper.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaWxndGxoYm90cG9vdXJocGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzIwMDgsImV4cCI6MjA5OTI0ODAwOH0.d5s6SH9qjy-ehBuy3BeQKzu9rV5Fi80kNVRFDN4d69Y';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORE_KEY   = 'iddy_products';
const CART_KEY    = 'iddy_cart';
const THEME_KEY   = 'iddy_theme';
const WISH_KEY    = 'iddy_wishlist';

function initStore() {
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(WISH_KEY)) {
        localStorage.setItem(WISH_KEY, JSON.stringify([]));
    }
}

// ── Products ─────────────────────────────────────────────
async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('dateAdded', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('getProducts error:', e);
        // Fallback to dummy products if database fails
        return [];
    }
}

async function addProduct(product) {
    try {
        if (!product.id) {
            product.id = 'prod_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
        }
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select();
            
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (e) {
        console.error('addProduct error:', e);
        return { success: false, error: e.message };
    }
}

async function updateProduct(id, updatedData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(updatedData)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (e) {
        console.error('updateProduct error:', e);
        return { success: false, error: e.message };
    }
}

async function deleteProduct(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('deleteProduct error:', e);
        return false;
    }
}

// ── Settings ─────────────────────────────────────────────
async function getSettings() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*');
            
        if (error) throw error;
        
        const settingsObj = {};
        data.forEach(item => { settingsObj[item.key] = item.value; });
        return settingsObj;
    } catch (e) {
        console.error('getSettings error:', e);
        return {};
    }
}

async function updateSetting(key, value) {
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: key, value: value, updated_at: new Date() }, { onConflict: 'key' });
            
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('updateSetting error:', e);
        return false;
    }
}

// ── Cart ──────────────────────────────────────────────────
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) { return []; }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

async function addToCart(productId, quantity = 1, size = null) {
    const products = await getProducts();
    const product  = products.find(p => p.id === productId);
    if (!product) { alert('Product not found.'); return; }

    let cart = getCart();
    const idx = cart.findIndex(i => i.id === productId && (i.selectedSize || null) === (size || null));

    if (idx !== -1) {
        const newQty = cart[idx].quantity + quantity;
        if (newQty > product.stock) { alert('Maximum stock reached.'); return; }
        cart[idx].quantity = newQty;
    } else {
        if (quantity > product.stock) { alert('Not enough stock.'); return; }
        cart.push({ ...product, quantity, selectedSize: size });
    }
    saveCart(cart);
}

function removeFromCart(productId, size = null) {
    saveCart(getCart().filter(i => !(i.id === productId && (i.selectedSize || null) === (size || null))));
}

async function updateCartQuantity(productId, size = null, quantity) {
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === productId && (i.selectedSize || null) === (size || null));
    if (idx === -1) return;

    if (quantity <= 0) {
        cart.splice(idx, 1);
    } else {
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        if (product && quantity <= product.stock) {
            cart[idx].quantity = quantity;
        }
    }
    saveCart(cart);
}

function clearCart() { saveCart([]); }

// ── Wishlist ──────────────────────────────────────────────
function getWishlistIds() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; }
    catch (e) { return []; }
}

// ── Admin Login (Supabase Auth) ───────────────────────────
async function adminLogin(username, password) {
    try {
        // Because Supabase Auth uses email, we'll map the username 'gueylo' to the admin email
        const email = username === 'gueylo' ? 'gueylo@izzi.com' : username;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: !!data.session };
    } catch (e) {
        console.error("Login failed:", e);
        return { success: false, error: 'Network error or invalid credentials' };
    }
}

// Check session on load to maintain admin state
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) sessionStorage.setItem('iddy_auth', '1');
});

// Expose supabase to global scope just in case other scripts need it
window.supabaseClient = supabase;

// ── Auto-init ─────────────────────────────────────────────
initStore();

// Attach global functions to window so they are accessible by other scripts since this is now an ES Module
window.getProducts = getProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getSettings = getSettings;
window.updateSetting = updateSetting;
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.getWishlistIds = getWishlistIds;
window.adminLogin = adminLogin;
