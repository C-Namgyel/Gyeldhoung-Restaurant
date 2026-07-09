let groceryList = [];
// Grocery Item List
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
        fetchPut("/api/inventory/update", parseInt(item.id), updatedItem, function (dat) {
          if (dat.success) {
            hideLoading();
            document.getElementById("groceryItemCode").disabled = false;
            document.getElementById("groceryGenerateBtn").disabled = false;
            init();
          } else {
            alert("An error occured")
          }
        });
      }
      setScreen("groceryListEditScrn", 1);
    };
    deleteBtn.onclick = function () {
      if (confirm("Are you sure you want to delete this item?")) {
        showLoading("Deleting Item...");
        fetchDelete("/api/inventory/delete", item.id, (dat) => {
          console.log(dat)
          if (dat.success) {
            hideLoading();
            showSnackbar("Item deleted");
            init();
          } else {
            alert("An error occured");
          }
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
  document.getElementById("groceryGenerateBtn").disabled = false;
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
    fetchPost("/api/inventory/add", uploadItem, function () {
      hideLoading();
      document.getElementById("groceryItemCode").value = "";
      document.getElementById("groceryItemName").value = "";
      document.getElementById("groceryItemRate").value = "";
      document.getElementById("groceryItemCode").focus();
      init();
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
showLoading("Loading");
function init() {
  fetchGet("/api/inventory/get", (dat) => {
    hideLoading();
    if (dat.success) {
      groceryList = dat.data;
      groceryList.sort((a, b) => a.item.localeCompare(b.item));
      document.getElementById('grocerySearchInput').value='';
      setScreen('groceryListScrn');
      loadGroceryTable(groceryList);
    } else {
      alert("Failed");
    }
  })
}
init();