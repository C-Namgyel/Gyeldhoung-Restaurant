// Variables
let creditList = [];

// Functions
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
      fetch(api(`/api/credits/get-details?ts=${item.ts.toString()}`)).then(res => res.json())
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
        document.getElementById("payment").classList.remove("hidden");
        document.getElementById("creditSubmitBtn").onclick = function () {
          const selectedMode = document.querySelector('input[name="creditMode"]:checked').value;
          document.getElementById("payment").classList.add("hidden")
          showLoading("Updating Credit...");
          fetch(api('/api/credits/update'), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'key': 'gyeldhoung'
            },
            body: JSON.stringify({ ts: item.ts.toString(), payment: selectedMode, newTs: new Date().getTime() })
          }).then(res => res.json()).then(data => {
            hideLoading();
            if (data.success) {
              creditList = creditList.filter(i => i.id != item.id);
              loadCreditList(creditList);
            } else {
              console.error(data.error);
              showSnackbar(data.error);
            }
          })
        };

        document.getElementById("creditCancelBtn").onclick = function () {
          document.getElementById("payment").classList.add("hidden");
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

fetchGet('/api/credits/get', (dat) => {
  loadCreditList(dat.data);
  creditList = dat.data;
});