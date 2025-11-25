// ----------- إعداد Supabase -----------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let globalProducts = [];
let globalCategories = [];
let cart = [];


// ----------- تحميل المنيو -----------
async function loadMenu() {

    // تحميل الأقسام
    const { data: categories, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

    // تحميل المنتجات
    const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    globalCategories = categories || [];
    globalProducts  = products || [];

    renderSections(globalCategories);
    renderSelected("all");
}



// ----------- عرض الأقسام -----------
function renderSections(categories) {
    const sec = document.getElementById("sections");
    sec.innerHTML = `<button class="section-btn active" data-sec="all">الكل</button>`;

    categories.forEach(c => {
        sec.innerHTML += `
            <button class="section-btn" data-sec="${c.id}">
                ${c.name}
            </button>
        `;
    });

    document.querySelectorAll(".section-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelector(".section-btn.active")?.classList.remove("active");
            btn.classList.add("active");
            renderSelected(btn.dataset.sec);
        };
    });
}



// ----------- عرض المنتجات حسب القسم -----------
function renderSelected(section) {

    const meals = document.getElementById("meals");
    meals.innerHTML = "";

    let items = section === "all"
        ? globalProducts
        : globalProducts.filter(p => p.category_id == section);

    items.forEach(p => {

        // --- الصورة من العمود الصحيح (image) ---
        const imageURL = p.image ? p.image : "no-image.png";

        meals.innerHTML += `
            <div class="meal">
                <div class="img">
                    <img src="${imageURL}" alt="">
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



// ----------- إضافة للسلة -----------
function addToCart(product) {
    cart.push(product);
    updateCartCount();
}



// ----------- تحديث رقم السلة -----------
function updateCartCount() {
    document.getElementById("cartCount").innerText = cart.length;
}



// ----------- فتح/غلق السلة -----------
document.getElementById("openCart").onclick = () => {
    document.getElementById("cartSidebar").classList.add("show");
};

document.getElementById("cartOverlay").onclick = () => {
    document.getElementById("cartSidebar").classList.remove("show");
};



// ----------- تحميل الصفحة -----------
document.addEventListener("DOMContentLoaded", loadMenu);