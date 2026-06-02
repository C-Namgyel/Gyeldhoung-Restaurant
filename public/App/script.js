const socket = io(window.location.origin);

// Socket event handlers for real-time updates
socket.on("groceryAdd", (data) => {
  groceryList.push(data);
  groceryList.sort((a, b) => a.item.localeCompare(b.item));
  if (getScreen() == "groceryListScrn") {
    grocerySearch();
  } else {
    loadGroceryTable(groceryList)
  }
  updateGroceryDropdown();
});
socket.on("groceryUpdate", (data) => {
  groceryList[groceryList.findIndex(g => g.id == data.id)] = data;
  groceryList.sort((a, b) => a.item.localeCompare(b.item));
  if (getScreen() == "groceryListScrn") {
    grocerySearch();
  } else {
    loadGroceryTable(groceryList)
  }
  updateGroceryDropdown();
});
socket.on("groceryDelete", (data) => {
  groceryList = groceryList.filter(obj => obj.id !== data.id);
  if (getScreen() == "groceryListScrn") {
    grocerySearch();
  } else {
    loadGroceryTable(groceryList)
  }
  updateGroceryDropdown();
});

// Variables
let tokens = [];
let restaurantList = [];
let groceryList = [];
let creditList = [];
let navHist = ["homeScrn"];
let sortedItems = [];
let tableId = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "11": 11,
  "12": 12,
  "Cabin": 13,
}
let creditTs = null;

