document.addEventListener("DOMContentLoaded", ()=>{

// -------- Supabase ----------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let categories = [];
let products = [];
let cart = [];

const mealsDiv = document.getElementById("meals");
const sectionsDiv = document.getElementById("sections");

// -------- Load Menu --------
async function loadMenu() {
  const { data: cats } = await db.from("categories").select("*").order("id");
  const { data: prods } = await db.from("products").select("*").order("id");

  categories = cats || [];
  products = prods || [];

  renderSections();
  renderMeals("all");
}

// -------- Render Sections --------
function renderSections(){
  sectionsDiv.innerHTML = `
    <button class="section-btn active" data-id="all">الكل</button>
  `;

  categories.forEach(c=>{
    sectionsDiv.innerHTML += `
      <button class="section-btn" data-id="${c.id}">${c.name}</button>
    `;
  });

  document.querySelectorAll(".section-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelector(".section-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      renderMeals(btn.dataset.id);
    };
  });
}

// -------- Render meals --------
function renderMeals(section){
  mealsDiv.innerHTML = "";

  let list = section==="all"
    ? products
    : products.filter(p=>p.category_id == section);

  list.forEach(p=>{
    mealsDiv.innerHTML += `
      <div class="meal">
        <div class="img"><img src="${p.image_url}"></div>
        <div class="info">
          <h3>${p.name}</h3>
          <div class="price">${p.price} ر.س</div>
          <button class="add-to-cart" data-id="${p.id}">إضافة للسلة</button>
        </div>
      </div>
    `;
  });
}

// -------- Add to cart --------
document.addEventListener("click", e=>{
  if(e.target.classList.contains("add-to-cart")){
    const id = e.target.dataset.id;
    const product = products.find(p=>p.id == id);

    const exists = cart.find(x=>x.id == id);
    if(exists) exists.qty++;
    else cart.push({ id:id, name:product.name, price:product.price, qty:1 });

    updateCart();
  }
});

// -------- Update Cart --------
function updateCart(){
  const items = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");

  items.innerHTML = "";
  let total = 0;

  cart.forEach((it,i)=>{
    total += it.price * it.qty;

    items.innerHTML += `
      <div class="cart-item">
        <div><b>${it.name}</b><br>${it.price} × ${it.qty}</div>
        <div>
          <button onclick="plus(${i})" class="qty-btn">+</button>
          <button onclick="minus(${i})" class="qty-btn">−</button>
        </div>
      </div>
    `;
  });

  totalEl.textContent = total + " ر.س";
  countEl.textContent = cart.length;
}

window.plus = (i)=>{ cart[i].qty++; updateCart(); }
window.minus = (i)=>{ cart[i].qty--; if(cart[i].qty<=0) cart.splice(i,1); updateCart(); }

// -------- Cart open/close --------
document.getElementById("openCart").onclick = ()=>{
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("show");
};

document.getElementById("cartOverlay").onclick = ()=>{
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("show");
};

// Clear cart
document.getElementById("clearCart").onclick = ()=>{ cart=[]; updateCart(); };

// Start
loadMenu();

});