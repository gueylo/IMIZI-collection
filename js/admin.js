// js/admin.js
// Depends on: store.js  (loaded first)
// ALL code is inside DOMContentLoaded for safety.

document.addEventListener('DOMContentLoaded', function () {

    // ── Sub-category map ─────────────────────────────────
    var SUBCATS = {
        Men:   ['T-Shirts','Hoodies','Shirts','Jackets','Jeans','Pants','Casual Wear','Formal Wear','Traditional Wear','Accessories'],
        Women: ['Dresses','Tops','Skirts','Jeans','Pants','Jackets','Casual Wear','Traditional Wear','Accessories'],
        Shoes: ['Sneakers','Boots','Sandals','Heels','Formal Shoes','Flats','Loafers','Slides','Open Shoes'],
        Accessories: ['Perfumes','Watches','Flat Hats']
    };

    // ── State ─────────────────────────────────────────────
    var filterCat   = 'All';
    var searchText  = '';
    var editingId   = '';

    // ── Toast ─────────────────────────────────────────────
    var toast = document.getElementById('toast');
    var toastTimer;
    function showToast(msg, type) {
        toast.textContent = msg;
        toast.className   = 'on ' + (type === 'err' ? 'err' : 'ok');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toast.className = ''; }, 3500);
    }

    // ── Auth ──────────────────────────────────────────────
    var loginScreen = document.getElementById('login-screen');
    var adminPanel  = document.getElementById('admin-panel');
    var loginForm   = document.getElementById('login-form');
    var loginErr    = document.getElementById('login-err');

    function showPanel() {
        loginScreen.style.display = 'none';
        adminPanel.style.display  = 'block';
        refreshAll();
    }

    // Already logged in?
    if (sessionStorage.getItem('iddy_auth') === '1') { showPanel(); }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var u = document.getElementById('username').value.trim();
        var p = document.getElementById('password').value.trim(); // Also trim the password just in case
        
        var btn = loginForm.querySelector('button[type="submit"]');
        var originalText = btn.textContent;
        btn.textContent = 'Logging in...';
        btn.disabled = true;

        var result = await adminLogin(u, p);
        
        btn.textContent = originalText;
        btn.disabled = false;

        if (result.success) {
            sessionStorage.setItem('iddy_auth', '1');
            loginErr.style.display = 'none';
            showPanel();
        } else {
            loginErr.textContent = result.error || 'Invalid credentials';
            loginErr.style.display = 'block';
        }
    });

    document.getElementById('logout-btn').addEventListener('click', function() {
        sessionStorage.removeItem('iddy_auth');
        location.reload();
    });


    // ── Stats ─────────────────────────────────────────────
    async function renderStats() {
        var all  = await getProducts();
        var el   = document.getElementById('stats');
        el.innerHTML = [
            ['Total', all.length],
            ['Men',   all.filter(function(p){return p.mainCategory==='Men';}).length],
            ['Women', all.filter(function(p){return p.mainCategory==='Women';}).length],
            ['Shoes', all.filter(function(p){return p.mainCategory==='Shoes';}).length],
            ['Featured', all.filter(function(p){return p.featured;}).length]
        ].map(function(s){
            return '<div class="stat"><div class="lbl">'+s[0]+'</div><div class="val">'+s[1]+'</div></div>';
        }).join('');
    }

    // ── Table ─────────────────────────────────────────────
    function catBadge(c) {
        var cls = c==='Men'?'b-men':c==='Women'?'b-women':c==='Shoes'?'b-shoes':'b-acc';
        return '<span class="badge '+cls+'">'+c+'</span>';
    }

    async function renderTable() {
        var tbody   = document.getElementById('prod-tbody');
        var noMsg   = document.getElementById('no-products');
        var products = await getProducts();

        // Filter
        if (filterCat !== 'All') {
            products = products.filter(function(p){ return p.mainCategory === filterCat; });
        }
        if (searchText) {
            var normQ = searchText.toLowerCase().replace(/[\s\W_]+/g, '');
            products = products.filter(function(p){
                var normName = p.name.toLowerCase().replace(/[\s\W_]+/g, '');
                var normCat = (p.subCategory||'').toLowerCase().replace(/[\s\W_]+/g, '');
                return normName.indexOf(normQ) !== -1 || normCat.indexOf(normQ) !== -1;
            });
        }

        tbody.innerHTML = '';

        if (!products.length) {
            noMsg.style.display = 'block';
            return;
        }
        noMsg.style.display = 'none';

        products.forEach(function(p) {
            var imgSrc = (p.images && p.images[0]) ? p.images[0] : '';
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><img src="'+imgSrc+'" alt="'+p.name+'" onerror="this.style.opacity=0.1"></td>'+
                '<td><strong>'+p.name+'</strong><br><small style="color:var(--text-muted)">'+(p.subCategory||'')+'</small></td>'+
                '<td>'+catBadge(p.mainCategory)+'</td>'+
                '<td>'+p.gender+'</td>'+
                '<td><strong>'+Number(p.price).toLocaleString()+'</strong></td>'+
                '<td>'+p.stock+'</td>'+
                '<td>'+(p.featured?'<span class="badge b-yes">Yes</span>':'<span style="color:var(--text-muted)">—</span>')+'</td>'+
                '<td style="white-space:nowrap">'+
                    '<button class="ab ab-e" data-id="'+p.id+'"><i class="fa-solid fa-pen" style="font-size:11px;"></i> Edit</button> '+
                    '<button class="ab ab-d" data-id="'+p.id+'"><i class="fa-solid fa-trash" style="font-size:11px;"></i> Del</button>'+
                '</td>';
            tbody.appendChild(tr);
        });

        // Wire buttons
        tbody.querySelectorAll('.ab-e').forEach(function(btn) {
            btn.addEventListener('click', function() { openEdit(btn.getAttribute('data-id')); });
        });
        tbody.querySelectorAll('.ab-d').forEach(function(btn) {
            btn.addEventListener('click', function() { handleDelete(btn.getAttribute('data-id')); });
        });
    }

    async function refreshAll() {
        await renderStats();
        await renderTable();
    }

    // ── Filter chips ──────────────────────────────────────
    document.querySelectorAll('.chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('on'); });
            chip.classList.add('on');
            filterCat = chip.getAttribute('data-cat');
            renderTable();
        });
    });

    document.getElementById('adm-search').addEventListener('input', function(e) {
        searchText = e.target.value.trim().toLowerCase();
        renderTable();
    });

    // ── Sidebar view buttons ──────────────────────────────
    window.setView = async function(cat, btn) {
        document.querySelectorAll('.adm-nav button').forEach(function(b){ b.classList.remove('active'); });
        if (btn) btn.classList.add('active');

        if (cat === 'Settings') {
            document.getElementById('products-view').style.display = 'none';
            document.getElementById('settings-view').style.display = 'block';
            
            // Load settings
            var settings = await getSettings();
            if (settings) {
                if (settings.whatsapp_number) document.getElementById('wa-number').value = settings.whatsapp_number;
                if (settings.instagram_link) document.getElementById('ig-link').value = settings.instagram_link;
                if (settings.tiktok_link) document.getElementById('tk-link').value = settings.tiktok_link;
            }
        } else {
            document.getElementById('products-view').style.display = 'block';
            document.getElementById('settings-view').style.display = 'none';

            filterCat = cat;
            document.getElementById('view-title').textContent = cat === 'All' ? 'All Products' : cat;
            document.querySelectorAll('.chip').forEach(function(c){
                c.classList.toggle('on', c.getAttribute('data-cat') === cat);
            });
            renderTable();
        }
    };

    // ── Settings Form Submit ──────────────────────────────
    document.getElementById('settings-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var waNumber = document.getElementById('wa-number').value.trim();
        var igLink = document.getElementById('ig-link').value.trim();
        var tkLink = document.getElementById('tk-link').value.trim();
        
        if (!waNumber) {
            showToast('WhatsApp number is required', 'err');
            return;
        }

        var btn = document.getElementById('save-settings-btn');
        btn.textContent = 'Saving...';
        btn.disabled = true;

        var p = [updateSetting('whatsapp_number', waNumber)];
        if (igLink !== undefined) p.push(updateSetting('instagram_link', igLink));
        if (tkLink !== undefined) p.push(updateSetting('tiktok_link', tkLink));
        
        var results = await Promise.all(p);
        var success = results.every(function(r) { return r === true; });
        
        btn.textContent = 'Save Settings';
        btn.disabled = false;

        if (success) {
            showToast('Settings saved successfully', 'ok');
        } else {
            showToast('Failed to save some settings', 'err');
        }
    });

    // ── Sub-category dropdown ─────────────────────────────
    var fCat = document.getElementById('f-cat');
    var fSub = document.getElementById('f-sub');

    var SIZE_MAP = {
        Shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
        Pants: ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40'],
        Clothes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        Accessories: ['One Size']
    };

    function renderSizeOptions(selectedSizes) {
        var container = document.getElementById('size-options-container');
        if (!container) return;
        container.innerHTML = '';

        var cat = fCat.value;
        var sub = fSub.value;

        var sizeList = [];
        if (cat === 'Shoes') {
            sizeList = SIZE_MAP.Shoes;
        } else if (cat === 'Accessories') {
            sizeList = SIZE_MAP.Accessories;
        } else if (sub === 'Jeans' || sub === 'Pants') {
            sizeList = SIZE_MAP.Pants;
        } else {
            sizeList = SIZE_MAP.Clothes;
        }

        selectedSizes = selectedSizes || [];

        sizeList.forEach(function(size) {
            var chip = document.createElement('div');
            chip.className = 'size-chip';
            if (selectedSizes.includes(size)) {
                chip.classList.add('selected');
            }
            chip.textContent = size;
            chip.setAttribute('data-size', size);
            chip.addEventListener('click', function() {
                chip.classList.toggle('selected');
            });
            container.appendChild(chip);
        });
    }

    function fillSubCats(main, selected) {
        var opts = SUBCATS[main] || [];
        fSub.innerHTML = opts.map(function(s){
            return '<option value="'+s+'"'+(s===selected?' selected':'')+'>'+s+'</option>';
        }).join('');
        renderSizeOptions([]);
    }

    fCat.addEventListener('change', function(){
        fillSubCats(fCat.value, '');
    });
    fSub.addEventListener('change', function(){
        renderSizeOptions([]);
    });
    fillSubCats('Men', '');

    // ── Image Uploads & State ─────────────────────────────
    var uploadedImages = [];

    var uploadZone = document.getElementById('upload-zone');
    var fImgs      = document.getElementById('f-imgs');
    var strip      = document.getElementById('img-strip');

    // Click zone to trigger input click
    uploadZone.addEventListener('click', function() {
        fImgs.click();
    });

    // Drag-and-drop events
    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', function() {
        uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fImgs.addEventListener('change', function() {
        if (fImgs.files) {
            handleFiles(fImgs.files);
        }
    });

    function handleFiles(files) {
        if (uploadedImages.length >= 5) {
            showToast('Max 5 images allowed.', 'err');
            return;
        }

        var remaining = 5 - uploadedImages.length;
        var count = Math.min(files.length, remaining);

        for (var i = 0; i < count; i++) {
            var file = files[i];
            if (!file.type.match('image.*')) {
                showToast('Only image files are supported.', 'err');
                continue;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image size exceeds 2MB limit.', 'err');
                continue;
            }

            var reader = new FileReader();
            reader.onload = (function(f) {
                return function(e) {
                    compressImage(e.target.result, function(compressedBase64) {
                        uploadedImages.push(compressedBase64);
                        renderImageStrip();
                    });
                };
            })(file);
            reader.readAsDataURL(file);
        }
    }

    // Compress & scale down image via canvas to save localStorage space
    function compressImage(base64Str, callback) {
        var img = new Image();
        img.src = base64Str;
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var MAX_WIDTH = 500;
            var MAX_HEIGHT = 500;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            var compressed = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressed);
        };
    }

    function renderImageStrip() {
        strip.innerHTML = '';
        uploadedImages.forEach(function(src, index) {
            var container = document.createElement('div');
            container.className = 'img-thumb-container';

            var img = document.createElement('img');
            img.src = src;

            var removeBtn = document.createElement('button');
            removeBtn.className = 'img-thumb-remove';
            removeBtn.type = 'button';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                uploadedImages.splice(index, 1);
                renderImageStrip();
            });

            container.appendChild(img);
            container.appendChild(removeBtn);
            strip.appendChild(container);
        });
    }

    // ── Modal open / close ────────────────────────────────
    var overlay   = document.getElementById('prod-overlay');
    var formTitle = document.getElementById('form-title');
    var prodForm  = document.getElementById('prod-form');

    function openModal() { overlay.classList.add('on'); }
    function closeModal() {
        overlay.classList.remove('on');
        prodForm.reset();
        uploadedImages = [];
        renderImageStrip();
        editingId = '';
        fillSubCats('Men', '');
    }

    document.getElementById('close-form').addEventListener('click',  closeModal);
    document.getElementById('cancel-form').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });

    // ── Open Add ──────────────────────────────────────────
    document.getElementById('open-add').addEventListener('click', function() {
        editingId = '';
        formTitle.textContent = 'Add New Product';
        fCat.value = 'Men';
        fillSubCats('Men', '');
        uploadedImages = [];
        renderImageStrip();
        openModal();
    });

    // ── Open Edit ─────────────────────────────────────────
    async function openEdit(id) {
        var products = await getProducts();
        var p = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === id) { p = products[i]; break; }
        }
        if (!p) { showToast('Product not found', 'err'); return; }

        editingId = p.id;
        formTitle.textContent = 'Edit Product';

        document.getElementById('f-name').value  = p.name;
        document.getElementById('f-desc').value  = p.description || '';
        document.getElementById('f-price').value = p.price;
        document.getElementById('f-stock').value = p.stock;
        fCat.value = p.mainCategory;
        fillSubCats(p.mainCategory, p.subCategory);
        renderSizeOptions(p.sizes || []);
        document.getElementById('f-gender').value = p.gender;
        document.getElementById('f-featured').checked = !!p.featured;
        uploadedImages = p.images ? JSON.parse(JSON.stringify(p.images)) : [];
        renderImageStrip();
        openModal();
    }

    // ── Delete ────────────────────────────────────────────
    async function handleDelete(id) {
        var products = await getProducts();
        var p = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === id) { p = products[i]; break; }
        }
        if (!p) return;
        if (!confirm('Delete "'+p.name+'"?\nThis removes it from the website immediately.')) return;
        await deleteProduct(id);
        showToast('"'+p.name+'" deleted.', 'err');
        await refreshAll();
    }

    // ── Form Submit ───────────────────────────────────────
    prodForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        var name  = document.getElementById('f-name').value.trim();
        var desc  = document.getElementById('f-desc').value.trim();
        var price = parseInt(document.getElementById('f-price').value, 10);
        var stock = parseInt(document.getElementById('f-stock').value, 10);
        var cat   = fCat.value;
        var sub   = fSub.value;
        var gen   = document.getElementById('f-gender').value;
        var imgs  = uploadedImages;
        var feat  = document.getElementById('f-featured').checked;

        var selectedSizes = [];
        document.querySelectorAll('#size-options-container .size-chip.selected').forEach(function(chip) {
            selectedSizes.push(chip.getAttribute('data-size'));
        });

        // Basic validation
        if (!name)            { showToast('Product name is required', 'err'); return; }
        if (!desc)            { showToast('Description is required', 'err');  return; }
        if (isNaN(price) || price < 0) { showToast('Enter a valid price in RWF', 'err'); return; }
        if (isNaN(stock) || stock < 0) { showToast('Enter a valid stock number', 'err'); return; }
        if (!selectedSizes.length) { showToast('Please select at least one size', 'err'); return; }
        if (!imgs.length)     { showToast('Please upload at least one image', 'err'); return; }

        var data = {
            name: name,
            description: desc,
            price: price,
            stock: stock,
            mainCategory: cat,
            subCategory: sub,
            gender: gen,
            images: imgs,
            featured: feat,
            sizes: selectedSizes
        };

        var submitBtn = document.getElementById('form-submit-btn');
        var oldSubmitText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        if (editingId) {
            var res = await updateProduct(editingId, data);
            if (res && res.success) {
                showToast('"'+name+'" updated ✓  — live on website', 'ok');
                closeModal();
            } else {
                showToast('Error: ' + (res ? res.error : 'Failed to update'), 'err');
                console.error("Update error:", res);
            }
        } else {
            var res = await addProduct(data);
            if (res && res.success) {
                showToast('"'+name+'" added ✓  — live on website', 'ok');
                closeModal();
            } else {
                showToast('Error: ' + (res ? res.error : 'Failed to add'), 'err');
                console.error("Add error:", res);
            }
        }

        submitBtn.textContent = oldSubmitText;
        submitBtn.disabled = false;
        await refreshAll();
    });

}); // end DOMContentLoaded
