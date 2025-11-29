const SUPABASE_URL = "https://ztwbgqkxmdhpzqhnefty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2JncWt4bWRocHpxaG5lZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTQwMDEsImV4cCI6MjA3OTU5MDAwMX0.6W_V9v5VxQpPfv65Ygc51-m7G1Z8sl8fx1B8bWyA6Xg"; 
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ordersContainer = document.getElementById("orders");

// تحميل الطلبات
async function loadOrders() {
    const { data, error } = await client
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    displayOrders(data);
}

// عرض الطلبات
function displayOrders(orders) {
    ordersContainer.innerHTML = "";

    orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "order-card";

        const itemsHTML = JSON.parse(order.items)
            .map(i => `<div>• ${i.name} × ${i.qty} — ${i.price} رس</div>`)
            .join("");

        card.innerHTML = `
            <div class="order-header">
                <div>طلب رقم: ${order.id}</div>
                <div>${new Date(order.created_at).toLocaleString()}</div>
            </div>

            <div>النوع: <b>${order.type === "table" ? "على طاولة" : "سفري"}</b></div>
            ${order.table_number ? `<div>رقم الطاولة: ${order.table_number}</div>` : ""}
            <div>الحالة: <b>${order.status}</b></div>

            <div class="items-box">${itemsHTML}</div>

            <div style="margin-top:10px;">المجموع: <b>${order.total} رس</b></div>

            <button class="btn prepare" onclick="updateStatus(${order.id}, 'preparing')">قيد التحضير</button>
            <button class="btn done" onclick="updateStatus(${order.id}, 'done')">جاهز</button>
            <button class="btn delete" onclick="deleteOrder(${order.id})">حذف</button>
        `;

        ordersContainer.appendChild(card);
    });
}

// تحديث حالة الطلب
async function updateStatus(id, status) {
    await client.from("orders").update({ status }).eq("id", id);
    loadOrders();
}

// حذف الطلب
async function deleteOrder(id) {
    if (!confirm("هل أنت متأكد من حذف الطلب؟")) return;
    await client.from("orders").delete().eq("id", id);
    loadOrders();
}

// Realtime — وصول طلب جديد بدون ريفريش
client
  .channel("orders-channel")
  .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, payload => {
      loadOrders();
  })
  .subscribe();

// تشغيل أولي
loadOrders();