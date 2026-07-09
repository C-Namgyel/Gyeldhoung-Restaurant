const domain = "gyeldhoung.com";
// function api(path, domain) {
//   return `http://localhost:8080${path}`;
// }
function api(path) {
  return `https://api.${domain}${path}`;
}

// ===== COSTS =====
const cost = {
  Pizza: {
    Veg: {
      Small: 250,
      Medium: 350,
      Large: 450
    },
    Beef: {
      Small: 280,
      Medium: 380,
      Large: 480
    },
    Chicken: {
      Small: 280,
      Medium: 380,
      Large: 480
    }
  },
  Cake: {
    Small: 650,
    Medium: 950,
    Large: 1200
  }
}

// ===== ELEMENTS =====
// Sections
const pizzaSection = document.getElementById("pizzaSection");
const cakeSection = document.getElementById("cakeSection");
const takeawaySection = document.getElementById("takeawaySection");
const paymentSection = document.getElementById("paymentSection");
const instructionsSection = document.getElementById("instructionsSection");
const summarySection = document.getElementById("summarySection");
// Elements
const form = document.getElementById("orderForm");
const preview = document.getElementById("preview");
const instruction = document.getElementById("instruction");
const summaryBox = document.getElementById("summaryBox");
const pizzaSize = document.getElementById("pizzaSize");
const pizzaFlavor = document.getElementById("pizzaFlavor");
const cakeSize = document.getElementById("cakeSize");
const submitBtn = document.getElementById("submitBtn");
const paymentInput = document.getElementById("paymentProof");
const cakeSample = document.getElementById("cakeSample");
const cakeSamplePreview = document.getElementById("cakeSamplePreview");

// ===== TOGGLE PIZZA / CAKE =====
orderType.addEventListener("change", () => {
  const value = orderType.value;

  pizzaSection.classList.add("hidden");
  cakeSection.classList.add("hidden");

  if (value === "Pizza") {
    pizzaSection.classList.remove("hidden");
  } else if (value === "Cake") {
    cakeSection.classList.remove("hidden");
  }
  for (const e of [...document.getElementsByClassName('cake'), ...document.getElementsByClassName('pizza')]) {
    e.required = value.toLowerCase() == e.className.toLowerCase() ? true : false;
  }
  if (value != "") {
    takeawaySection.classList.remove("hidden");
    paymentSection.classList.remove("hidden");
    instructionsSection.classList.remove("hidden");
    summarySection.classList.remove("hidden");
    submitBtn.classList.remove("hidden");
  }
  updateSummary();
});

// ===== PAYMENT PREVIEW =====
paymentInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (event) {
      preview.src = event.target.result;
      preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  }
});

// ===== CAKE SAMPLE =====
cakeSample.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (event) {
      cakeSamplePreview.src = event.target.result;
      cakeSamplePreview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  }
});

// ===== SUMMARY UPDATE =====
function updateSummary() {
  const name = document.getElementById("name").value || "-";
  const phone = document.getElementById("phone").value || "-";
  const type = orderType.value || "-";

  let html = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Order:</strong> ${type}</p>
  `;

  if (type === "Pizza") {
    const size = document.getElementById("pizzaSize").value;
    const flavor = document.getElementById("pizzaFlavor").value;

    html += `
      <p><strong>Size:</strong> ${size}</p>
      <p><strong>Flavor:</strong> ${flavor}</p>
      <p>🥤 Includes Coke</p>
    `;
  }

  if (type === "Cake") {
    const size = document.getElementById("cakeSize").value;
    const message = document.getElementById("cakeMessage").value || "-";

    html += `
      <p><strong>Size:</strong> ${size}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;
  }

  const takeawayCost = takeaway.checked ? 20 : 0;
  let initialCost = 0;
  if (type == "Pizza") {
    if (pizzaFlavor.value != "" && pizzaSize.value != "") initialCost = cost["Pizza"][pizzaFlavor.value][pizzaSize.value];
  } else if (type == "Cake") {
    if (cakeSize.value != "") initialCost = cost["Cake"][cakeSize.value];
  }

  html += `
    <p><strong>Takeaway:</strong> ${takeaway.checked ? "Yes (+Nu.20)" : "No"}</p>
    <p><strong>Extra Instructions:</strong> ${instruction.value}</p>
    <p><strong>Unit Price:</strong> Nu. ${initialCost}</p>
    <p><strong>Extra Cost:</strong> Nu. ${takeawayCost}</p>
    <p><strong>Total:</strong> Nu. ${parseInt(takeawayCost) + parseInt(initialCost)}</p>
  `;

  summaryBox.innerHTML = html;
}

// ===== LIVE UPDATE EVENTS =====
document.addEventListener("input", updateSummary);
takeaway.addEventListener("change", updateSummary);
orderType.addEventListener("change", updateSummary);

// ===== FORM SUBMIT =====
form.addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("submitBtn").innerHTML = "Submitting...";
  const formData = new FormData(event.target);

  const uploadData = new FormData();
  uploadData.append("name", formData.get("name"))
  uploadData.append("phone", formData.get("phone"))
  uploadData.append("order", formData.get("order"))
  uploadData.append("takeaway", formData.get("takeaway") == "on" ? true : false)
  uploadData.append("payment", formData.get("payment").size > 0 ? formData.get("payment") : false)
  uploadData.append("instruction", formData.get("instruction"))
  if (formData.get("order") == "Pizza") {
    uploadData.append("size", formData.get("pizza-size"))
    uploadData.append("flavor", formData.get("pizza-flavor"))
  } else if (formData.get("order") == "Cake") {
    uploadData.append("size", formData.get("cake-size"))
    uploadData.append("message", formData.get("cake-message"))
    uploadData.append("sample", formData.get("cake-sample").size > 0 ? formData.get("cake-sample") : false)
  }

  fetch(api("/api/order/add"), {
    method: "POST",
    body: uploadData
  })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert("Order Successfully Submitted");
        location.reload();
      } else {
        alert("Order Submit Failed");
        console.log(res.error)
      }

    })

  // alert("Order placed successfully 🚀");
});