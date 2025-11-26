// ---------------- إعداد Supabase ----------------
const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg";

// أنشئ client جديد (لا تستعمل نفس الاسم على اليسار واليمين)
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// بيانات محلية
let globalCategories = [];
let globalProducts = [];
let cart = [];

// ***** مساعدة لعرض الأخطاء في الواجهة (debug) *****
function showDebug(txt, show=true){
  const dbg = document.getElementById('debug');
  dbg.style.display = show ? "block" : "none";
  dbg.textContent = txt;
  console.log("DEBUG:", txt);
}

// ---------------- تحميل البيانات من Supabase ----------------
async function loadMenu(){
  try{
    showDebug("جارٍ الاتصال بـ Supabase...");
    const { data: categories, error: catErr } = await client.from('categories').select('*').order('id', { ascending:true });
    if(catErr) throw catErr;
    const { data: products, error: prodErr } = await client.from('products').select('*').order('id', { ascending:true });
    if(prodErr) throw prodErr;

    globalCategories = categories || [];
    globalProducts = products || [];

    // render
    renderSections();
    renderProducts('all');

    showDebug("تم تحميل البيانات بنجاح.", false);
  } catch(err){
    showDebug("خطأ تحميل البيانات: " + (err.message || JSON.stringify(err)));
  }
}


// ---------------- عرض الأقسام ----------------
function renderSections(){
  const secDiv = document.getElementById('sections');
  secDiv.innerHTML = `<button class="section-btn active" data-sec="all">الكل</button>`;
  globalCategories.forEach(c=>{
    secDiv.innerHTML += `<button class="section-btn" data-sec="${c.id}">${c.name}</button>`;
  });

  secDiv.querySelectorAll('.section-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      secDiv.querySelector('.active')?.classList.remove('active');
      btn.classList.add('active');
      renderProducts(btn.dataset.sec);
    });
  });
}


// ---------------- عرض المنتجات ----------------
function renderProducts(section){
  const meals = document.getElementById('meals');
  meals.innerHTML = '';

  let list = section === 'all' ? globalProducts : globalProducts.filter(p=>String(p.category_id) === String(section));

  if(!list || list.length===0){
    meals.innerHTML = `<div style="padding:40px;color:#ccc;width:100%;text-align:center">لا توجد منتجات لهذا القسم.</div>`;
    return;
  }

  list.forEach((p, idx)=>{
    // استخدم العمود image كما طلبت - إن كان null استخدم صورة placeholder
    const img = p.image && p.image.trim() ? p.image : 'https://placehold.co/800x500?text=No+Image';

    // لاحظ أننا نضع data-idx بحيث نستخدمه لاحقاً في event delegation
    meals.innerHTML += `
      <div class="meal" data-idx="${idx}">
        <div class="img"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.name || '')}"></div>
        <div class="info">
          <h3>${escapeHtml(p.name || '')}</h3>
          <div class="price">${Number(p.price || 0)} ر.س</div>
          <button class="add-btn" data-product-index="${idx}">إضافة للسلة</button>
        </div>
      </div>
    `;
  });
}

// small helper to avoid injecting broken strings
function escapeHtml(s){
  return String(s).replaceAll('"','&quot;').replaceAll("'", '&#39;');
}


// ---------------- حدث إضافة للسلة (event delegation) ----------------
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.add-btn');
  if(btn){
    // btn.dataset.productIndex هو index ضمن القائمة الحالية => نستخدمه لالتقاط المنتج المناسب
    // ولكن لأن globalProducts هو كامل القائمة مرتَّبة، والـ idx المطبوع هو index داخل القائمة المعروضة
    // سنحسب المنتج الحقيقي بتحويل قاعدة المنتج حسب الفصل الحالي (أسهل: نقرأ اسم المنتج من DOM)
    const meal = btn.closest('.meal');
    const name = meal.querySelector('h3').textContent;
    // اعثر على المنتج بالكائن عبر الاسم والسعر (يعتمد على بياناتك أن الأسماء فريدة أو تقارن)
    const found = globalProducts.find(p => p.name === name) || null;
    if(!found){
      alert('لم أتمكن من إيجاد المنتج لإضافته للسلة.');
      return;
    }

    // طيران الصورة
    const imgEl = meal.querySelector('.img img');
    flyToCart(imgEl, () => {
      addToCart(found);
    });
  }
});

