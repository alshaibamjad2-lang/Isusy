// ————— إعداد Supabase —————
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let categories = [];
let products = [];
let cart = [];

// ————— تحميل الأقسام والمنتجات —————
async function loadMenu() {

  const { data: cats } = await db.from("categories").select("*").order("id");
  const { data: prods } = await db.from("products").select("*").order("id");

  categories = cats || [];
  products = prods || [];

  renderSections();
  renderProducts("all");
}


// ————— عرض الأقسام —————
function renderSections() {
  const sec = document.getElementById("sections");
  sec.innerHTML = `<button class="section-btn active" data-id="all">الكل</button>`;

  categories.forEach(c => {
    sec.innerHTML += `
      <button class="section-btn" data-id="${c.id}">${c.name}</button>
    `;
  });

  document.querySelectorAll(".section-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelector(".section-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      renderProducts(btn.dataset.id);
    };
  });
}


// ————— عرض المنتجات —————
function renderProducts(catID) {
  const meals = document.getElementById("meals");
  meals.innerHTML = "";

  let list = catID === "all"
    ? products
    : products.filter(p => p.category_id == catID);

  list.forEach(p => {
    meals.innerHTML += `
      <div class="meal">
        <div class="img">
          <img src="${p.image || "https://placehold.co/600x400"}">
        </div>

        <div class="info">
          <h3>${p.name}</h3>
          <div class="price">${p.price} ر.س</div>
          <button class="add-btn" onclick='addToCart(${JSON.stringify(p)})'>
            إضافة للسلة
          </button>
        </div>
      </div>
    `;
  });
}


// ————— إضافة للسلة —————
function addToCart(p) {
  cart.push(p);
  updateCart();
}

// ————— تحديث السلة —————
function updateCart() {
  document.getElementById("cartCount").innerText = cart.length;

  let itemsDiv = document.getElementById("cartItems");
  itemsDiv.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price;
    itemsDiv.innerHTML += `
      <div style="padding:10px;border-bottom:1px solid #333;">
        <strong>${item.name}</strong> — ${item.price} ر.س
      </div>
    `;
  });

  document.getElementById("cartTotal").innerText = total + " ر.س";
}


// ————— فتح السلة —————
document.getElementById("openCart").onclick = () => {
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").style.display = "block";
};

// ————— إغلاق السلة —————
document.getElementById("cartOverlay").onclick = () => {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").style.display = "none";
};

// ————— تفريغ السلة —————
document.getElementById("clearCart").onclick = () => {
  cart = [];
  updateCart();
};


// ————— تشغيل عند التحميل —————
loadMenu();