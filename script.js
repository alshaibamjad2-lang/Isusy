/* =========================================================
   إعداد Supabase
========================================================= */
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   تحميل الأقسام + المنتجات
========================================================= */
let globalCategories = [];
let globalProducts = [];

async function loadMenu() {
  try {
    const { data: categories } = await sb
      .from("categories")
      .select("*")
      .order("id");

    const { data: products } = await sb
      .from("products")
      .select("*")
      .order("id");

    globalCategories = categories;
    globalProducts = products;

    renderSections(categories);
    renderProducts(products);
  } catch (err) {
    console.error("خطأ تحميل المنيو:", err);
  }
}


/* =========================================================
   عرض الأقسام
========================================================= */
function renderSections(categories) {
  const sec = document.getElementById("sections");
  sec.innerHTML = "";

  sec.innerHTML += `<button class="section-btn active" data-section="all">الكل</button>`;

  categories.forEach((cat) => {
    sec.innerHTML += `
      <button class="section-btn" data-section="${cat.id}">
        ${cat.name}
      </button>
    `;
  });

  document.querySelectorAll(".section-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelector(".section-btn.active")?.classList.remove("active");
      btn.classList.add("active");

      const id = btn.dataset.section;
      renderProducts(
        id === "all"
          ? globalProducts
          : globalProducts.filter((p) => p.category == id)
      );
    };
  });
}


/* =========================================================
   عرض المنتجات
========================================================= */
function renderProducts(list) {
  const meals = document.getElementById("meals");
  meals.innerHTML = "";

  list.forEach((p) => {
    meals.innerHTML += `
      <div class="meal">
        <div class="img">
          <img src="${p.image || "no-image.png"}">
        </div>

        <div class="info">
          <h3>${p.name}</h3>
          <div class="price">${p.price} ر.س</div>
        </div>

        <button class="add-btn" onclick="addToCart(${p.id})">
          إضافة للسلة
        </button>
      </div>
    `;
  });
}


/* =========================================================
   السلة
========================================================= */
let cart = [];

function addToCart(id) {
  const item = globalProducts.find((p) => p.id === id);
  if (!item) return;

  const exist = cart.find((c) => c.id === id);

  if (exist) exist.qty++;
  else cart.push({ ...item, qty: 1 });

  updateCart();
}

/* فتح السلة */
document.getElementById("openCart").onclick = () => {
  document.getElementById("cartSidebar").classList.add("show");
  document.getElementById("cartOverlay").style.display = "block";
};

/* غلق السلة */
document.getElementById("cartOverlay").onclick = () => {
  document.getElementById("cartSidebar").classList.remove("show");
  document.getElementById("cartOverlay").style.display = "none";
};

/* تحديث السلة */
function updateCart() {
  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");
  const count = document.getElementById("cartCount");

  box.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    total += item.price * item.qty;

    box.innerHTML += `
      <div class="cart-row">
        <div>${item.name}</div>
        <div>${item.price} ر.س</div>
        <div>x${item.qty}</div>
        <button onclick="removeItem(${i})" class="remove-btn">
          حذف
        </button>
      </div>
    `;
  });

  totalBox.textContent = `${total} ر.س`;
  count.textContent = cart.length;
}

function removeItem(i) {
  cart.splice(i, 1);
  updateCart();
}

/* تفريغ السلة */
document.getElementById("clearCart").onclick = () => {
  cart = [];
  updateCart();
};


/* =========================================================
   إتمام الطلب — حفظ الطلب في Supabase
========================================================= */
document.getElementById("completeOrder").onclick = async () => {
  if (cart.length === 0) return alert("السلة فارغة!");

  const orderType = document.querySelector(
    'input[name="orderType"]:checked'
  ).value;

  const tableNumber =
    orderType === "table"
      ? document.getElementById("tableNumber").value
      : null;

  const items = cart.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    qty: i.qty,
  }));

  const payload = {
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    type: orderType,
    table_number: tableNumber,
    status: "pending",
  };

  const { error } = await sb.from("orders").insert([payload]);

  if (error) {
    console.error(error);
    alert("خطأ أثناء إرسال الطلب");
    return;
  }

  alert("تم إرسال الطلب بنجاح ✔");

  cart = [];
  updateCart();

  document.getElementById("cartSidebar").classList.remove("show");
  document.getElementById("cartOverlay").style.display = "none";
};


/* =========================================================
   تغيير وضع العرض
========================================================= */
document.getElementById("toggleView").onclick = () => {
  const meals = document.getElementById("meals");

  if (meals.classList.contains("mode-grid")) {
    meals.classList.remove("mode-grid");
    meals.classList.add("mode-list");
    document.getElementById("viewName").textContent = "عرض طولي";
  } else {
    meals.classList.remove("mode-list");
    meals.classList.add("mode-grid");
    document.getElementById("viewName").textContent = "Grid 2×2";
  }
};


/* ========================================================= */
window.onload = () => {
  loadMenu();
};
/* ========================================================= */