// ---- Supabase ----
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let categories = [];
let products = [];
let cart = [];

const mealsDiv = document.getElementById("meals");
const sectionsDiv = document.getElementById("sections");

// ========== LOAD MENU ==========
async function loadMenu() {
  const { data: cats } = await db.from("categories").select("*").order("id");
  const { data: prods } = await db.from("products").select("*").order("id");

  categories = cats;
  products = prods;

  renderSections();
  renderMeals("all");
}

// Render sections
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
      document.querySelector(".active")?.classList.remove("active");
      btn.classList.add("active");
      renderMeals(btn.dataset.id);
    };
  });
}

// Render meals
function renderMeals(section){
  mealsDiv.innerHTML = "";

  let list = section === "all"
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

document.addEventListener("click", e=>{
  if(e.target.classList.contains("add-to-cart")){
    const id = e.target.dataset.id;
    const product = products.find(p=>p.id == id);

    flyToCart(e.target.closest(".meal").querySelector("img"));

    const existing = cart.find(x=>x.id==id);
    if(existing) existing.qty++;
    else cart.push({id: id, name:product.name, price:product.price, qty:1});

    updateCart();
  }
});

// --- Flying Animation ---
function flyToCart(img){
  const rect = img.getBoundingClientRect();
  const cartBtn = document.getElementById("openCart").getBoundingClientRect();

  let clone = img.cloneNode();
  clone.className = "flying-img";
  clone.style.left = rect.left+"px";
  clone.style.top = rect.top+"px";

  document.body.appendChild(clone);

  setTimeout(()=>{
    clone.style.transform = `translate(${cartBtn.left-rect.left}px, ${cartBtn.top-rect.top}px) scale(.1)`;
    clone.style.opacity = "0";
  },10);

  setTimeout(()=> clone.remove(), 600);
}

// CART UI
function updateCart(){
  const items = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");

  items.innerHTML = "";
  let total = 0;

  cart.forEach((it, i)=>{
    total += it.price * it.qty;

    items.innerHTML += `
      <div class="cart-item">
        <div>
          <strong>${it.name}</strong><br>
          ${it.price} ر.س × ${it.qty}
        </div>
        <div>
          <button class="qty-btn" onclick="plus(${i})">+</button>
          <button class="qty-btn" onclick="minus(${i})">−</button>
          <div class="remove" onclick="removeItem(${i})">حذف</div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = total.toFixed(2)+" ر.س";
  countEl.textContent = cart.length;
}

function plus(i){ cart[i].qty++; updateCart(); }
function minus(i){
  cart[i].qty--;
  if(cart[i].qty<=0) cart.splice(i,1);
  updateCart();
}
function removeItem(i){ cart.splice(i,1); updateCart(); }

// CART open/close
document.getElementById("openCart").onclick = ()=>{
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("show");
};
document.getElementById("cartOverlay").onclick = ()=>{
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("show");
};

// Clear
document.getElementById("clearCart").onclick = ()=>{
  cart=[];
  updateCart();
};

// Order type
document.querySelectorAll("input[name='orderType']").forEach(r=>{
  r.onchange = ()=>{
    document.getElementById("tableNumber").style.display =
      r.value==="table" ? "block" : "none";
  };
});

// Start
loadMenu();