// =============================
// إعداد Supabase
// =============================
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// تحميل الأقسام
// =============================
async function loadCategories() {
    const { data } = await db.from("categories").select("*");

    const container = document.getElementById("categories");
    container.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "category-btn active";
    allBtn.textContent = "الكل";
    allBtn.onclick = () => loadProducts();
    container.appendChild(allBtn);

    data.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        btn.textContent = cat.name;
        btn.onclick = () => loadProducts(cat.name);
        container.appendChild(btn);
    });
}

// =============================
// تحميل المنتجات
// =============================
async function loadProducts(category = null) {
    let query = db.from("products").select("*");

    if (category) query.eq("category", category);

    const { data } = await query;

    const container = document.getElementById("products");
    container.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "product";

        card.innerHTML = `
            <img src="${item.image}">
            <h3>${item.name}</h3>
            <p>${item.price} رس</p>
            <button class="add-btn" onclick='addToCart(${JSON.stringify(item)})'>
                إضافة للسلة
            </button>
        `;

        container.appendChild(card);
    });
}

// =============================
// السلة
// =============================
let cart = [];

function addToCart(item) {
    cart.push(item);
    updateCart();
}

function updateCart() {
    document.getElementById("cartCount").textContent = cart.length;

    const list = document.getElementById("cartItems");
    list.innerHTML = "";

    let total = 0;

    cart.forEach((item, i) => {
        total += item.price;

        list.innerHTML += `
            <div class="cart-item">
                <span>${item.name}</span>
                <button class="remove-btn" onclick="removeItem(${i})">حذف</button>
            </div>
        `;
    });

    document.getElementById("cartTotal").textContent = `المجموع: ${total} رس`;
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCart();
}

document.getElementById("clearCart").onclick = () => {
    cart = [];
    updateCart();
};

// =============================
// فتح السلة
// =============================
document.getElementById("cartBtn").onclick = () => {
    document.getElementById("cartPanel").classList.add("active");
};

document.getElementById("cartPanel").onclick = (e) => {
    if (e.target.id === "cartPanel") {
        document.getElementById("cartPanel").classList.remove("active");
    }
};

// =============================
// تغيير العرض
// =============================
let grid2 = true;

document.getElementById("toggleGrid").onclick = () => {
    const container = document.getElementById("products");

    grid2 = !grid2;

    container.style.gridTemplateColumns = grid2 ? "repeat(2, 1fr)" : "repeat(1, 1fr)";
};

// =============================
// تشغيل أولي
// =============================
loadCategories();
loadProducts();