// General Functions
function api(path) {
    return `${window.location.origin}${path}`;
}
function showLoading(text) {
    loadingOverlay.classList.add("show");
    loadingText.textContent = text;
}
function hideLoading() {
    loadingOverlay.classList.remove("show");
}
function showSnackbar(text, duration = 1500) {
    snackbar.textContent = text;
    snackbar.classList.add("show");

    setTimeout(() => {
        snackbar.classList.remove("show");
    }, duration);
}
function setScreen(id, mode) {
  document.querySelectorAll('.scrn').forEach(scrn => scrn.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // Additional Codes
  if (mode == 1) {
    const index = navHist.indexOf(id);
    if (index !== -1) {
      navHist = navHist.slice(0, index + 1);
    } else {
      navHist.push(id);
    }
    document.getElementById("backBtn").style.display = "block";
  }
}
function getScreen() {
  const active = document.querySelector('.scrn.active');
  return active ? active.id : null;
}
function fetchGet(endpoint, callback) {
  fetch(api(endpoint))
  .then(response => response.json())
  .then(data => callback(data.data, data.success));
}
function fetchPost(endpoint, payload, callback) {
  fetch(api(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => callback(data.success));
}
function fetchPut(endpoint, id, payload, callback) {
  fetch(api(endpoint+"/"+id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => callback(data.success))
}
function fetchDelete(endpoint, id, callback) {
  fetch(api(endpoint+"/"+id), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => callback(data.success))
}

// Initialization of App
showLoading("Loading Data");
fetchGet('/api/getTokens', (tok) => {
  tokens = tok;
  if (localStorage.getItem('token') == null) {
    let tempToken = "";
    do {
      tempToken = "";
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
      for (let y = 0; y < 12; y++) {
        tempToken += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (tokens.some(t => t.token == tempToken));
    localStorage.setItem("token", tempToken);
    fetchPost('/api/addToken', { token: localStorage.getItem("token") }, function () {
      prompt("You're not permitted to enter this site.\nRequest to access has been sent.\nThis is your token:", localStorage.getItem("token"));
      window.open(`${window.location.origin}`, "_self");
    });
  } else if (tokens.some(find => find.token == localStorage.getItem("token")) == false) {
    fetchPost('/api/addToken', { token: localStorage.getItem("token") }, function () {
      prompt("You're not permitted to enter this site.\nRequest to access has been sent.\nThis is your token:", localStorage.getItem("token"));
      window.open(`${window.location.origin}`, "_self");
    });
  } else if (tokens.filter(t => t.token == localStorage.getItem("token"))[0].role == "Pending") {
    prompt("You're not permitted to enter this site.\nRequest to access has been sent.\nThis is your token:", localStorage.getItem("token"));
    window.open(`${window.location.origin}`, "_self");
  } else if (tokens.some(t => t.token == localStorage.getItem('token')) && tokens.filter(t => t.token == localStorage.getItem("token"))[0].role != "Pending") {
    showLoading("Loading Data..");
    if (tokens.filter(t => t.token == localStorage.getItem("token"))[0].role == "Admin") {
      const adminBtn = document.createElement("button");
      adminBtn.className = "btn";
      adminBtn.innerHTML = "Manage Users";
      document.getElementById("homeScrn").appendChild(adminBtn);
      adminBtn.onclick = function () {
        loadAdmin();
      }
    }
    fetchGet('/api/getData', (dat) => {
      hideLoading();
      restaurantList = dat.restaurantItems;
      groceryList = dat.generalShopItems;
      groceryList.sort((a, b) => a.item.localeCompare(b.item))
      loadGroceryTable(groceryList);
      creditList = dat.credits.sort((a, b) => a.name.localeCompare(b.name));
      updateGroceryDropdown();
      const dropdown = document.getElementById("restaurantItem");
      dropdown.innerHTML = '';
      sortedItems = Array.isArray(restaurantList) ? restaurantList.slice().sort((a, b) => (a.item || '').toString().localeCompare((b.item || '').toString())) : [];
      for (let item of sortedItems) {
        const option = document.createElement('option');
        option.textContent = item.item;
        dropdown.appendChild(option);
      };
    });
  }
})
function updateGroceryDropdown() {
  const input = document.getElementById("groceryItems");
  const dropdown = document.getElementById("groceryItemsDropdown");

  dropdown.innerHTML = '';

  const customOption = document.createElement('div');
  customOption.className = 'searchable-dropdown-item';
  customOption.innerHTML = '<span class="searchable-dropdown-item-text">--Custom Item--</span>';
  customOption.onclick = function () {
    input.value = '--Custom Item--';
    dropdown.style.display = 'none';
    document.getElementById("customItemName").hidden = false;
    document.getElementById("customItemName").value = "";
    document.getElementById("customItemRate").hidden = false;
    document.getElementById("customItemRate").value = "";
    document.getElementById("customItemName").focus();
  };
  dropdown.appendChild(customOption);
  // Add sorted items (safe)
  sortedItems = Array.isArray(groceryList) ? groceryList.slice().sort((a, b) => (a.item || '').toString().localeCompare((b.item || '').toString())) : [];
  for (let item of sortedItems) {
    const option = document.createElement('div');
    option.className = 'searchable-dropdown-item';
    option.innerHTML = `<span class="searchable-dropdown-item-text">${item.item}</span><span class="searchable-dropdown-item-code">Nu. ${item.rate}</span>`;
    option.dataset.id = item.id;
    option.dataset.item = item.item;
    option.onclick = function () {
      document.getElementById("groceryCode").value = item.id;
      document.getElementById("groceryItems").value = item.item + " - Nu. " + item.rate;
      dropdown.style.display = 'none';
      document.getElementById("groceryQuantity").value = "";
      document.getElementById("groceryQuantity").focus();
      document.getElementById("customItemName").hidden = true;
      document.getElementById("customItemRate").hidden = true;
    };
    dropdown.appendChild(option);
  };
  setTimeout(() => {
    dropdown.scrollTop = 0;
  }, 1);
}

// Back Button
document.getElementById("backBtn").addEventListener("click", () => {
  navHist.pop();
  setScreen(navHist[navHist.length - 1], 0);
  if (navHist.length == 1) {
    document.getElementById("backBtn").style.display = "none";
  }
});

// Restaurant Billing Screen
/*
let restaurantItems = [];
let restaurantTotal = 0;
function addRestaurantItem() {
  const selectedItem = document.getElementById("restaurantItem").value;
  if (!restaurantItems.some(item => item.item == selectedItem)) {
    restaurantItems.push({ item: selectedItem, quantity: document.getElementById("restaurantQuantity").value, total: (restaurantList.find(i => i.item == selectedItem).rate * document.getElementById("restaurantQuantity").value) });
    let row = document.createElement("tr");
    let slNo = document.createElement("td");
    let itemCell = document.createElement("td");
    let quantityCell = document.createElement("td");
    let rateCell = document.createElement("td");
    let subTotalCell = document.createElement("td");
    let deleteCell = document.createElement("td");
    slNo.innerText = restaurantItems.length;
    itemCell.innerText = selectedItem;
    quantityCell.innerText = document.getElementById("restaurantQuantity").value;
    rateCell.innerText = restaurantList.find(i => i.item == selectedItem).rate;
    subTotalCell.innerText = (restaurantList.find(i => i.item == selectedItem).rate * document.getElementById("restaurantQuantity").value);
    let deleteBtn = document.createElement("button");
    deleteBtn.className = "iconBtn";
    deleteBtn.style.backgroundColor = "red";
    deleteBtn.style.backgroundImage = "url('./assets/delete.svg')";
    deleteCell.appendChild(deleteBtn);
    row.appendChild(slNo);
    row.appendChild(itemCell);
    row.appendChild(quantityCell);
    row.appendChild(rateCell);
    row.appendChild(subTotalCell);
    row.appendChild(deleteCell);
    document.getElementById("restaurantBody").appendChild(row);
    restaurantTotal += parseFloat(subTotalCell.innerText);
    document.getElementById("restaurantTotal").innerText = restaurantTotal;
    deleteBtn.onclick = function () {
      restaurantTotal -= parseFloat(subTotalCell.innerText);
      row.remove();
      restaurantItems = restaurantItems.filter(i => i.item !== selectedItem);
      document.getElementById("restaurantTotal").innerText = restaurantTotal;
    }
  }
}
function submitRestaurantBill() {
  showLoading("Submitting Order...");
  createData("orders", { "id": document.getElementById("restaurantPhoneNumber").value, "tableNo": document.getElementById("tableNumber").value, "data": JSON.stringify(restaurantItems), "stat": "Pending", "ts": Date.now() }, function () {
    hideLoading();
    showSnackbar("Order successfully placed");
  })
}

document.getElementById("restaurantPhoneNumber").onchange = function () {
  showLoading("Loading Order...");
  getData('orders', function (dat) {
    hideLoading();
    const order = dat.find(item => item.id == document.getElementById("restaurantPhoneNumber").value);
    if (order && order.data != "") {
      const orderItems = JSON.parse(order.data);
      const orderTable = document.getElementById("restaurantBody");
      orderTable.innerHTML = ''; // Clear existing rows
      document.getElementById("tableNumber").value = order.tableNo;
      restaurantTotal = 0;
      restaurantItems = [];
      orderItems.forEach(item => {
        restaurantItems.push({ item: item.item, quantity: item.quantity, total: item.total });
        let row = document.createElement("tr");
        let slNo = document.createElement("td");
        let itemCell = document.createElement("td");
        let quantityCell = document.createElement("td");
        let rateCell = document.createElement("td");
        let subTotalCell = document.createElement("td");
        let deleteCell = document.createElement("td");
        slNo.innerText = orderItems.indexOf(item) + 1;
        itemCell.innerText = item.item;
        quantityCell.innerText = item.quantity;
        rateCell.innerText = item.total / item.quantity;
        subTotalCell.innerText = item.total;
        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteCell.appendChild(deleteBtn);
        row.appendChild(slNo);
        row.appendChild(itemCell);
        row.appendChild(quantityCell);
        row.appendChild(rateCell);
        row.appendChild(subTotalCell);
        row.appendChild(deleteCell);
        document.getElementById("restaurantBody").appendChild(row);
        restaurantTotal += parseFloat(subTotalCell.innerText);
        document.getElementById("restaurantTotal").innerText = restaurantTotal;
        deleteBtn.onclick = function () {
          restaurantTotal -= parseFloat(subTotalCell.innerText);
          row.remove();
          restaurantItems = restaurantItems.filter(i => i.item !== item.item);
          document.getElementById("restaurantTotal").innerText = restaurantTotal;
        }
        orderTable.appendChild(row);
      });
      document.getElementById("restaurantTotal").textContent = restaurantTotal;
    }
  });
}
*/

// General Shop billing
let groceryItems = [];
let groceryTotal = 0;
document.getElementById("groceryCode").onfocus = function () {
  document.getElementById("groceryCode").value = "";
}
document.getElementById("groceryCode").onkeydown = function (key) {
  if (key.key == "Enter") {
    document.getElementById("groceryCode").value.trim();
    if (document.getElementById("groceryCode").value.trim() != "") {
      if (groceryList.find(i => i.id == document.getElementById("groceryCode").value) != undefined) {
        document.getElementById("groceryItems").value = "";
        document.getElementById("groceryQuantity").value = "";
        document.getElementById("groceryQuantity").focus();
        if (document.getElementById("groceryAuto").checked) {
          document.getElementById("groceryQuantity").value = "1";
          addGroceryItem();
        }
      } else {
        const notFoundAdd = confirm("Item not found. Add item and continue?");
        document.getElementById("groceryItemCode").value = "";
        if (notFoundAdd) {
          setScreen("groceryListEditScrn", 1);
          document.getElementById("groceryItemCode").value = parseInt(document.getElementById("groceryCode").value);
          document.getElementById("groceryItemName").value = "";
          document.getElementById("groceryItemRate").value = "";
          document.getElementById("groceryItemShop").checked = true;
          document.getElementById("groceryItemStore").checked = true;
          document.getElementById("groceryItemSaveBtn").onclick = function () {
            if (document.getElementById("groceryItemCode").value.trim() != "" && document.getElementById("groceryItemName").value.trim() != "" && document.getElementById("groceryItemRate").value.trim() != "") {
              const uploadItem = {
                id: document.getElementById("groceryItemCode").value,
                item: document.getElementById("groceryItemName").value,
                rate: parseFloat(document.getElementById("groceryItemRate").value),
                purchaseRate: parseFloat(document.getElementById("groceryItemRate").value),
                storeStock: document.getElementById("groceryItemStore").checked ? 1 : 0,
                shopStock: document.getElementById("groceryItemShop").checked ? 1 : 0
              };
              showLoading("Adding Item...");
              fetchPost("/api/addGroceryItem", uploadItem, function (written) {
                hideLoading();
                const created = Array.isArray(written) ? written[0] : written;
                groceryList.push(created);
                updateGroceryDropdown();
                setScreen("groceryScrn", 1);
                document.getElementById("groceryCode").value = created.id || uploadItem.id;
                document.getElementById("groceryItems").value = "";
                document.getElementById("groceryQuantity").value = "";
                document.getElementById("groceryQuantity").focus();
              })
            }
          }
          setScreen("groceryListEditScrn", 1);
          document.getElementById("groceryItemCode").focus();
        }
      }
    }
  } else if ((key.key >= 0 == false) && key.key != "Backspace" && key.key != "Control" && key.key != "Shift") {
    document.getElementById("groceryItems").focus();
  }
};
document.getElementById("groceryItems").oninput = function () {
  const input = this.value.toLowerCase();
  const dropdown = document.getElementById("groceryItemsDropdown");
  const items = dropdown.querySelectorAll('.searchable-dropdown-item');

  if (input.trim() === "") {
    // Show all items if input is empty
    items.forEach(item => {
      item.style.display = 'block';
    });
    dropdown.style.display = 'block';
    return;
  }

  let hasVisibleItems = false;
  items.forEach(item => {
    const itemText = item.dataset.item ? item.dataset.item.toLowerCase() : item.textContent.toLowerCase();
    const itemCode = item.dataset.id ? item.dataset.id.toLowerCase() : '';

    if (itemText.includes(input) || itemCode.includes(input)) {
      item.style.display = 'block';
      hasVisibleItems = true;
    } else {
      item.style.display = 'none';
    }
  });

  dropdown.style.display = hasVisibleItems ? 'block' : 'none';
};

document.getElementById("groceryItems").onfocus = function () {
  updateGroceryDropdown();
  document.getElementById("groceryItemsDropdown").style.display = 'block';
  this.value = '';
};

document.addEventListener('click', function (e) {
  const container = document.querySelector('.searchable-dropdown-container');
  if (!container.contains(e.target)) {
    document.getElementById("groceryItemsDropdown").style.display = 'none';
  }
});
document.getElementById("customItemName").onkeydown = function (key) {
  if (key.key == "Enter") {
    document.getElementById("customItemRate").focus();
  }
}
document.getElementById("customItemRate").onkeydown = function (key) {
  if (key.key == "Enter") {
    const customName = document.getElementById("customItemName").value;
    const customRate = parseFloat(document.getElementById("customItemRate").value);
    if (customName.trim() != "" && !isNaN(customRate) && customRate > 0) {
      let customCode = "";
      do {
        customCode = "99";
        for (let i = 0; i < 6; i++) {
          customCode += Math.floor(Math.random() * 10);
        }
      } while (groceryList.some(e => e.id.toString() === customCode.toString()));
      // Add to grocery list
      groceryList.push({ id: customCode, item: customName, rate: customRate });
      updateGroceryDropdown();
      document.getElementById("groceryItems").value = customCode;
      document.getElementById("groceryCode").value = customCode;
      document.getElementById("groceryQuantity").value = "";
      document.getElementById("groceryQuantity").focus();
      document.getElementById("customItemName").hidden = true;
      document.getElementById("customItemRate").hidden = true;
      document.getElementById("groceryCode").value = customCode;
      document.getElementById("groceryQuantity").focus();
    } else {
      showSnackbar("Please enter valid item name and rate");
      document.getElementById("customItemName").focus();
    }
  }
}
document.getElementById("groceryQuantity").onkeydown = function (key) {
  if (key.key == "Enter") {
    addGroceryItem();
  }
};
function loadGroceryAddTable() {
  document.getElementById("groceryBody").innerHTML = "";
  groceryTotal = 0;
  for (let selectedItem of groceryItems) {
    let row = document.createElement("tr");
    let slNo = document.createElement("td");
    let itemCell = document.createElement("td");
    let quantityCell = document.createElement("td");
    let rateCell = document.createElement("td");
    let subTotalCell = document.createElement("td");
    let deleteCell = document.createElement("td");
    slNo.innerText = groceryItems.indexOf(selectedItem) + 1;
    itemCell.innerText = selectedItem.item;
    quantityCell.innerText = selectedItem.quantity;
    rateCell.innerText = groceryList.find(i => i.id == selectedItem.id).rate;
    subTotalCell.innerText = selectedItem.total;
    let minusBtn = document.createElement("button");
    minusBtn.style.backgroundImage = 'url("./assets/minus.svg")';
    minusBtn.className = "iconBtn";
    deleteCell.appendChild(minusBtn);
    let deleteBtn = document.createElement("button");
    deleteBtn.style.backgroundColor = 'red';
    deleteBtn.style.backgroundImage = 'url("./assets/delete.svg")';
    deleteBtn.className = "iconBtn";
    deleteCell.appendChild(deleteBtn);
    row.appendChild(slNo);
    row.appendChild(itemCell);
    row.appendChild(quantityCell);
    row.appendChild(rateCell);
    row.appendChild(subTotalCell);
    row.appendChild(deleteCell);
    document.getElementById("groceryBody").appendChild(row);
    groceryTotal += selectedItem.total;
    deleteBtn.onclick = function () {
      groceryItems.splice(groceryItems.indexOf(selectedItem), 1);
      loadGroceryAddTable();
      document.getElementById("groceryCode").value = "";
      document.getElementById("groceryCode").focus();
    }
    minusBtn.onclick = function () {
      if (selectedItem.quantity > 1) {
        selectedItem.quantity = selectedItem.quantity - 1;
        selectedItem.total = selectedItem.total - groceryList.find(i => i.id == selectedItem.id).rate;
        loadGroceryAddTable();
        document.getElementById("groceryCode").value = "";
        document.getElementById("groceryCode").focus();
      }
    }
    itemCell.onclick = function () {
      document.getElementById("groceryCode").value = selectedItem.id;
      document.getElementById("groceryQuantity").value = "";
      document.getElementById("groceryQuantity").focus();
    }
  }
  document.getElementById("groceryTotal").innerText = groceryTotal;
}
function addGroceryItem() {
  const itemCode = document.getElementById("groceryCode").value;
  if (itemCode.trim() != "" && document.getElementById("groceryQuantity").value.trim() != "" && parseFloat(document.getElementById("groceryQuantity").value) > 0 && parseFloat(document.getElementById("groceryQuantity").value) < 50000000) {
    if (groceryItems.find(i => i.id == itemCode) != undefined) {
      groceryItems.find(i => i.id == itemCode).quantity = parseInt(groceryItems.find(i => i.id == itemCode).quantity) + parseInt(document.getElementById("groceryQuantity").value);
      groceryItems.find(i => i.id == itemCode).total = groceryItems.find(i => i.id == itemCode).total + groceryList.find(i => i.id == itemCode).rate * document.getElementById("groceryQuantity").value;
      loadGroceryAddTable();
    } else {
      groceryItems.push({ item: groceryList.find(i => i.id == itemCode.toString()).item, id: itemCode, quantity: document.getElementById("groceryQuantity").value, total: (groceryList.find(i => i.id == itemCode).rate * document.getElementById("groceryQuantity").value) });
    }
    loadGroceryAddTable();
    document.getElementById("groceryCode").value = "";
    document.getElementById("groceryItems").value = "";
    document.getElementById("groceryQuantity").value = "";
    document.getElementById("groceryCode").focus();
  } else {
    document.getElementById("groceryQuantity").value = "";
    showSnackbar("Invalid Input");
  }
}
document.getElementById("groceryReceived").onkeydown = function (key) {
  if (key.key == "Enter") {
    let receivedAmount = parseFloat(document.getElementById("groceryReceived").value);
    let change = receivedAmount - groceryTotal;
    if (change < 0) {
      document.getElementById("groceryChange").innerText = "Change: Insufficient Amount";
    } else {
      document.getElementById("groceryChange").innerText = "Change: " + change.toFixed(2);
    }
  }
}
function printBill(data) {
  const printWindow = window.open('', '', 'height=400,width=600');
  // Create HTML structure
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 20px;
            text-align: center;
          }
          .header {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .date {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .divider {
            margin: 10px 0;
            border-bottom: 1px solid #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: none;
            padding: 3px 5px;
            text-align: left;
            font-family: 'Courier New', monospace;
            font-size: 16px;
          }
          .header-row {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .total-section {
            margin-top: 10px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          .total-line {
            text-align: right;
            font-weight: bold;
          }
          .footer {
            margin-top: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">GYELDHOUNG GENERAL SHOP</div><br>
        <div class="date">${new Date().toLocaleDateString()}</div>
        <div class="date">${new Date().toLocaleTimeString()}</div>
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr class="header-row">
              <th style="width: 50%;">Item</th>
              <th style="width: 15%;">Qty</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody id="printTableBody">
          </tbody>
        </table>
        
        <div class="total-section">
          <div id="printTotal" class="total-line">Total: Nu. </div>
        </div>
        <div class="footer">Thank You!</div>
        <br>===<br>===
      </body>
      </html>
    `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Populate table rows
  const tableBody = printWindow.document.getElementById('printTableBody');
  let total = 0;
  data.forEach(item => {
    const row = printWindow.document.createElement('tr');
    const itemCell = printWindow.document.createElement('td');
    const qtyCell = printWindow.document.createElement('td');
    const totalCell = printWindow.document.createElement('td');

    itemCell.textContent = item.item;
    qtyCell.textContent = item.quantity;
    qtyCell.style.textAlign = 'center';
    totalCell.textContent = item.total.toFixed(2);
    totalCell.style.textAlign = 'right';
    total += item.total;

    row.appendChild(itemCell);
    row.appendChild(qtyCell);
    row.appendChild(totalCell);
    tableBody.appendChild(row);
  });
  printWindow.document.getElementById("printTotal").innerHTML = "Total: Nu. " + total.toFixed(2);

  printWindow.print();
}
document.getElementById("groceryPrint").onclick = function () {
  if (groceryItems.length > 0) {
    printBill(groceryItems);
  } else {
    showSnackbar("No items to print");
  }
}
function resetGroceryForm() {
  document.getElementById("groceryCode").value = "";
  document.getElementById("groceryItems").value = "";
  document.getElementById("groceryQuantity").value = "";
  document.getElementById("groceryPayment").value = "";
  document.getElementById("groceryTotal").innerText = "0";
  document.getElementById("groceryBody").innerHTML = "";
  document.getElementById("groceryCode").focus();
  groceryItems = [];
  groceryTotal = 0;
}
function submitGroceryBill() {
  if (document.getElementById("groceryPayment").value.trim() != "" && groceryItems.length > 0) {
    let ts = Date.now();
    let uploadData = [];
    for (let i of groceryItems) {
      uploadData.push({ ts: ts, item: i.item, quantity: i.quantity, total: i.total, source: "grocery", payment: document.getElementById("groceryPayment").value });
    }
    if (uploadData[0].payment == "Credit") {
      creditTs = ts;
      setScreen("creditScrn");
      document.getElementById("creditCidNumber").value = "";
      document.getElementById("creditPhoneNumber").value = "";
      document.getElementById("creditName").value = "";
      document.getElementById("creditAmount").value = groceryTotal;
      document.getElementById("creditAmount").disabled = true;
    } else {
      showLoading("Submitting...");
      fetchPost("/api/addSales", uploadData, function () {
        hideLoading();
        resetGroceryForm();
        document.getElementById("groceryCode").focus();
      })
    }
  } else {
    showSnackbar("Please fill up all required");
  }
}

// Credit System
function addCredit() {
  if (document.getElementById("creditCidNumber").value.trim() != "" && document.getElementById("creditPhoneNumber").value.trim() != "" && document.getElementById("creditName").value.trim() != "") {
    showLoading("Submitting Credit...");
    const salesRec = groceryItems.map(i => ({ ts: creditTs, item: i.item, quantity: i.quantity, total: i.total, source: "grocery", payment: "Credit" }));
    const creditData = {
      ts: creditTs,
      cidNumber: document.getElementById("creditCidNumber").value,
      phoneNumber: document.getElementById("creditPhoneNumber").value,
      name: document.getElementById("creditName").value,
      amount: parseFloat(document.getElementById("creditAmount").value)
    };
    fetchPost("/api/addCredit", { salesRec, creditData}, (writtenCredit) => {
      console.log(writtenCredit);
      creditList.push(writtenCredit.sales);
      creditList.sort((a, b) => a.name.localeCompare(b.name));
      hideLoading();
      resetGroceryForm();
      setScreen("groceryScrn", 1);
    })
  } else {
    showSnackbar("Please fill up all required fields");
  }
}
document.getElementById("creditCidNumber").onkeydown = function (key) {
  if (key.key == "Enter") {
    document.getElementById("creditPhoneNumber").focus();
    const creditData = creditList.filter(i => i.cidNumber == document.getElementById("creditCidNumber").value);
    if (creditData.length > 0 && document.getElementById("creditCidNumber").value != "0") {
      document.getElementById("creditPhoneNumber").value = creditData.at(-1).phoneNumber;
      document.getElementById("creditName").value = creditData.at(-1).name;
      document.getElementById("creditName").focus();
    }
  }
}
document.getElementById("creditPhoneNumber").onkeydown = function (key) {
  if (key.key == "Enter") {
    document.getElementById("creditName").focus();
    const creditData = creditList.filter(i => i.phoneNumber == document.getElementById("creditPhoneNumber").value);
    if (creditData.length > 0 && document.getElementById("creditPhoneNumber").value != "0") {
      document.getElementById("creditCidNumber").value = creditData.at(-1).cidNumber;
      document.getElementById("creditName").value = creditData.at(-1).name;
      document.getElementById("creditName").focus();
    }
  }
}

/*
// Restaurant Item List
function loadRestaurantTable(dat) {
  const orderTable = document.getElementById("restaurantListBody");
  orderTable.innerHTML = ''; // Clear existing rows
  dat.forEach(item => {
    const row = document.createElement('tr');
    row.id = "restaurantRow" + item.id
    const restaurantSl = document.createElement("td");
    const restaurantItem = document.createElement("td");
    const restaurantRate = document.createElement("td");
    const restaurantCategory = document.createElement("td");
    const restaurantAction = document.createElement("td");
    restaurantSl.innerHTML = dat.indexOf(item) + 1;
    restaurantItem.innerHTML = item.item;
    restaurantRate.innerHTML = item.rate;
    restaurantCategory.innerHTML = item.category;
    row.appendChild(restaurantSl);
    row.appendChild(restaurantItem);
    row.appendChild(restaurantRate);
    row.appendChild(restaurantCategory);
    row.appendChild(restaurantAction);
    orderTable.appendChild(row);
    // Action Buttons
    const editBtn = document.createElement("button");
    editBtn.className = "iconBtn";
    editBtn.style.backgroundImage = "url('./assets/edit.svg')";
    restaurantAction.appendChild(editBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "iconBtn";
    deleteBtn.style.backgroundColor = "red";
    deleteBtn.style.backgroundImage = "url('./assets/delete.svg')";
    restaurantAction.appendChild(deleteBtn);
    editBtn.onclick = function () {
      document.getElementById("restaurantItemName").value = item.item;
      document.getElementById("restaurantItemRate").value = item.rate;
      document.getElementById("restaurantItemCategory").value = item.category;
      document.getElementById("restaurantItemSaveBtn").onclick = function () {
        const updatedItem = {
          item: document.getElementById("restaurantItemName").value,
          rate: parseFloat(document.getElementById("restaurantItemRate").value),
          category: document.getElementById("restaurantItemCategory").value,
        };
        updateData("restaurant", item.id, updatedItem, function () {
          showSnackbar("Item updated");
          loadRestaurantList();
        });
      }
      setScreen("restaurantListEditScrn", 1);
    };
    deleteBtn.onclick = function () {
      if (confirm("Are you sure you want to delete this item?")) {
        deleteData("restaurant", item.id, function (res) {
          showSnackbar("Item deleted");
          loadRestaurantList();
        });
      }
    }
  });
}
function loadRestaurantList() {
  getData("restaurant", function (dat) {
    dat.sort((a, b) => a.item.localeCompare(b.item));
    restaurantList = dat;
    loadRestaurantTable(dat);
    setScreen("restaurantListScrn", 1);
  })
}
function addNewRestaurantItem() {
  document.getElementById("restaurantItemName").value = "";
  document.getElementById("restaurantItemRate").value = "";
  document.getElementById("restaurantItemCategory").value = "";
  document.getElementById("restaurantItemSaveBtn").onclick = function () {
    const uploadItem = {
      item: document.getElementById("restaurantItemName").value,
      rate: parseFloat(document.getElementById("restaurantItemRate").value),
      category: document.getElementById("restaurantItemCategory").value,
    };
    createData("restaurant", uploadItem, function () {
      showSnackbar("Item added");
      loadRestaurantList();
    })
  }
  setScreen("restaurantListEditScrn", 1);
}
function restaurantSearch() {
  let filtered = [];
  filtered = restaurantList.filter(item => item.item.toString().toLowerCase().includes(document.getElementById("restaurantSearchInput").value.toLowerCase()));
  loadRestaurantTable(filtered);
}
  */

// Grocery Item List
function loadGroceryScrn() {
  showLoading("Loading");
  setTimeout(()=> {
    document.getElementById('grocerySearchInput').value='';
    setScreen('groceryListScrn');
    loadGroceryTable(groceryList);
    hideLoading();
  }, 100);
}
function loadGroceryTable(dat) {
  const orderTable = document.getElementById("groceryListBody");
  orderTable.innerHTML = ''; // Clear existing rows
  dat.forEach(item => {
    const row = document.createElement('tr');
    const grocerySl = document.createElement("td");
    const groceryCode = document.createElement("td");
    const groceryItem = document.createElement("td");
    const groceryRate = document.createElement("td");
    const groceryStock = document.createElement("td")
    const groceryAction = document.createElement("td");
    grocerySl.innerHTML = dat.indexOf(item) + 1;
    groceryCode.innerHTML = item.id;
    groceryItem.innerHTML = item.item;
    groceryRate.innerHTML = item.rate;
    if (item.shopStock == 1 && item.storeStock == 1) {
      groceryStock.innerHTML = "In Stock";
    } else if (item.shopStock == 0 && item.storeStock == 0) {
      groceryStock.innerHTML = "Out of Stock";
    } else if (item.shopStock == 1 && item.storeStock == 0) {
      groceryStock.innerHTML = "On Shelf";
    } else if (item.shopStock == 0 && item.storeStock == 1) {
      groceryStock.innerHTML = "In Storage";
    }
    row.appendChild(grocerySl);
    row.appendChild(groceryCode);
    row.appendChild(groceryItem);
    row.appendChild(groceryRate);
    row.appendChild(groceryStock);
    row.appendChild(groceryAction);
    orderTable.appendChild(row);
    // Action Buttons
    const editBtn = document.createElement("button");
    editBtn.className = "iconBtn";
    editBtn.style.backgroundImage = "url('./assets/edit.svg')";
    groceryAction.appendChild(editBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "iconBtn";
    deleteBtn.style.backgroundColor = "red";
    deleteBtn.style.backgroundImage = "url('./assets/delete.svg')"
    groceryAction.appendChild(deleteBtn);
    editBtn.onclick = function () {
      document.getElementById("groceryItemCode").value = item.id;
      document.getElementById("groceryItemCode").disabled = true;
      document.getElementById("groceryGenerateBtn").disabled = true;
      document.getElementById("groceryItemName").value = item.item;
      document.getElementById("groceryItemRate").value = item.rate;
      document.getElementById("groceryItemStore").checked = item.storeStock == 1;
      document.getElementById("groceryItemShop").checked = item.shopStock == 1;
      document.getElementById("groceryItemSaveBtn").onclick = function () {
        const updatedItem = {
          item: document.getElementById("groceryItemName").value,
          rate: parseFloat(document.getElementById("groceryItemRate").value),
          purchaseRate: parseFloat(document.getElementById("groceryItemRate").value),
          shopStock: document.getElementById("groceryItemShop").checked ? 1 : 0,
          storeStock: document.getElementById("groceryItemStore").checked ? 1 : 0
        };
        showLoading("Updating Item...");
        fetchPut("/api/updateGroceryItem", parseInt(item.id), updatedItem, function () {
          hideLoading();
          document.getElementById("groceryItemCode").disabled = false;
          document.getElementById("groceryGenerateBtn").disabled = false;
        });
      }
      setScreen("groceryListEditScrn", 1);
    };
    deleteBtn.onclick = function () {
      if (confirm("Are you sure you want to delete this item?")) {
        showLoading("Deleting Item...");
        fetchDelete("/api/general_shop", item.id, (data, success) => {
          hideLoading();
          showSnackbar("Item deleted");
        });
      }
    }
    if (item.id.toString().length == 8) {
      const printBtn = document.createElement("button");
      printBtn.className = "iconBtn";
      printBtn.style.backgroundImage = "url('./assets/download.svg')";
      printBtn.style.aspectRatio = "1/1";
      groceryAction.appendChild(printBtn);
      printBtn.onclick = function () {
        navigator.clipboard.writeText(item.id);
        showSnackbar("Item code copied to clipboard");
      }
    }
  });
}
function addNewGroceryItem() {
  setScreen("groceryListEditScrn", 1);
  document.getElementById("groceryItemCode").value = "";
  document.getElementById("groceryItemName").value = "";
  document.getElementById("groceryItemRate").value = "";
  document.getElementById("groceryItemStore").checked = true;
  document.getElementById("groceryItemShop").checked = true;
  document.getElementById("groceryItemSaveBtn").onclick = function () {
    const uploadItem = {
      id: document.getElementById("groceryItemCode").value,
      item: document.getElementById("groceryItemName").value,
      rate: parseFloat(document.getElementById("groceryItemRate").value),
      purchaseRate: parseFloat(document.getElementById("groceryItemRate").value),
      storeStock: 1,
      shopStock: 1
    };
    showLoading("Adding Item...");
    fetchPost("/api/addGroceryItem", uploadItem, function () {
      hideLoading();
      document.getElementById("groceryItemCode").value = "";
      document.getElementById("groceryItemName").value = "";
      document.getElementById("groceryItemRate").value = "";
      document.getElementById("groceryItemCode").focus();
    })
  }
  // setScreen("groceryListEditScrn", 1);
  document.getElementById("groceryItemCode").focus();
}
document.getElementById("groceryItemCode").onkeyup = function () {
  if (groceryList.some(e => e.id.toString() === document.getElementById("groceryItemCode").value.toString())) {
    setTimeout(() => {
      showSnackbar("Item code already exists");
      document.getElementById("groceryItemCode").value = "";
      document.getElementById("groceryItemCode").focus();
    }, 100);
  }
}
function grocerySearch() {
  let filtered1 = groceryList.filter(item => item.id.toString().toLowerCase().includes(document.getElementById("grocerySearchInput").value.toLowerCase()));
  let filtered2 = groceryList.filter(item => item.item.toString().toLowerCase().includes(document.getElementById("grocerySearchInput").value.toLowerCase()));
  let filtered = filtered1.concat(filtered2);
  filtered = Array.from(new Set(filtered)); // Remove duplicates
  filtered.sort((a, b) => a.item.localeCompare(b.item));
  loadGroceryTable(filtered);
}
function generateItemCode() {
  let code = "";
  do {
    code = "50";
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10);
    }
  } while (groceryList.some(e => e.id.toString() === code.toString()));
  document.getElementById("groceryItemCode").value = code;
}

// Income Screen
document.getElementById("incomeBtn").onclick = function () {
  let selectedDate = document.getElementById("incomeDate").value;
  if (selectedDate != "") {
    const incomeBody = document.getElementById("incomeBody");
    incomeBody.innerHTML = "";
    const dateArr = selectedDate.split("-");
    const startOfDay = new Date(dateArr[0], dateArr[1] - 1, dateArr[2], 0, 0, 0).getTime();
    const endOfDay = new Date(dateArr[0], dateArr[1] - 1, dateArr[2], 23, 59, 59, 999).getTime();
    showLoading("Loading Data...");
    fetch(api(`/api/getSales?start=${startOfDay.toString()}&end=${endOfDay.toString()}`))
    .then(res => res.json())
    .then(fin => {
      dat = fin.data;
      hideLoading();
      filtered = dat.sort((a, b) => a.ts.toString().localeCompare(b.ts.toString()));
      let totalIncome = 0;
      let incomeCash = 0;
      let incomeOnline = 0;
      let incomeCredit = 0;
      let incomeRestaurant = 0;
      let cleanedData = {};
      let prevTs = 0;
      filtered.forEach(item => {
        if (item.ts != prevTs) {
          cleanedData[item.ts] = { items: [], total: 0, payment: item.payment, source: item.source };
        }
        cleanedData[item.ts].items.push({ item: item.item, quantity: item.quantity, total: item.total });
        cleanedData[item.ts].total += item.total;
        prevTs = item.ts;
      });
      Object.keys(cleanedData).forEach(ts => {
        const row = document.createElement('tr');
        const incomeSl = document.createElement("td");
        const incomeDate = document.createElement("td");
        const incomeTime = document.createElement("td");
        const incomeAmount = document.createElement("td");
        const incomePayment = document.createElement("td");
        const incomeSource = document.createElement("td");
        const incomeAction = document.createElement("td");
        incomeSl.innerHTML = Object.keys(cleanedData).indexOf(ts) + 1;
        incomeDate.innerHTML = new Date(parseInt(ts)).toLocaleDateString();
        incomeTime.innerHTML = new Date(parseInt(ts)).toLocaleTimeString();
        incomeAmount.innerHTML = cleanedData[ts].total;
        incomePayment.innerHTML = cleanedData[ts].payment;
        incomeSource.innerHTML = cleanedData[ts].source;
        let viewBtn = document.createElement("button");
        viewBtn.style.backgroundImage = "url('./assets/view.svg')";
        viewBtn.className = "iconBtn";
        viewBtn.onclick = function () {
          let printText = "Item - Quantity - Total\n";
          cleanedData[ts].items.forEach(item => {
            printText += `${item.item} - ${item.quantity} - ${item.total}\n`;
          });
          alert(printText);
        }
        incomeAction.appendChild(viewBtn);
        let printBtn = document.createElement("button");
        printBtn.className = "iconBtn";
        printBtn.style.backgroundImage = "url('./assets/print.svg')";
        printBtn.onclick = function () {
          console.log(cleanedData[ts].items)
          printBill(cleanedData[ts].items);
        }
        incomeAction.appendChild(printBtn);
        let deleteBtn = document.createElement("button");
        deleteBtn.className = "iconBtn";
        deleteBtn.style.backgroundImage = "url('./assets/delete.svg')";
        deleteBtn.style.backgroundColor = "red";
        deleteBtn.onclick = function () {
          if (confirm("Are you sure you want to delete this record?") == false) {
            return;
          }
          let deleteArray = filtered.filter(item => item.ts == ts);
          const len = deleteArray.length;
          let count = 0;
          showLoading("Deleting...");
          deleteArray.forEach(del => {
            fetchDelete("/api/sales", del.id, (dat) => {
              count += 1;
              if (count == len) {
                hideLoading();
                document.getElementById("incomeBtn").click();
              }
            })
          })
        }
        incomeAction.appendChild(deleteBtn);
        row.appendChild(incomeSl);
        row.appendChild(incomeDate);
        row.appendChild(incomeTime);
        row.appendChild(incomeAmount);
        row.appendChild(incomePayment);
        row.appendChild(incomeSource);
        row.appendChild(incomeAction);
        incomeBody.appendChild(row);
        if (cleanedData[ts].payment == "Cash" || cleanedData[ts].payment == "Online") {
          totalIncome += cleanedData[ts].total;
        }
        if (cleanedData[ts].payment === "Cash") {
          incomeCash += cleanedData[ts].total;
        } else if (cleanedData[ts].payment === "Online") {
          incomeOnline += cleanedData[ts].total;
        } else if (cleanedData[ts].payment === "Credit") {
          incomeCredit += cleanedData[ts].total;
        } else if (cleanedData[ts].payment === "Restaurant") {
          incomeRestaurant += cleanedData[ts].total;
        }
      });
      document.getElementById("incomeTotal").innerHTML = totalIncome;
      document.getElementById("incomeSummary").innerHTML = `Cash: ${incomeCash}<br>Online: ${incomeOnline}<br>Credit: ${incomeCredit}<br>Restaurant: ${incomeRestaurant}`;
      document.documentElement.scrollTop = document.documentElement.scrollHeight;
    });
  } else {
    showSnackbar("Please enter a valid date");
  }
}

// Credit Screen
function loadCreditList(creditData) {
  setScreen("creditListScrn", 1);
  creditData = creditData.sort((a, b) => a.name.localeCompare(b.name));
  const creditBody = document.getElementById("creditListBody");
  creditBody.innerHTML = "";
  let totalCredit = 0;
  creditData.forEach(item => {
    const row = document.createElement('tr');
    const creditSl = document.createElement("td");
    const creditName = document.createElement("td");
    const creditCid = document.createElement("td");
    const creditPhone = document.createElement("td");
    const creditAmount = document.createElement("td");
    const creditDate = document.createElement("td");
    const creditTime = document.createElement("td");
    const creditAction = document.createElement("td");
    creditSl.innerHTML = creditData.indexOf(item) + 1;
    creditName.innerHTML = item.name;
    creditCid.innerHTML = item.cidNumber;
    creditPhone.innerHTML = item.phoneNumber;
    creditAmount.innerHTML = item.amount;
    creditDate.innerHTML = new Date(item.ts).toLocaleDateString();
    creditTime.innerHTML = new Date(item.ts).toLocaleTimeString();
    let viewBtn = document.createElement("button");
    viewBtn.className = "iconBtn";
    viewBtn.style.backgroundImage = "url('./assets/view.svg')"
    viewBtn.onclick = function () {
      let printText = "Item - Quantity - Total\n";
      console.log(item.ts.toString());
      fetch(api(`/api/getCreditSales?ts=${item.ts.toString()}`))
      .then(res => res.json())
      .then(fin => {
        let creditSales = fin.data;
        if (creditSales.length == 0) {
          showSnackbar("No sales data found for this credit entry.");
          return;
        }
        creditSales.forEach(sale => {
          printText += `${sale.item} - ${sale.quantity} - ${sale.total}\n`;
        });
        alert(printText);
      });
    }
    creditAction.appendChild(viewBtn);
    let paidBtn = document.createElement("button");
    paidBtn.className = "iconBtn";
    paidBtn.style.backgroundColor = "green";
    paidBtn.style.backgroundImage = "url('./assets/check.svg')"
    paidBtn.onclick = function () {
      if (confirm("Mark this credit as paid?")) {
        const barrier = document.createElement("div");
        barrier.className = "barrier";
        const paymentModal = document.createElement('div');
        paymentModal.className = "floatingWindow";
        paymentModal.innerHTML = `
          <div style="margin-bottom: 15px; font-weight: bold; font-size: 16px;">Mode of Payment:</div>
          <div style="margin-bottom: 10px;">
            <label style="margin-right: 15px;">
              <input type="radio" name="creditMode" value="Cash" checked> Cash
            </label>
            <label>
              <input type="radio" name="creditMode" value="Online"> Online
            </label>
          </div>
          <button id="creditSubmitBtn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
          <button id="creditCancelBtn" style="width: 100%; padding: 8px; background: #4c77af; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        `;
        document.body.appendChild(barrier);
        barrier.appendChild(paymentModal);

        document.getElementById("creditSubmitBtn").onclick = function () {
          const selectedMode = document.querySelector('input[name="creditMode"]:checked').value;
          barrier.remove();
          showLoading("Updating Credit...");
          fetchPost('/api/updateCredit', { ts: item.ts.toString(), payment: selectedMode, newTs: new Date().getTime() }, (res) => {
            console.log(res);
            creditList = creditList.filter(i => i.id != item.id);
            hideLoading();
            loadCreditList(creditList);
          })
        };
        document.getElementById("creditCancelBtn").onclick = function () {
          barrier.remove();
        }
      }
    }
    creditAction.appendChild(paidBtn);
    row.appendChild(creditSl);
    row.appendChild(creditName);
    row.appendChild(creditCid);
    row.appendChild(creditPhone);
    row.appendChild(creditAmount);
    row.appendChild(creditDate);
    row.appendChild(creditTime);
    row.appendChild(creditAction);
    creditBody.appendChild(row);
    totalCredit += item.amount;
  });
  document.getElementById("creditListTotal").innerText = totalCredit;
}
function creditSearch() {
  let filtered1 = creditList.filter(item => item.cidNumber.toString().toLowerCase().includes(document.getElementById("creditSearch").value.toLowerCase()));
  let filtered2 = creditList.filter(item => item.phoneNumber.toString().toLowerCase().includes(document.getElementById("creditSearch").value.toLowerCase()));
  let filtered3 = creditList.filter(item => item.name.toString().toLowerCase().includes(document.getElementById("creditSearch").value.toLowerCase()));
  let filtered = filtered1.concat(filtered2).concat(filtered3);
  filtered = Array.from(new Set(filtered)); // Remove duplicates
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  loadCreditList(filtered);
}

// Admin
function loadAdmin() {
  showLoading("Loading...");
  fetchGet("/api/getTokens", (res) => {
    hideLoading();
    setScreen("adminScrn", 1);
    tokens = res.sort((a, b) => (a.name || '').localeCompare((b.name || '')));
    document.getElementById("adminBody").innerHTML = "";
    tokens.forEach((dat => {
      let row = document.createElement("tr");
      let sl = document.createElement("td");
      let name = document.createElement("td");
      let tok = document.createElement("td");
      let role = document.createElement("td");
      let action = document.createElement("td");
      sl.innerHTML = tokens.indexOf(dat) + 1;
      name.innerHTML = dat.name;
      tok.innerHTML = dat.token;
      role.innerHTML = dat.role;
      let editBtn = document.createElement("button");
      editBtn.className = "iconBtn";
      editBtn.style.backgroundImage = 'url("./assets/edit.svg")';
      action.appendChild(editBtn);
      row.appendChild(sl);
      row.appendChild(name);
      row.appendChild(tok);
      row.appendChild(role);
      row.appendChild(action);
      document.getElementById("adminBody").appendChild(row);
      editBtn.onclick = function () {
        setScreen("adminEditScrn", 1);
        document.getElementById("adminName").value = dat.name;
        document.getElementById("adminToken").innerHTML = "Token: " + dat.token;
        document.getElementById("adminRole").value = dat.role;
        document.getElementById("adminSave").onclick = function () {
          if (dat.role == "Admin" && document.getElementById("adminRole").value != "Admin" && tokens.filter(f => f.role == "Admin").length == 1) {
            showSnackbar("Cannot remove yourself from admin as no other admin will be left");
            return;
          }
          if (dat.token == localStorage.getItem("token") && document.getElementById("adminRole").value == "Pending") {
            if (confirm("Are you sure you want to deregister yourself?") == false) {
              return;
            }
          }``
          if (document.getElementById("adminRole").value == "Pending") {
            if (confirm("Delete this user?")) {
              showLoading("Deleting...");
              fetchDelete("/api/tokens", dat.id, (res) => {
                if (dat.token == localStorage.getItem("token")) {
                  location.reload();
                }
                loadAdmin();
              })
            }
          } else {
            showLoading("Updating...");
            fetchPut("/api/updateToken", dat.id, { name: document.getElementById("adminName").value.trim(), role: document.getElementById("adminRole").value }, function (upd) {
              if (upd.token == localStorage.getItem("token") && upd.role != "Admin") {
                location.reload();
              }
              loadAdmin();
            })
          }
        }
      }
    }))
  })
}