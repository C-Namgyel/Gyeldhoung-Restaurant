const domain = "gyeldhoung.com";
// function api(path, domain) {
//     return `http://localhost:8080${path}`;
// }
function api(path) {
  return `https://api.${domain}${path}`;
}

const ordersList = document.getElementById("ordersList");
const modal = document.getElementById("modal");
const orderDetails = document.getElementById("orderDetails");
const markDoneBtn = document.getElementById("markDoneBtn");
const closeModal = document.getElementById("closeModal");

let currentOrderId = null;

const imageSrc = "https://api.gyeldhoung.com";
// const imageSrc = "http://localhost:8080";

// SUBSCRIPTION
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
async function registerPush(VAPID_PUBLIC_KEY) {
    const registration = await navigator.serviceWorker.ready;
    const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key
    });
    fetch(api("/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
    }).then(res => res.json())
    .then(res => {
        if (res.success) {
            console.log("Subscribed:", subscription);
            alert("Subscribed:");
            document.getElementById("subscribe").hidden = true;
            document.getElementById("unsubscribe").hidden = false;
        } else {
            alert("Failed")
        }
    })
}
async function initPush() {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.log("User denied notifications");
        alert("User denied notifications");
        return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
        console.log("Already subscribed");
        alert("Already subscribed");
        return;
    }
    const res = await fetch(api("/vapidPublicKey"));
    const VAPID_PUBLIC_KEY = await res.text();
    registerPush(VAPID_PUBLIC_KEY);
}
async function unsubscribePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await subscription.unsubscribe();

    await fetch(api("/unsubscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            endpoint: subscription.endpoint
        })
    });

    console.log("✅ Fully unsubscribed");
    alert("✅ Fully unsubscribed");

    document.getElementById("subscribe").hidden = false;
    document.getElementById("unsubscribe").hidden = true;
}
async function checkSubscriptionStatus() {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        console.log("✅ Already subscribed");
        console.log(subscription);
        document.getElementById("subscribe").hidden = true;
        document.getElementById("unsubscribe").hidden = false;

        // you can disable "Enable Notifications" button here
        return true;
    } else {
        console.log("❌ Not subscribed");
        document.getElementById("subscribe").hidden = false;
        document.getElementById("unsubscribe").hidden = true;
        return false;
    }
}
window.onload = () => {
    checkSubscriptionStatus();
}

// FETCH ORDERS
async function loadOrders() {
    fetch(api("/api/order/get")).then(res => res.json()).then(data => {
        if (data.success) {
            ordersList.innerHTML = "";
            if (data.data.length == 0) {
                ordersList.innerHTML = "No orders yet";
                return;
            }
            data.data.forEach(order => {
                const div = document.createElement("div");
                div.className = "order";
                div.innerHTML = `
                <strong>${order.name}</strong><a class="large-gap">&nbsp;</a> <a style="float: right">${order.type}</a><br>
                ${new Date(order.ts).toLocaleString()} <a style="float: right">${order.status}</a>
                `;

                div.onclick = () => openOrder(order.id);

                ordersList.appendChild(div);
            });
        } else {
            ordersList.innerHTML = "500: Internal Server Error";
        }
    });
}

// OPEN ORDER MODAL
async function openOrder(id) {
    fetch(api(`/api/order/get/${id}`)).then(res => res.json()).then(data => {
        if (data.success) {
            order = data.data
            currentOrderId = id;
            if (order.type == "Pizza") {
                orderDetails.innerHTML = `
                <p><b>Name:</b> ${order.name}</p>
                <p><b>Phone:</b> ${order.phone}</p>
                <p><b>Type:</b> ${order.type}</p>
                <p><b>Size:</b> ${order.size}</p>
                <p><b>Flavor:</b> ${order.flavor}</p>
                <p><b>Takeaway:</b> ${order.takeaway ? "Yes" : "No"}</p>
                <p><b>Instructions:</b> ${order.instruction ? "Yes" : "No"}</p>
                <p><b>Payment:</b><br>${order.payment
                        ? `<img class="order-image" src="${imageSrc}/uploads/${order.payment}  onclick="window.open(this.src, \'_blank\')">`
                        : "<i>Not uploaded</i>"
                    }</p>
                <p><b>Status:</b> ${order.status}</p>
                `;
            } else if (order.type == "Cake") {
                orderDetails.innerHTML = `
                <p><b>Name:</b> ${order.name}</p>
                <p><b>Phone:</b> ${order.phone}</p>
                <p><b>Type:</b> ${order.type}</p>
                <p><b>Size:</b> ${order.size}</p>
                <p><b>Message:</b> ${order.message}</p>
                <p><b>Sample:</b><br>${order.sample
                        ? `<img class="order-image" src="${imageSrc}/uploads/${order.sample}" onclick="window.open(this.src, \'_blank\')">`
                        : "<i>Not uploaded</i>"
                    }</p>
                <p><b>Takeaway:</b> ${order.takeaway ? "Yes" : "No"}</p>
                <p><b>Instructions:</b> ${order.instruction ? "Yes" : "No"}</p>
                <p><b>Payment:</b><br>${order.payment
                        ? `<img class="order-image" src="${imageSrc}/uploads/${order.payment}" onclick="window.open(this.src, \'_blank\')">`
                        : "<i>Not uploaded</i>"
                    }</p>
                <p><b>Status:</b> ${order.status}</p>
                `;
            }
            if (order.status == "Pending") {
                document.getElementById("markDoneBtn").classList.remove("hidden");
            } else {
                document.getElementById("markDoneBtn").classList.add("hidden");
            }

            modal.classList.remove("hidden");
        } else {
            orderDetails.innerHTML = "500: Internal Server Error";
        }
    });
}

// MARK AS DONE
markDoneBtn.onclick = async () => {
    fetch(api(`/api/order/update/${currentOrderId}`), {
        method: "PUT"
    }).then(() => {
        modal.classList.add("hidden");
        loadOrders();
    });
};

// CLOSE MODAL
closeModal.onclick = () => {
    modal.classList.add("hidden");
};

// INIT
loadOrders();