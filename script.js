/* صورة افتراضية لو لم توجد صورة للمنتج */
const DEFAULT_IMAGE = "https://via.placeholder.com/800x600?text=No+Image";

/* جلب البيانات من localStorage إن وُجدت */
let storedMenu = JSON.parse(localStorage.getItem("menuData"));

let data = storedMenu || {
  appetizers:[
    {name:"بروشيتا", price:12, desc:"خبز محمص مع طماطم مشكلة", img:""},
    {name:"سلطة سيزر", price:10, desc:"خس رومين، صلصة سيزر، بارميزان", img:""},
    {name:"فطر محشي", price:14, desc:"جبنة وأعشاب", img:""},
    {name:"كرات الجبن", price:11, desc:"جبنة ذائبة ومقرمشة", img:""},
  ],
  main:[
    {name:"سلمون مشوي", price:25, desc:"ليمون وثوم وخضار", img:""},
    {name:"فيليه مينيون", price:30, desc:"لحم بقر فاخر", img:""},
    {name:"باستا بريمافيرا", price:20, desc:"خضار مشكّلة", img:""},
    {name:"دجاج محشي", price:22, desc:"تتبيلة خاصة", img:""},
  ],
  desserts:[
    {name:"تيراميسو", price:9, desc:"ماسكربون وإسبرسو", img:""},
    {name:"تشيز كيك", price:9, desc:"مربى توت", img:""},
    {name:"لافا كيك", price:11, desc:"شوكولاتة سايحة", img:""},
  ],
  drinks:[
    {name:"قهوة أمريكية", price:5, desc:"طازجة", img:""},
    {name:"شاي", price:4, desc:"نعناع طيب", img:""},
    {name:"عصير برتقال", price:8, desc:"طازج", img:""},
  ]
};

/* خزّن النسخة الافتراضية أول مرة إذا لم توجد بيانات مخزنة */
if(!storedMenu){
  localStorage.setItem("menuData", JSON.stringify(data));
}

/* VIEWS array كما في المشروع الأصلي */
const views = [
  { cls:'mode-grid', label:'Grid 2×2' },
  { cls:'mode-grid3', label:'Grid 3×3' },
  { cls:'mode-row', label:'صف كامل' },
  { cls:'mode-slider', label:'Slider أفقي' },
  { cls:'mode-circle', label:'Circle Cards' },
  { cls:'mode-mag', label:'Magazine' },
  { cls:'mode-luxury', label:'Luxury Cards' },
  { cls:'mode-crystal', label:'Crystal Cards' }
];

let viewIndex = 0;
let currentSection = null;
let cart = [];

const mealsDiv = document.getElementById('meals');
const viewNameEl = document.getElementById('viewName');

