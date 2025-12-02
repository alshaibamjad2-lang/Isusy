// ---------- Supabase ----------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

//--------------------------------------------------
//   تحميل الأقسام + المنتجات
//--------------------------------------------------

let globalCategories = [];
let globalProducts = [];
let currentSection = "all";

async function loadMenu() {
    try {
        // تحميل الأقسام
        let { data: categories, error: catErr } = await client
            .from("categories")
            .select("*")
            .order("id");

        if (catErr) {
            console.error("خطأ جلب الأقسام:", catErr);
            categories = [];
        }

        // تحميل المنتجات
        let { data: products, error: prodErr } = await client
            .from("products")
            .select("*")
            .order("id");

        if (prodErr) {
            console.error("خطأ جلب المنتجات:", prodErr);
            products = [];
        }

        globalCategories = categories || [];
        globalProducts = products || [];

        renderSections();
        renderMeals();
    } catch (e) {
        console.error("loadMenu failed:", e);
    }
}

//--------------------------------------------------
//   الأقسام
//--------------------------------------------------

function renderSections() {
    const secDiv = document.getElementById("sections");
    if (!secDiv) return;
    secDiv.innerHTML = `
        <button class="section-btn active" data-section="all">الكل</button>
    `;

    globalCategories.forEach(cat => {
        secDiv.innerHTML += `
            <button class="section-btn" data-section="${cat.id}">
                ${cat.name}
            </button>
        `;
    });

    document.querySelectorAll(".section-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelector(".section-btn.active")?.classList.remove("active");
            btn.classList.add("active");
            currentSection = btn.dataset.section;
            renderMeals();
        };
    });
}

//--------------------------------------------------
//   عرض المنتجات — مع دعم الصور + السلة
//--------------------------------------------------

function renderMeals() {
    const mealsDiv = document.getElementById("meals");
    if (!mealsDiv) return;
    mealsDiv.innerHTML = "";

    let items = currentSection === "all"
        ? globalProducts
        : globalProducts.filter(p => p.category_id == currentSection);

    items.forEach(p => {
        const imgURL = p.image && p.image.length > 1
            ? p.image
            : "https://placehold.co/800x520?text=No+Image";

        mealsDiv.innerHTML += `
            <div class="meal">
                <div class="img">
                    <img src="${imgURL}" alt="${escapeHtml(p.name)}" />
                </div>
                <div class="info">
                    <h3>${escapeHtml(p.name)}</h3>
                    <div class="price">${p.price} ر.س</div>

                    <button 
                        class="add-to-cart"
                        data-id="${p.id}"
                        data-name="${escapeAttr(p.name)}"
                        data-price="${p.price}">
                        إضافة للسلة
                    </button>
                </div>
            </div>
        `;
    });

    applyViewClass();
}

// small helpers to avoid breaking attributes
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

//--------------------------------------------------
//   نظام العرض
//--------------------------------------------------

const views = [
  { cls:'mode-grid', label:'Grid 2×2' },
  { cls:'mode-grid3', label:'Grid 3×3' },
  { cls:'mode-row', label:'صف كامل' },
  { cls:'mode-slider', label:'Slider أفقي' },
  { cls:'mode-circle', label:'Circle Cards' },
  { cls:'mode-mag', label:'Magazine' },
  { cls:'mode-luxury', label:'Luxury Cards' },
  { cls:'mode-crystal', label:'Crystal Cards' }
];

let viewIndex = 0;

function applyViewClass() {
    const mealsEl = document.getElementById("meals");
    if (!mealsEl) return;
    mealsEl.className = "meals " + views[viewIndex].cls;
    const viewNameEl = document.getElementById("viewName");
    if (viewNameEl) viewNameEl.textContent = views[viewIndex].label;
}

document.getElementById("toggleView")?.addEventListener("click", ()=>{
    viewIndex = (viewIndex + 1) % views.length;
    renderMeals();
});

//--------------------------------------------------
//   السلة — FULL B MODE (سلة كاملة مثل الأصل)
//--------------------------------------------------

/* -------------------------
   فتح و إغلاق السلة
-------------------------- */

document.getElementById("openCart")?.addEventListener("click", () => {
    document.getElementById("cartSidebar")?.classList.add("open");
    document.getElementById("cartOverlay")?.classList.add("show");
});
document.getElementById("cartOverlay")?.addEventListener("click", () => {
    document.getElementById("cartSidebar")?.classList.remove("open");
    document.getElementById("cartOverlay")?.classList.remove("show");
});

/* -------------------------
   بيانات السلة
-------------------------- */

let cart = []; // items: { id, name, price, qty }

function updateCartUI() {
    const itemsDiv = document.getElementById("cartItems");
    if (!itemsDiv) return;
    itemsDiv.innerHTML = "";

    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price * (item.qty || 1);

        itemsDiv.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${escapeHtml(item.name)}</strong><br>
                    <span>${(item.price * (item.qty || 1)).toFixed(2)} ر.س</span>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button class="qty-btn" data-idx="${idx}" data-op="minus">−</button>
                        <div style="min-width:26px;text-align:center;">${item.qty || 1}</div>
                        <button class="qty-btn" data-idx="${idx}" data-op="plus">+</button>
                    </div>
                    <div>
                        <button class="remove" data-idx="${idx}">حذف</button>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById("cartCount").innerText = cart.reduce((s,i)=>s+(i.qty||1),0);
    document.getElementById("cartTotal").innerText = total.toFixed(2) + " ر.س";
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCartUI();
}

