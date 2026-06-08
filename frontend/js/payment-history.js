// frontend/js/payment-history.js

const ledgerView = document.getElementById('ledger-view');
const shopWiseView = document.getElementById('shop-wise-view');
const ledgerList = document.getElementById('ledger-list');
const btnLedger = document.getElementById('btn-ledger');
const btnShop = document.getElementById('btn-shop');

let allPayments = []; // Data ko global save karenge taaki baar baar fetch na karna pade

async function loadHistory() {
    try {
        const response = await fetch('http://localhost:5000/api/payment-history');
        allPayments = await response.json();

        // Data aate hi dono views generate kar do
        renderLedgerView();
        renderShopWiseView();
    } catch (error) {
        console.error("History load error:", error);
    }
}

// FORMAT 1: Bank Statement / Ledger View
function renderLedgerView() {
    ledgerList.innerHTML = '';
    let grandTotal = 0;

    if(allPayments.length === 0) {
        ledgerList.innerHTML = '<tr><td colspan="4" style="text-align:center;">Abhi tak koi payment receive nahi hui hai.</td></tr>';
        return;
    }

    for(let i = 0; i < allPayments.length; i++) {
        let p = allPayments[i];
        let dateObj = new Date(p.payment_date);
        let fDate = dateObj.toLocaleDateString('en-IN');
        let fTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        grandTotal += parseFloat(p.amount);

        let row = `<tr>
            <td style="font-weight: bold;">${fDate}</td>
            <td>${fTime}</td>
            <td>${p.shop_name} <span style="font-size: 12px; color: #7f8c8d;">(${p.owner_name})</span></td>
            <td style="color: #27ae60; font-weight: bold; text-align: right;">+ ₹ ${p.amount}</td>
        </tr>`;
        
        ledgerList.innerHTML += row;
    }
    
    // Niche Grand Total set karna
    document.getElementById('grand-total-ledger').innerText = `₹ ${grandTotal.toFixed(2)}`;
}

// FORMAT 2: Shop-wise View
function renderShopWiseView() {
    shopWiseView.innerHTML = '';
    
    if(allPayments.length === 0) {
        shopWiseView.innerHTML = '<h3>Abhi tak koi payment receive nahi hui hai.</h3>';
        return;
    }

    const groupedData = {};
    
    for(let i = 0; i < allPayments.length; i++) {
        let p = allPayments[i];
        let shopName = p.shop_name;

        if (!groupedData[shopName]) {
            groupedData[shopName] = { owner: p.owner_name, payments: [] };
        }
        groupedData[shopName].payments.push(p);
    }

    for (const shop in groupedData) {
        const shopInfo = groupedData[shop];
        let totalShopCollection = 0;

        let shopHTML = `
        <div class="box-card" style="margin-bottom: 30px; border-left: 5px solid #2980b9;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">🏪 ${shop} <span style="font-size: 14px; color: #7f8c8d;">(${shopInfo.owner})</span></h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th style="text-align: right;">Amount Received</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for(let j = 0; j < shopInfo.payments.length; j++) {
            let p = shopInfo.payments[j];
            let dateObj = new Date(p.payment_date);
            let fDate = dateObj.toLocaleDateString('en-IN');
            let fTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            totalShopCollection += parseFloat(p.amount);

            shopHTML += `
                    <tr>
                        <td style="font-weight: bold;">${fDate}</td>
                        <td>${fTime}</td>
                        <td style="color: #27ae60; font-weight: bold; text-align: right;">+ ₹ ${p.amount}</td>
                    </tr>
            `;
        }

        shopHTML += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f2f6;">
                        <td colspan="2" style="text-align: right; font-weight: bold; color: #2c3e50;">Total Collected from ${shop}:</td>
                        <td style="color: #27ae60; font-weight: 900; font-size: 16px; text-align: right;">₹ ${totalShopCollection.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        `;

        shopWiseView.innerHTML += shopHTML;
    }
}

// 3. Buttons dabane par View change karne ka Function
function showView(viewType) {
    if(viewType === 'ledger') {
        // Ledger on, Shop-wise off
        ledgerView.style.display = 'block';
        shopWiseView.style.display = 'none';
        // Buttons ka color change (Active button dark)
        btnLedger.style.backgroundColor = '#2c3e50'; 
        btnShop.style.backgroundColor = '#7f8c8d';   
    } else {
        // Shop-wise on, Ledger off
        ledgerView.style.display = 'none';
        shopWiseView.style.display = 'block';
        // Buttons ka color change
        btnLedger.style.backgroundColor = '#7f8c8d';
        btnShop.style.backgroundColor = '#2c3e50';
    }
}

// Page load hote hi API call marna
loadHistory();