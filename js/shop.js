// js/shop.js
// ─────────────────────────────────────────────────────────
// Reads all products fresh from localStorage on every render.
// Supports: main-category, sub-category, gender, search, sort.
// ─────────────────────────────────────────────────────────

const SUB_CAT_MAP = {
    Men:   ['T-Shirts','Hoodies','Shirts','Jackets','Jeans','Pants','Casual Wear','Formal Wear','Traditional Wear','Accessories'],
    Women: ['Dresses','Tops','Skirts','Jeans','Pants','Jackets','Casual Wear','Traditional Wear','Accessories'],
    Shoes: ['Sneakers','Boots','Sandals','Heels','Formal Shoes','Flats','Loafers','Slides','Open Shoes'],
    Accessories: ['Perfumes','Watches','Flat Hats']
};

document.addEventListener('DOMContentLoaded', () => {

    const shopGrid    = document.getElementById('shop-grid');
    const shopTitle   = document.getElementById('shop-title');
    const searchInput = document.getElementById('search-input');
    const sortSelect  = document.getElementById('sort-select');
    const subCatGroup = document.getElementById('sub-cat-group');
    const subCatList  = document.getElementById('sub-cat-list');

    const mainCatRadios = () => document.querySelectorAll('input[name="mainCat"]');
    const genderRadios  = () => document.querySelectorAll('input[name="gender"]');
    const subCatRadios  = () => document.querySelectorAll('input[name="subCat"]');

    // ── URL params ───────────────────────────────────────
    const params    = new URLSearchParams(window.location.search);
    const initCat   = params.get('category'); // Men | Women | Shoes
    const initQuery = params.get('q');
    const initSub   = params.get('sub');

    if (initCat) {
        mainCatRadios().forEach(r => { if (r.value === initCat) r.checked = true; });
        shopTitle.textContent = initCat.toUpperCase();
    }
    const isShoePage  = initCat === 'Shoes';
    const isMenPage   = initCat === 'Men';
    const isWomenPage = initCat === 'Women';
    const isAccessoriesPage = initCat === 'Accessories';

    if (isShoePage) {
        const mainCatFilter = document.getElementById('main-category-filter');
        if (mainCatFilter) {
            mainCatFilter.innerHTML = `
                <li><label><input type="radio" name="mainCat" value="All" checked> All Shoes</label></li>
                <li><label><input type="radio" name="mainCat" value="Men"> Men's Shoes</label></li>
                <li><label><input type="radio" name="mainCat" value="Women"> Women's Shoes</label></li>
            `;
        }
        const genderFilterGroup = document.getElementById('gender-filter')?.closest('.filter-group');
        if (genderFilterGroup) genderFilterGroup.style.display = 'none';
    } else if (isMenPage || isWomenPage || isAccessoriesPage) {
        const mainCatFilterGroup = document.getElementById('main-category-filter')?.closest('.filter-group');
        if (mainCatFilterGroup) mainCatFilterGroup.style.display = 'none';

        const genderFilterGroup = document.getElementById('gender-filter')?.closest('.filter-group');
        if (genderFilterGroup) genderFilterGroup.style.display = 'none';
    }
    if (initQuery && searchInput) searchInput.value = initQuery;

    // ── Sub-category builder ─────────────────────────────
    function buildSubCats(mainCat, keepSelected) {
        const cats = SUB_CAT_MAP[mainCat] || [];
        if (!cats.length || !subCatList) {
            if (subCatGroup) subCatGroup.style.display = 'none';
            return;
        }
        if (subCatGroup) subCatGroup.style.display = '';

        const currentSel = keepSelected ||
            (document.querySelector('input[name="subCat"]:checked')?.value) || 'All';

        subCatList.innerHTML =
            `<li><label><input type="radio" name="subCat" value="All" ${currentSel === 'All' ? 'checked' : ''}> All</label></li>` +
            cats.map(c =>
                `<li><label><input type="radio" name="subCat" value="${c}" ${c === currentSel ? 'checked' : ''}> ${c}</label></li>`
            ).join('');

        subCatRadios().forEach(r => r.addEventListener('change', renderShop));
    }

    // Build sub-cats for initial URL category
    if (initCat && SUB_CAT_MAP[initCat]) buildSubCats(initCat, initSub || 'All');

    // ── Sort helper ──────────────────────────────────────
    function sortProducts(list, mode) {
        switch (mode) {
            case 'price-asc':  return [...list].sort((a, b) => a.price - b.price);
            case 'price-desc': return [...list].sort((a, b) => b.price - a.price);
            case 'name':       return [...list].sort((a, b) => a.name.localeCompare(b.name));
            case 'newest':
            default:           return [...list].sort((a, b) =>
                                    new Date(b.dateAdded) - new Date(a.dateAdded));
        }
    }

    // ── Main render ──────────────────────────────────────
    function renderShop() {
        showSkeletons(shopGrid, 12);

        setTimeout(async () => {
            // Always fetch fresh from Netlify Functions
            const allProducts = await getProducts();

            const selMain   = document.querySelector('input[name="mainCat"]:checked')?.value || 'All';
            const selGender = document.querySelector('input[name="gender"]:checked')?.value  || 'All';
            const selSub    = document.querySelector('input[name="subCat"]:checked')?.value  || 'All';
            const query     = (searchInput?.value || '').toLowerCase().trim();
            const normQuery = query.replace(/[\s\W_]+/g, '');
            const sortMode  = sortSelect?.value || 'newest';

            // Update title
            if (isShoePage) {
                if (selMain === 'All') shopTitle.textContent = 'SHOES';
                else if (selMain === 'Men') shopTitle.textContent = "MEN'S SHOES";
                else if (selMain === 'Women') shopTitle.textContent = "WOMEN'S SHOES";
            } else {
                shopTitle.textContent = selMain !== 'All' ? selMain.toUpperCase() : 'COLLECTION';
            }

            // Rebuild sub-cats when main cat is selected
            if (isShoePage) {
                buildSubCats('Shoes');
            } else if (selMain !== 'All') {
                buildSubCats(selMain);
            } else {
                if (subCatGroup) subCatGroup.style.display = 'none';
            }

            // Filter
            let filtered = allProducts.filter(p => {
                let matchMain   = false;
                let matchGender = false;

                if (isShoePage) {
                    matchMain = p.mainCategory === 'Shoes';
                    if (selMain === 'All') {
                        matchGender = true;
                    } else if (selMain === 'Men') {
                        matchGender = p.gender === 'Men' || p.gender === 'Unisex';
                    } else if (selMain === 'Women') {
                        matchGender = p.gender === 'Women' || p.gender === 'Unisex';
                    }
                } else if (isMenPage) {
                    matchMain = p.mainCategory === 'Men';
                    matchGender = p.gender === 'Men' || p.gender === 'Unisex';
                } else if (isWomenPage) {
                    matchMain = p.mainCategory === 'Women';
                    matchGender = p.gender === 'Women' || p.gender === 'Unisex';
                } else {
                    matchMain   = selMain   === 'All' || p.mainCategory === selMain;
                    matchGender = selGender === 'All' || p.gender       === selGender;
                }

                const matchSub    = selSub    === 'All' || p.subCategory  === selSub;
                let matchSearch = !normQuery;
                if (!matchSearch) {
                    const normName = (p.name || '').toLowerCase().replace(/[\s\W_]+/g, '');
                    const normDesc = (p.description || '').toLowerCase().replace(/[\s\W_]+/g, '');
                    const normCat  = (p.subCategory || '').toLowerCase().replace(/[\s\W_]+/g, '');
                    matchSearch = normName.includes(normQuery) || normDesc.includes(normQuery) || normCat.includes(normQuery);
                }
                return matchMain && matchGender && matchSub && matchSearch;
            });

            // Sort
            filtered = sortProducts(filtered, sortMode);

            if (!filtered.length) {
                shopGrid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                        <p style="color:var(--text-muted);font-size:15px;margin-bottom:12px;">
                            No products match your filters.
                        </p>
                        <a href="shop.html" class="btn btn-outline">Reset Filters</a>
                    </div>`;
                return;
            }

            shopGrid.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');
        }, 280);
    }

    // ── Attach listeners ─────────────────────────────────
    mainCatRadios().forEach(r => r.addEventListener('change', renderShop));
    genderRadios().forEach(r  => r.addEventListener('change', renderShop));
    if (searchInput) searchInput.addEventListener('input', renderShop);
    if (sortSelect)  sortSelect.addEventListener('change', renderShop);

    // Initial render
    renderShop();
});
