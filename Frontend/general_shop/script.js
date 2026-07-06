// Variables
let groceryList = []; // Items in database
let groceryItems = []; // Scanned Items
let sortedItems = [];
let creditTs;

// Initialization of App
showLoading("Loading Data");
fetchGet('/api/general_shop/get', (dat) => {
  if (dat.success) {
    hideLoading();
    groceryList = dat.data;
    groceryList.sort((a, b) => a.item.localeCompare(b.item))
    updateGroceryDropdown();
  } else {
    document.write("Error 500: " + dat.error);
  }
});
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

// General Shop billing
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
              fetchPost("/api/general_shop/add", uploadItem, function (data) {
                hideLoading();
                if (data.success) {
                  groceryList.push(uploadItem);
                  updateGroceryDropdown();
                  setScreen("groceryScrn", 1);
                  document.getElementById("groceryCode").value = uploadItem.id;
                  document.getElementById("groceryItems").value = "";
                  document.getElementById("groceryQuantity").value = "";
                  document.getElementById("groceryQuantity").focus();
                } else {
                  showSnackbar("An error has occured. " + data.error, 1500);
                }
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
      uploadData.push({ ts: ts, item: i.item, quantity: i.quantity, total: i.total, source: "general_shop", payment: document.getElementById("groceryPayment").value });
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
      fetchPost("/api/sales/add", uploadData, function () {
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
    fetchPost("/api/credits/add", {salesRec, creditData}, (data) => {
      hideLoading();
      if (data.success) {
        document.getElementById("creditCidNumber").value = "";
        document.getElementById("creditPhoneNumber").value = "";
        document.getElementById("creditName").value = "";
        document.getElementById("creditAmount").value = "";
        resetGroceryForm();
        setScreen("groceryScrn", 1);
      } else {
        showSnackbar(data.error);
      }
    })
  } else {
    showSnackbar("Please fill up all required fields");
  }
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
    fetchPost("/api/addGroceryItem", uploadItem, function () { // To Update
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
