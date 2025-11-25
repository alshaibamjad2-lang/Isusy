// ---------- Supabase ----------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

//--------------------------------------------------
//   تحميل الأقسام + المنتجات
//--------------------------------------------------

let globalCategories = [];
let globalProducts = [];
let currentSection = "all";

async function loadMenu() {
    // تحميل الأقسام
    let { data: categories } = await client
        .from("categories")
        .select("*")
        .order("id");

    // تحميل المنتجات
    let { data: products } = await client
        .from("products")
        .select("*")
        .order("id");

    globalCategories = categories || [];
    globalProducts = products || [];

    renderSections();
    renderMeals();
}

//--------------------------------------------------
//   الأقسام
//--------------------------------------------------

function renderSections() {
    const secDiv = document.getElementById("sections");
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
    mealsDiv.innerHTML = "";

    let items = currentSection === "all"
        ? globalProducts
        : globalProducts.filter(p => p.category_id == currentSection);

    items.forEach(p => {
        const imgURL = p.image_url && p.image_url.length > 1
            ? p.image_url
            : "https://placehold.co/400x300?text=No+Image";

        mealsDiv.innerHTML += `
            <div class="meal">
                <div class="img">
                    <img src="${imgURL}">
                </div>
                <div class="info">
                    <h3>${p.name}</h3>
                    <div class="price">${p.price} ر.س</div>

                    <button 
                        class="add-to-cart"
                        data-id="${p.id}"
                        data-name="${p.name}"
                        data-price="${p.price}">
                        إضافة للسلة
                    </button>
                </div>
            </div>
        `;
    });

    applyViewClass();
}

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
    document.getElementById("meals").className =
        "meals " + views[viewIndex].cls;

    document.getElementById("viewName").textContent =
        views[viewIndex].label;
}

document.getElementById("toggleView").onclick = () => {
    viewIndex = (viewIndex + 1) % views.length;
    renderMeals();
};

//--------------------------------------------------
//   السلة — FULL B MODE (سلة كاملة مثل الأصل)
//--------------------------------------------------

let cart = [];

document.addEventListener('click', e => {

    // إضافة للسلة
    if (e.target.classList.contains('add-to-cart')) {
        const name = e.target.dataset.name;
        const price = Number(e.target.dataset.price);

        let item = cart.find(c => c.name === name);

        if (item) {
            item.qty++;
        } else {
            cart.push({ name, price, qty: 1 });
        }

        updateCartUI();
    }

    // تعديل الكمية
    if (e.target.classList.contains("qty-btn")) {
        let idx = Number(e.target.dataset.index);
        let item = cart[idx];

        if (e.target.dataset.op === "plus") item.qty++;
        if (e.target.dataset.op === "minus") {
            item.qty--;
            if (item.qty <= 0) cart.splice(idx, 1);
        }

        updateCartUI();
    }

    // حذف
    if (e.target.classList.contains("remove")) {
        let idx = Number(e.target.dataset.index);
        cart.splice(idx, 1);
        updateCartUI();
    }
});

// تحديث واجهة السلة
function updateCartUI() {
    const itemsDiv = document.getElementById("cartItems");
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");

    itemsDiv.innerHTML = "";
    countEl.textContent = cart.length;

    let total = 0;

    cart.forEach((c, i) => {
        total += c.price * c.qty;

        itemsDiv.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${c.name}</strong><br>
                    <span>${c.price} ر.س × ${c.qty}</span>
                </div>
                <div>
                    <button class="qty-btn" data-op="plus" data-index="${i}">+</button>
                    <button class="qty-btn" data-op="minus" data-index="${i}">-</button>

                    <div class="remove" data-index="${i}" style="color:var(--gold);cursor:pointer;">
                        حذف
                    </div>
                </div>
            </div>
        `;
    });

    totalEl.textContent = total.toFixed(2) + " ر.س";
}

//--------------------------------------------------
//   تشغيل
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", loadMenu);