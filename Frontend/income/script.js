// Variables
let dat;

// Functions
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
    fetch(api(`/api/sales/get?start=${startOfDay.toString()}&end=${endOfDay.toString()}`))
    .then(res => res.json())
    .then(fin => {
      if (fin.success) {
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
            showLoading("Deleting...");
            let ids = "";
            
            ids = deleteArray.map(d => d.id).join(",");
            console.log(ids);
            fetchDelete("/api/sales/delete", ids, (dat) => {
              hideLoading();
              document.getElementById("incomeBtn").click();
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
      } else {
        alert("An unknown error occured.")
      }
    });
  } else {
    showSnackbar("Please enter a valid date");
  }
}