// delegation for qty & remove
document.getElementById("cartItems")?.addEventListener("click", (e)=>{
    const t = e.target;
    if (t.classList.contains("qty-btn")) {
        const idx = Number(t.dataset.idx);
        const op = t.dataset.op;
        if (!cart[idx]) return;
        if (op === "plus") cart[idx].qty = (cart[idx].qty || 1) + 1;
        if (op === "minus") {
            cart[idx].qty = (cart[idx].qty || 1) - 1;
            if (cart[idx].qty <= 0) cart.splice(idx,1);
        }
        updateCartUI();
    }
    if (t.classList.contains("remove")) {
        const idx = Number(t.dataset.idx);
        removeItem(idx);
    }
});

/* -------------------------
   تطيير المنتج للسلة
-------------------------- */

function flyToCart(imgEl, done) {
    if(!imgEl) { done && done(); return; }
    const cartBtn = document.getElementById("openCart");
    const a = imgEl.getBoundingClientRect();
    const b = cartBtn.getBoundingClientRect();

    const clone = imgEl.cloneNode(true);
    clone.className = "flying-clone";
    clone.style.left = a.left + "px";
    clone.style.top = a.top + "px";
    clone.style.width = a.width + "px";
    clone.style.height = a.height + "px";
    document.body.appendChild(clone);

    const tx = b.left + b.width / 2 - (a.left + a.width / 2);
    const ty = b.top + b.height / 2 - (a.top + a.height / 2);

    requestAnimationFrame(() => {
        clone.style.transform = `translate(${tx}px, ${ty}px) scale(.2)`;
        clone.style.opacity = ".3";
    });

    clone.addEventListener(
        "transitionend",
        () => {
            clone.remove();
            done && done();
        },
        { once: true }
    );
}

/* -------------------------
   إضافة المنتج إلى السلة
-------------------------- */

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart")) {
        const btn = e.target;
        const card = btn.closest(".meal");
        const img = card?.querySelector(".img img");
        const id = btn.dataset.id;
        const name = btn.dataset.name || card.querySelector("h3").innerText;
        const price = Number(btn.dataset.price || 0);

        // إذا المنتج موجود زيادة qty
        const found = cart.find(it => String(it.id) === String(id));
        if (found) {
            found.qty = (found.qty || 1) + 1;
            flyToCart(img, ()=> updateCartUI());
            return;
        }

        const newItem = { id, name, price, qty: 1 };
        flyToCart(img, () => {
            cart.push(newItem);
            updateCartUI();
        });
    }
});

/* -------------------------
   زر إفراغ السلة
-------------------------- */

document.getElementById("clearCart")?.addEventListener("click", () => {
    if (!confirm("هل تريد تفريغ السلة؟")) return;
    cart = [];
    updateCartUI();
});

/* -------------------------
   Checkout -> حفظ الطلب في Supabase
-------------------------- */

document.getElementById("checkout")?.addEventListener("click", async () => {
    try {
        if (!cart || cart.length === 0) {
            return alert("السلة فارغة!");
        }

        // جمع المعلومات
        const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'takeaway';
        const tableNumEl = document.getElementById("tableNumber");
        const tableNumber = tableNumEl && tableNumEl.style.display !== "none" ? (tableNumEl.value || null) : null;

        // تحضير عناصر الطلب (نحفظ id,name,price,qty لكل بند)
        const items = cart.map(it => ({
            id: it.id || null,
            name: it.name || "",
            price: Number(it.price || 0),
            qty: Number(it.qty || 1)
        }));

        const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);

        const payload = {
            items: items,        // Supabase JSONB / json
            total: total,
            type: orderType,
            table_number: tableNumber ? Number(tableNumber) : null,
            status: 'pending'
        };

        // إدخال في Supabase
        const { data, error } = await client
            .from('orders')
            .insert([ payload ])
            .select()
            .single();

        if (error) {
            console.error("خطأ عند حفظ الطلب:", error);
            alert("حصل خطأ أثناء إرسال الطلب — افتح الكونسول لرؤية التفاصيل.");
            return;
        }

        alert("تم إرسال الطلب بنجاح! رقم الطلب: " + (data?.id || "غير متوفر"));
        // تفريغ السلة محلياً
        cart = [];
        updateCartUI();

        // إغلاق السلة UI
        document.getElementById("cartSidebar")?.classList.remove("open");
        document.getElementById("cartOverlay")?.classList.remove("show");
    } catch (err) {
        console.error("checkout error:", err);
        alert("حصل خطأ غير متوقع أثناء إرسال الطلب. افتح الكونسول للمزيد.");
    }
});

/* -------------------------
   شغّل التحميل
-------------------------- */

document.addEventListener("DOMContentLoaded", loadMenu);