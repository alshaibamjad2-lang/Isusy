// ---------- Supabase (client) ----------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// global state
let products = [];
let categories = [];
let optionsMap = {}; // product_id -> [add_on objects]
let cart = [];

/* ---------- Helpers ---------- */
function el(id){ return document.getElementById(id); }
function esc(s){ return String(s||"").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---------- Load data ---------- */
async function loadAll(){
  // categories
  const { data: cats } = await client.from("categories").select("*").order("id",{ascending:true});
  categories = cats || [];

  // products
  const { data: prods } = await client.from("products").select("*").order("id",{ascending:true});
  products = prods || [];

  // options (add_ons)
  const prodIds = products.map(p=>p.id);
  if(prodIds.length>0){
    const { data: opts } = await client.from("add_ons").select("*").in("product_id", prodIds);
    optionsMap = {};
    (opts||[]).forEach(o=>{
      if(!optionsMap[o.product_id]) optionsMap[o.product_id]=[];
      optionsMap[o.product_id].push(o);
    });
  } else {
    optionsMap = {};
  }

  renderSections();
  renderMeals();
}

/* ---------- Sections rendering (includes 'All') ---------- */
function renderSections(){
  const secDiv = el("sections");
  secDiv.innerHTML = `<button class="section-btn active" data-section="all">الكل</button>`;
  categories.forEach(c=>{
    secDiv.innerHTML += `<button class="section-btn" data-section="${c.id}">${esc(c.name)}</button>`;
  });
  document.querySelectorAll(".section-btn").forEach(btn=>{
    btn.onclick = () => {
      document.querySelector(".section-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      const sec = btn.dataset.section;
      renderMeals(sec);
    };
  });
}

/* ---------- Build options HTML for a product ---------- */
function buildOptionsHtml(productId){
  const opts = optionsMap[productId] || [];
  if(opts.length===0) return '';
  let html = `<div style="margin-top:8px;border-top:1px dashed rgba(255,255,255,0.04);padding-top:8px;">`;
  html += `<div style="font-weight:700;color:var(--gold);margin-bottom:6px;">الإضافات</div>`;
  opts.forEach(o=>{
    html += `<label style="display:block;font-size:13px;margin:6px 0;">
      <input type="checkbox" class="addon-checkbox" data-id="${o.id}" data-product="${o.product_id}" data-name="${esc(o.name)}" data-price="${o.price}">
      ${esc(o.name)} (+${o.price} د.ع)
    </label>`;
  });
  html += `</div>`;
  return html;
}

/* ---------- Render products (meals) ---------- */
function renderMeals(filterSection="all"){
  const mealsDiv = el("meals");
  mealsDiv.innerHTML = "";
  let list = products.slice();
  if(filterSection && filterSection !== "all"){
    list = list.filter(p => String(p.category_id) === String(filterSection));
  }
  if(list.length === 0){ mealsDiv.innerHTML = "<div style='color:#999;padding:18px;'>لا توجد منتجات لعرضها.</div>"; return; }
  list.forEach(p=>{
    const img = p.image && p.image.length ? p.image : "https://placehold.co/800x520?text=No+Image";
    mealsDiv.innerHTML += `
      <div class="meal" data-id="${p.id}">
        <div class="img"><img src="${img}" style="width:100%;height:160px;object-fit:cover"></div>
        <div class="info">
          <h3>${esc(p.name)}</h3>
          <div class="price">${p.price} ر.س</div>
          ${ buildOptionsHtml(p.id) }
          <button class="add-to-cart" data-id="${p.id}" data-name="${esc(p.name)}" data-price="${p.price}">إضافة للسلة</button>
        </div>
      </div>
    `;
  });
  applyViewClass(); // reuse your CSS view toggler if exists
}

/* ---------- Cart handling ---------- */
function updateCartUI(){
  const itemsDiv = el("cartItems");
  itemsDiv.innerHTML = "";
  let total = 0;
  cart.forEach((it,idx)=>{
    const addonsHtml = (it.addons && it.addons.length) ? `<div style="font-size:13px;color:#ccc;margin-top:6px;">${it.addons.map(a=>`${esc(a.name)} (+${a.price})`).join(", ")}</div>` : "";
    const lineTotal = (it.total_price || it.price) * (it.qty || 1);
    total += lineTotal;
    itemsDiv.innerHTML += `
      <div class="cart-item">
        <div>
          <strong>${esc(it.name)}</strong><br>
          <span>${lineTotal.toFixed(2)} ر.س</span>
          ${addonsHtml}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;gap:6px;">
            <button class="qty-btn" data-idx="${idx}" data-op="plus">+</button>
            <button class="qty-btn" data-idx="${idx}" data-op="minus">−</button>
          </div>
          <div class="remove" data-idx="${idx}" style="color:var(--gold);cursor:pointer;">حذف</div>
        </div>
      </div>
    `;
  });
  el("cartCount").textContent = cart.reduce((s,i)=>s+(i.qty||1),0);
  el("cartTotal").textContent = total.toFixed(2) + " ر.س";
}

/* delegation for cart buttons */
document.addEventListener("click", (e)=>{
  if(e.target.classList.contains("qty-btn")){
    const idx = Number(e.target.dataset.idx);
    const op = e.target.dataset.op;
    if(op==="plus") cart[idx].qty = (cart[idx].qty||1) + 1;
    if(op==="minus"){ cart[idx].qty = (cart[idx].qty||1) - 1; if(cart[idx].qty<=0) cart.splice(idx,1); }
    updateCartUI();
  }
  if(e.target.classList.contains("remove")){
    const idx = Number(e.target.dataset.idx);
    cart.splice(idx,1);
    updateCartUI();
  }
});

/* ---------- Add to cart with addons ---------- */
document.addEventListener("click",(e)=>{
  if(e.target.classList.contains("add-to-cart")){
    const btn = e.target;
    const card = btn.closest(".meal");
    const productId = Number(btn.dataset.id);
    const basePrice = Number(btn.dataset.price);
    const name = btn.dataset.name;

    // collect selected addons *inside this card*
    const selected = [];
    const checkboxes = card.querySelectorAll(".addon-checkbox");
    checkboxes.forEach(ch=>{
      if(ch.checked){
        selected.push({
          id: Number(ch.dataset.id),
          name: ch.dataset.name,
          price: Number(ch.dataset.price)
        });
      }
    });

    const extrasTotal = selected.reduce((s,a)=> s + Number(a.price), 0);
    const finalPrice = basePrice + extrasTotal;

    // if same product + same chosen addons exists -> increase qty, else push new
    const foundIdx = cart.findIndex(it => {
      if(String(it.id) !== String(productId)) return false;
      // compare addons by ids
      const aids1 = (it.addons || []).map(x=>x.id).sort().join(",");
      const aids2 = selected.map(x=>x.id).sort().join(",");
      return aids1 === aids2;
    });

    if(foundIdx >= 0){
      cart[foundIdx].qty = (cart[foundIdx].qty||1) + 1;
    } else {
      cart.push({
        id: productId,
        name,
        price: basePrice,
        qty: 1,
        addons: selected,
        total_price: finalPrice
      });
    }

    // animation: try to fly image
    const img = card.querySelector(".img img");
    flyToCart(img, ()=>{
      updateCartUI();
    });
  }
});

/* fly animation (same as before) */
function flyToCart(imgEl, done){
  if(!imgEl){ done && done(); return; }
  const cartBtn = el("openCart");
  const a = imgEl.getBoundingClientRect();
  const b = cartBtn.getBoundingClientRect();
  const clone = imgEl.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = a.left + "px";
  clone.style.top = a.top + "px";
  clone.style.width = a.width + "px";
  clone.style.height = a.height + "px";
  clone.style.transition = "transform .45s ease-out, opacity .45s ease-out";
  document.body.appendChild(clone);
  const tx = b.left + b.width/2 - (a.left + a.width/2);
  const ty = b.top + b.height/2 - (a.top + a.height/2);
  requestAnimationFrame(()=> {
    clone.style.transform = `translate(${tx}px,${ty}px) scale(.2)`;
    clone.style.opacity = "0.5";
  });
  clone.addEventListener("transitionend", ()=>{
    clone.remove();
    done && done();
  }, { once:true });
}

/* ---------- Checkout: save order with addons ---------- */
document.getElementById("checkout")?.addEventListener("click", async ()=>{
  if(!cart || cart.length===0) return alert("السلة فارغة!");
  const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'takeaway';
  const tableNumEl = document.getElementById('tableNumber');
  const tableNumber = tableNumEl && tableNumEl.style.display !== "none" ? (tableNumEl.value || null) : null;

  const itemsPayload = cart.map(it => ({
    product_id: it.id,
    name: it.name,
    price: it.price,
    qty: it.qty || 1,
    addons: it.addons || [],
    total_price: it.total_price || (it.price * (it.qty||1))
  }));

  const total = itemsPayload.reduce((s,i)=> s + (i.total_price * i.qty), 0);

  try{
    const { data, error } = await client.from('orders').insert([{
      items: JSON.stringify(itemsPayload),
      total,
      type: orderType,
      table_number: tableNumber ? Number(tableNumber) : null,
      status: 'pending'
    }]).select().single();

    if(error){ console.error("order save error", error); return alert("خطأ أثناء حفظ الطلب — افتح الكونسول"); }

    alert("تم إرسال الطلب بنجاح! رقم الطلب: " + (data?.id || "—"));
    cart = [];
    updateCartUI();
    // close sidebar
    document.getElementById("cartSidebar")?.classList.remove("open");
    document.getElementById("cartOverlay")?.classList.remove("show");
  }catch(err){
    console.error(err);
    alert("خطأ غير متوقع أثناء إرسال الطلب");
  }
});

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  loadAll();
  updateCartUI();
});