/* renderSections — يولّد أزرار الأقسام بناءً على مفاتيح data */
function renderSections(){
  const secDiv = document.getElementById("sections");
  secDiv.innerHTML = "";

  const keys = Object.keys(data);
  if(keys.length === 0){
    secDiv.innerHTML = '<div style="padding:12px;color:var(--muted)">لا توجد أقسام. افتح صفحة الادمن لإضافة الأقسام.</div>';
    return;
  }

  keys.forEach((sec, index)=>{
    const btn = document.createElement("button");
    btn.className = "section-btn" + (index===0 ? " active" : "");
    btn.textContent = sec;
    btn.dataset.section = sec;

    btn.addEventListener('click', ()=>{
      document.querySelector('.section-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      currentSection = sec;
      renderMeals();
    });

    secDiv.appendChild(btn);
  });

  currentSection = keys[0];
}

/* renderMeals — يعرض منتجات القسم الحالي */
function renderMeals(){
  const arr = data[currentSection] || [];
  mealsDiv.innerHTML = '';

  arr.forEach((m,i)=>{
    const card = document.createElement('div');
    card.className = 'meal';
    if(views[viewIndex].cls==='mode-mag' && i%4===0) card.classList.add('big');

    const imageSrc = m.img && m.img.length ? m.img : DEFAULT_IMAGE;

    card.innerHTML = `
      <div class="img"><img src="${imageSourceFix(imageSrc)}" alt="${escapeHtml(m.name)}"></div>
      <div class="info">
        <h3>${escapeHtml(m.name)}</h3>
        <p>${escapeHtml(m.desc)}</p>
        <div class="price">${Number(m.price).toFixed(2)} ر.س</div>
        <button class="add-to-cart" data-name="${escapeHtml(m.name)}" data-price="${Number(m.price)}">إضافة للسلة</button>
      </div>
    `;
    mealsDiv.appendChild(card);
  });

  applyViewClass();
}

/* simple escaping to avoid breaking HTML if user يدخل علامات */
function escapeHtml(text){
  if(!text && text!==0) return "";
  return String(text).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
}

/* image source helper: if stored as data-url leave it, else return as-is */
function imageSourceFix(src){
  if(!src) return DEFAULT_IMAGE;
  return src;
}

function applyViewClass(){
  mealsDiv.className = 'meals ' + views[viewIndex].cls;
  viewNameEl.textContent = views[viewIndex].label;
}

document.getElementById('toggleView').addEventListener('click', ()=>{
  viewIndex = (viewIndex + 1) % views.length;
  renderMeals();
});

/* FLY ANIMATION */
function flyToCart(imgEl, done){
  const cartBtn = document.getElementById('openCart');
  const a = imgEl.getBoundingClientRect();
  const b = cartBtn.getBoundingClientRect();

  const clone = imgEl.cloneNode(true);
  clone.className = "flying-clone";
  clone.style.left = a.left+"px";
  clone.style.top = a.top+"px";
  clone.style.width = a.width+"px";
  clone.style.height = a.height+"px";
  document.body.appendChild(clone);

  const tx = b.left + b.width/2 - (a.left + a.width/2);
  const ty = b.top + b.height/2 - (a.top + a.height/2);

  requestAnimationFrame(()=>{
    clone.style.transform = `translate(${tx}px,${ty}px) scale(.2)`;
    clone.style.opacity = ".5";
  });

  clone.addEventListener('transitionend', ()=>{
    clone.remove();
    done();
  }, {once:true});
}

/* ADD / REMOVE / QTY */
document.addEventListener('click', (e)=>{

  /* ADD TO CART */
  if(e.target.classList.contains('add-to-cart')){
    const name = e.target.dataset.name;
    const price = Number(e.target.dataset.price);
    const card = e.target.closest('.meal');
    const imgEl = card.querySelector('.img img');

    const found = cart.find(it=>it.name===name);
    if(found){
      found.qty++;
      updateCartUI();
      return;
    }

    flyToCart(imgEl, ()=>{
      cart.push({name, price, qty:1});
      updateCartUI();
    });
  }

  /* QTY BUTTONS */
  if(e.target.classList.contains('qty-btn')){
    const idx = Number(e.target.dataset.index);
    const op = e.target.dataset.op;

    if(op==="plus") cart[idx].qty++;
    if(op==="minus"){
      cart[idx].qty--;
      if(cart[idx].qty <= 0){
        cart.splice(idx,1);
      }
    }
    updateCartUI();
  }

  /* DELETE ITEM */
  if(e.target.classList.contains('remove')){
    const idx = Number(e.target.dataset.index);
    cart.splice(idx,1);
    updateCartUI();
  }
});

/* CART UI UPDATE */
function updateCartUI(){
  const itemsDiv = document.getElementById('cartItems');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');

  itemsDiv.innerHTML='';
  countEl.textContent = cart.length;

  let total = 0;

  cart.forEach((item,idx)=>{
    total += item.price * item.qty;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.name)}</strong><br>
        <span>${Number(item.price).toFixed(2)} ر.س × ${item.qty}</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; gap:6px;">
          <button class="qty-btn" data-op="plus" data-index="${idx}">+</button>
          <button class="qty-btn" data-op="minus" data-index="${idx}">−</button>
        </div>
        <div class="remove" data-index="${idx}" style="color:var(--gold); cursor:pointer;">حذف</div>
      </div>
    `;
    itemsDiv.appendChild(row);
  });

  totalEl.textContent = total.toFixed(2)+" ر.س";
}

/* OPEN & CLOSE CART */
document.getElementById('openCart').addEventListener('click', ()=>{
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('show');
});
document.getElementById('cartOverlay').addEventListener('click', ()=>{
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('show');
});

/* CLEAR CART */
document.getElementById('clearCart').addEventListener('click', ()=>{
  cart=[];
  updateCartUI();
});

/* CHECKOUT WITH ORDER TYPE */
document.getElementById('checkout').addEventListener('click', ()=>{
  if(cart.length===0) return alert("السلة فارغة!");

  const orderType = document.querySelector('input[name="orderType"]:checked').value;

  if(orderType === "table"){
    const tableNum = document.getElementById('tableNumber').value.trim();
    if(tableNum === ""){
      alert("الرجاء إدخال رقم الطاولة");
      return;
    }
    alert("تم إتمام طلب طاولة رقم " + tableNum + " بنجاح 🎉");
  } else {
    alert("تم إتمام طلب سفري بنجاح 🎉");
  }

  cart=[];
  updateCartUI();
});

/* SHOW/HIDE table number */
document.querySelectorAll('input[name="orderType"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const isTable = document.querySelector('input[name="orderType"]:checked').value === "table";
    document.getElementById('tableNumberWrap').style.display = isTable ? "block" : "none";
  });
});

/* INIT rendering sections + meals */
renderSections();
renderMeals();
updateCartUI();