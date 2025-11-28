// ========== Supabase ==========
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== CART ==========
let cart = [];

function openCart() {
    document.getElementById("cartSidebar").classList.add("open");
    document.getElementById("cartOverlay").classList.add("show");
}

function closeCart() {
    document.getElementById("cartSidebar").classList.remove("open");
    document.getElementById("cartOverlay").classList.remove("show");
}

document.getElementById("openCart").onclick = openCart;
document.getElementById("cartOverlay").onclick = closeCart;

function updateCartDisplay() {
    let cartItems = document.getElementById("cartItems");
    let total = 0;

    cartItems.innerHTML = "";

    cart.forEach((item, index) => {
        total += item.price * item.qty;

        cartItems.innerHTML += `
            <div class="cart-item">
                <div>${item.name}</div>
                <div>
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    ${item.qty}
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <div class="remove" onclick="removeItem(${index})">حذف</div>
            </div>
        `;
    });

    document.getElementById("cartTotal").innerText = total + " ر.س";
    document.getElementById("cartCount").innerText = cart.length;
}

function changeQty(i, amount) {
    cart[i].qty += amount;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartDisplay();
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCartDisplay();
}

document.getElementById("clearCart").onclick = () => {
    cart = [];
    updateCartDisplay();
};

// ========== LOAD MENU ==========
async function loadMenu() {

    // جلب الأقسام
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

    // جلب المنتجات
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    renderSections(categories);
    renderProducts(products);
}

// ========== Render Sections ==========
function renderSections(categories) {
    const sec = document.getElementById("sections");
    sec.innerHTML = `<button class="section-btn active" data-id="all">الكل</button>`;

    categories.forEach(cat => {
        sec.innerHTML += `
            <button class="section-btn" data-id="${cat.id}">${cat.name}</button>
        `;
    });

    document.querySelectorAll(".section-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelector(".section-btn.active")?.classList.remove("active");
            btn.classList.add("active");
            filterProducts(btn.dataset.id);
        };
    });
}

// ========== Render Products ==========
let allProducts = [];

function renderProducts(products) {
    allProducts = products;
    filterProducts("all");
}

function filterProducts(catID) {
    const container = document.getElementById("meals");
    container.innerHTML = "";

    let list = catID === "all" 
        ? allProducts 
        : allProducts.filter(p => p.category == catID);

    list.forEach(p => {
        container.innerHTML += `
            <div class="meal">
            
                <div class="img">
                    <img src="${p.image ? p.image : 'https://via.placeholder.com/400?text=No+Image'}">
                </div>

                <div class="info">
                    <h3>${p.name}</h3>
                    <div class="price">${p.price} ر.س</div>

                    <button class="add-to-cart" onclick='addToCart(${p.id})'>إضافة للسلة</button>
                </div>

            </div>
        `;
    });
}

function addToCart(id) {
    const product = allProducts.find(p => p.id === id);

    let existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    updateCartDisplay();
}

// Load on start
document.addEventListener("DOMContentLoaded", loadMenu);