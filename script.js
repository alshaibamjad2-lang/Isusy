// ---------------- Supabase Client ----------------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------- GLOBAL ----------------
let products = [];
let cart = [];
let addonsCache = {}; // نخزن الإضافات هنا
let currentView = 1;

// ---------------- Load Data ----------------
async function loadProducts() {
  const { data, error } = await db.from("products").select("*");

  if (error) {
    console.log("PRODUCTS ERROR:", error);
    return;
  }

  products = data;
  renderProducts();
  loadAddons();
}

async function loadAddons() {
  const { data } = await db.from("add_ons").select("*");

  addonsCache = {};

  data.forEach((a) => {
    if (!addonsCache[a.product_id]) addonsCache[a.product_id] = [];
    addonsCache[a.product_id].push(a);
  });

  renderProducts(); // إعادة الرسم بعد وصول الإضافات
}

// ---------------- Render Products ----------------
function renderProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  container.innerHTML = "";

  products.forEach((p) => {
    let addonsHTML = "";

    if (addonsCache[p.id]) {
      addonsHTML = `
        <div style="margin-top:10px;color:#c9a45a;font-weight:bold">الإضافات</div>
      `;

      addonsCache[p.id].forEach((a) => {
        addonsHTML += `
          <label style="display:flex;align-items:center;margin-top:6px;color:white">
            <input type="checkbox" data-addon="${p.id}-${a.id}" data-price="${a.price}" style="margin-left:6px">
            ${a.name} (+${a.price} د.ع)
          </label>
        `;
      });
    }

    container.innerHTML += `
      <div class="product-card view-${currentView}">
        <img src="${p.image}" class="product-img">

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">${p.price} ر.س</p>
          
          ${addonsHTML}

          <button class="add-btn" onclick="addToCart(${p.id})">إضافة للسلة</button>
        </div>
      </div>
    `;
  });
}

// ---------------- Add To Cart ----------------
function addToCart(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  let selectedAddons = [];
  const checkboxes = document.querySelectorAll(`[data-addon^="${id}-"]`);

  checkboxes.forEach((c) => {
    if (c.checked) {
      let addonId = Number(c.dataset.addon.split("-")[1]);
      let price = Number(c.dataset.price);

      selectedAddons.push({
        id: addonId,
        price,
      });
    }
  });

  cart.push({
    ...product,
    addons: selectedAddons,
  });

  updateCartUI();
  animateCart();
}

// ---------------- CART UI ----------------
function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  cartCount.innerText = cart.length;
}

// ---------------- OPEN / CLOSE CART ----------------
document.getElementById("cartBtn").onclick = () => {
  document.getElementById("cartBox").classList.add("open");
  renderCartDetails();
};

document.getElementById("closeCart").onclick = () => {
  document.getElementById("cartBox").classList.remove("open");
};

function renderCartDetails() {
  const box = document.getElementById("cartItems");
  box.innerHTML = "";

  cart.forEach((item, i) => {
    let addonsText = "";

    if (item.addons.length > 0) {
      addonsText = "<div class='addons-title'>الإضافات:</div>";
      item.addons.forEach((a) => {
        const ad = addonsCache[item.id].find((x) => x.id === a.id);
        addonsText += `<div class="addon-item">+ ${ad.name} (${ad.price})</div>`;
      });
    }

    box.innerHTML += `
      <div class="cart-row">
        <strong>${item.name}</strong> — ${item.price} ر.س
        ${addonsText}
        <button onclick="removeFromCart(${i})" class="remove">حذف</button>
      </div>
    `;
  });
}

function removeFromCart(i) {
  cart.splice(i, 1);
  updateCartUI();
  renderCartDetails();
}

// ---------------- VIEW MODES ----------------
document.getElementById("changeView").onclick = () => {
  currentView++;
  if (currentView > 8) currentView = 1;
  renderProducts();
};

// ---------------- Animation ----------------
function animateCart() {
  const cartBtn = document.getElementById("cartBtn");
  cartBtn.classList.add("shake");
  setTimeout(() => cartBtn.classList.remove("shake"), 600);
}

// ---------------- INIT ----------------
loadProducts();