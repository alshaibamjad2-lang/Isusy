// ---------------------- إعداد Supabase ----------------------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== تحميل الأقسام + المنتجات ====================
let globalCategories = [];
let globalProducts = [];
let currentSection = "all";
let cart = [];

async function loadMenu() {
  try {
    // جلب الأقسام
    const { data: categories, error: catErr } = await client
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (catErr) {
      console.error("خطأ جلب الأقسام:", catErr);
      return;
    }

    // جلب المنتجات
    const { data: products, error: prodErr } = await client
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (prodErr) {
      console.error("خطأ جلب المنتجات:", prodErr);
      return;
    }

    globalCategories = categories;
    globalProducts = products;

    renderSections();
    renderProducts();
  } catch (e) {
    console.error("LoadMenu Error:", e);
  }
}

// ==================== بناء الأقسام ====================
function renderSections() {
  const sec = document.getElementById("sections");
  sec.innerHTML = "";

  // زر الكل أولاً
  sec.innerHTML += `
    <button class="section-btn active" data-section="all">الكل</button>
  `;

  globalCategories.forEach((c) => {
    sec.innerHTML += `
      <button class="section-btn" data-section="${c.name}">${c.name}</button>
    `;
  });

  document.querySelectorAll(".section-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelector(".section-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      currentSection = btn.dataset.section;
      renderProducts();
    };
  });
}

// ==================== بناء المنتجات ====================
function renderProducts() {
  const box = document.getElementById("meals");
  box.innerHTML = "";

  let list =
    currentSection === "all"
      ? globalProducts
      : globalProducts.filter((p) => p.category === currentSection);

  list.forEach((p) => {
    // ---- معالجة الصورة ----
    let imgURL = "";

    if (p.image && p.image.length > 1) {
      imgURL = p.image.startsWith("http")
        ? p.image
        : `${SUPABASE_URL}/storage/v1/object/public/menu-images/${p.image}`;
    } else {
      imgURL = "https://placehold.co/400x300?text=No+Image";
    }

    box.innerHTML += `
      <div class="meal">
        <div class="img">
          <img src="${imgURL}">
        </div>
        <div class="info">
          <h3>${p.name}</h3>
          <p>${p.description ?? ""}</p>
          <div class="price">${p.price} ر.س</div>

          <button class="add-to-cart"
            data-id="${p.id}"
            data-name="${p.name}"
            data-price="${p.price}"
            data-img="${imgURL}">
            إضافة للسلة
          </button>
        </div>
      </div>
    `;
  });
}

// ==================== التطيير إلى السلة ====================
function flyToCart(img, done) {
  const cartBtn = document.getElementById("openCart");
  const a = img.getBoundingClientRect();
  const b = cartBtn.getBoundingClientRect();

  const clone = img.cloneNode(true);
  clone.className = "flying-clone";
  clone.style.left = a.left + "px";
  clone.style.top = a.top + "px";
  clone.style.width = a.width + "px";
  clone.style.height = a.height + "px";
  document.body.appendChild(clone);

  const tx = b.left + b.width / 2 - (a.left + a.width / 2);
  const ty = b.top + b.height / 2 - (a.top + a.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${tx}px,${ty}px) scale(.2)`;
    clone.style.opacity = "0.3";
  });

  clone.addEventListener(
    "transitionend",
    () => {
      clone.remove();
      done();
    },
    { once: true }
  );
}

// ==================== إضافة للسلة ====================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const name = e.target.dataset.name;
    const price = Number(e.target.dataset.price);

    const img = e.target.closest(".meal").querySelector(".img img");

    const exists = cart.find((x) => x.name === name);
    if (exists) {
      exists.qty++;
      updateCartUI();
      return;
    }

    flyToCart(img, () => {
      cart.push({ name, price, qty: 1 });
      updateCartUI();
    });
  }
});

// ==================== تحديث واجهة السلة ====================
function updateCartUI() {
  const itemsDiv = document.getElementById("cartItems");
  const countEl = document.getElementById("cartCount");
  const totalEl = document.getElementById("cartTotal");

  itemsDiv.innerHTML = "";
  countEl.textContent = cart.length;

  let total = 0;

  cart.forEach((item, i) => {
    total += item.price * item.qty;

    itemsDiv.innerHTML += `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong><br>
          <span>${item.price} ر.س × ${item.qty}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; gap:6px;">
            <button class="qty-btn" data-index="${i}" data-op="plus">+</button>
            <button class="qty-btn" data-index="${i}" data-op="minus">−</button>
          </div>
          <div class="remove" data-index="${i}" style="color:#c9a45a; cursor:pointer;">حذف</div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = total.toFixed(2) + " ر.س";
}

// ==================== عمليات زيادة/نقص ====================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("qty-btn")) {
    const i = Number(e.target.dataset.index);
    const op = e.target.dataset.op;

    if (op === "plus") cart[i].qty++;
    else if (op === "minus") {
      cart[i].qty--;
      if (cart[i].qty <= 0) cart.splice(i, 1);
    }

    updateCartUI();
  }

  if (e.target.classList.contains("remove")) {
    const i = Number(e.target.dataset.index);
    cart.splice(i, 1);
    updateCartUI();
  }
});

// ==================== فتح/إغلاق السلة ====================
document.getElementById("openCart").onclick = () => {
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("show");
};

document.getElementById("cartOverlay").onclick = () => {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("show");
};

// ==================== بدأ التشغيل ====================
document.addEventListener("DOMContentLoaded", loadMenu);