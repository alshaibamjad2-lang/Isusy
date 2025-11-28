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

    const imgURL = p.image && p.image.length > 1
    ? p.image
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

/* -------------------------
   فتح و إغلاق السلة
-------------------------- */

// زر فتح السلة
document.getElementById("openCart").addEventListener("click", () => {
    document.getElementById("cartSidebar").classList.add("open");
    document.getElementById("cartOverlay").classList.add("show");
});

// الضغط على الخلفية لإغلاقها
document.getElementById("cartOverlay").addEventListener("click", () => {
    document.getElementById("cartSidebar").classList.remove("open");
    document.getElementById("cartOverlay").classList.remove("show");
});


/* -------------------------
   بيانات السلة
-------------------------- */

let cart = [];

function updateCartUI() {
    const itemsDiv = document.getElementById("cartItems");
    itemsDiv.innerHTML = "";

    let total = 0;

    cart.forEach((item, idx) => {
        total += item.price;

        itemsDiv.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <span>${item.price} ر.س</span>
                </div>

                <div>
                    <button class="remove" onclick="removeItem(${idx})">حذف</button>
                </div>
            </div>
        `;
    });

    document.getElementById("cartCount").innerText = cart.length;
    document.getElementById("cartTotal").innerText = total + " ر.س";
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCartUI();
}



/* -------------------------
   تطيير المنتج للسلة
-------------------------- */

function flyToCart(imgEl) {
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
        () => clone.remove(),
        { once: true }
    );
}



/* -------------------------
   إضافة المنتج
-------------------------- */

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart")) {
        const card = e.target.closest(".meal");
        const img = card.querySelector(".img img");

        const name = card.querySelector("h3").innerText;
        const price = Number(card.querySelector(".price").innerText.replace("ر.س", "").trim());

        flyToCart(img);

        cart.push({ name, price });
        updateCartUI();
    }
});


/* -------------------------
   زر إفراغ السلة
-------------------------- */

document.getElementById("clearCart").addEventListener("click", () => {
    cart = [];
    updateCartUI();
});
//   تشغيل
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", loadMenu);