// ---------------- إضافة للكارت وتحديث الواجهة ----------------
function addToCart(product){
  // نسخ بسيط للعنصر + حقل qty
  const item = { id: product.id, name: product.name, price: Number(product.price || 0), qty: 1 };
  // إن وُجد نفس المنتج، زد الكمية
  const existing = cart.find(i=>i.id === item.id);
  if(existing){
    existing.qty += 1;
  } else cart.push(item);
  updateCartUI();
}

function updateCartUI(){
  const countEl = document.getElementById('cartCount');
  countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);

  const itemsDiv = document.getElementById('cartItems');
  itemsDiv.innerHTML = '';

  let total = 0;
  cart.forEach((it, idx)=>{
    total += it.price * it.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(it.name)}</strong><br>
        <span style="color:#aaa">${it.price} ر.س × ${it.qty}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div style="display:flex;gap:6px">
          <button class="qty-btn" data-op="plus" data-idx="${idx}">+</button>
          <button class="qty-btn" data-op="minus" data-idx="${idx}">−</button>
        </div>
        <button class="remove-btn" data-idx="${idx}">حذف</button>
      </div>
    `;
    itemsDiv.appendChild(row);
  });

  document.getElementById('cartTotal').textContent = total.toFixed(2) + ' ر.س';
}


// ---------------- استماع لأزرار الكمية والحذف ----------------
document.getElementById('cartItems').addEventListener('click', (e)=>{
  const qBtn = e.target.closest('.qty-btn');
  if(qBtn){
    const idx = Number(qBtn.dataset.idx);
    const op = qBtn.dataset.op;
    if(op === 'plus') cart[idx].qty++;
    if(op === 'minus'){ cart[idx].qty--; if(cart[idx].qty <=0) cart.splice(idx,1); }
    updateCartUI();
    return;
  }
  const rem = e.target.closest('.remove-btn');
  if(rem){
    const idx = Number(rem.dataset.idx);
    if(confirm('هل تود حذف هذا المنتج من السلة؟')) {
      cart.splice(idx,1);
      updateCartUI();
    }
  }
});


// ---------------- فتح/غلق السلة ----------------
document.getElementById('openCart').addEventListener('click', ()=>{
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').style.display = 'block';
});

document.getElementById('cartOverlay').addEventListener('click', ()=>{
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').style.display = 'none';
});

// تفريغ السلة
document.getElementById('clearCart').addEventListener('click', ()=>{
  if(!confirm('تفريغ السلة؟')) return;
  cart = [];
  updateCartUI();
});


// ---------------- طيران العنصر إلى السلة (animation) ----------------
function flyToCart(imgEl, done){
  if(!imgEl) { done(); return; }

  const cartBtn = document.getElementById('openCart');
  const a = imgEl.getBoundingClientRect();
  const b = cartBtn.getBoundingClientRect();

  const clone = imgEl.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = a.left + 'px';
  clone.style.top = a.top + 'px';
  clone.style.width = a.width + 'px';
  clone.style.height = a.height + 'px';
  clone.style.zIndex = 2000;
  clone.style.transition = 'transform .6s ease-in-out, opacity .6s';
  document.body.appendChild(clone);

  const tx = b.left + b.width/2 - (a.left + a.width/2);
  const ty = b.top + b.height/2 - (a.top + a.height/2);

  requestAnimationFrame(()=>{
    clone.style.transform = `translate(${tx}px,${ty}px) scale(.2)`;
    clone.style.opacity = '0.6';
  });

  clone.addEventListener('transitionend', ()=>{
    clone.remove();
    done();
  }, { once:true });

  // safety fallback
  setTimeout(()=>{ if(document.body.contains(clone)) { clone.remove(); done(); } }, 900);
}


// ---------------- وضع العرض (تبديل) - مثال بسيط ----------------
const views = ['mode-grid', 'mode-grid3','mode-row'];
let viewIndex = 0;
document.getElementById('toggleView').addEventListener('click', ()=>{
  viewIndex = (viewIndex+1) % views.length;
  const meals = document.getElementById('meals');
  meals.className = 'meals ' + views[viewIndex];
  document.getElementById('viewName').textContent = ['Grid 2×2','Grid 3×3','صف كامل'][viewIndex];
});


// ---------------- init ----------------
document.addEventListener('DOMContentLoaded', ()=>{
  loadMenu();
});