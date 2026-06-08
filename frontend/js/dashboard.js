// frontend/js/dashboard.js

async function loadDashboard() {
    try {
        console.log("Fetching dashboard data..."); // Check karne ke liye
        const response = await fetch('http://localhost:5000/api/dashboard');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data Received:", data); // Console mein data check karne ke liye

        // 1. Stats Cards
        document.getElementById('dash-value').innerText = `₹ ${data.totalValue.toLocaleString('en-IN')}`;
        document.getElementById('dash-udhaar').innerText = `₹ ${data.totalUdhaar.toLocaleString('en-IN')}`;
        document.getElementById('dash-cash').innerText = `₹ ${data.totalCashReceived.toLocaleString('en-IN')}`;

        // 2. Low Stock Alerts
        const alertContent = document.getElementById('low-stock-content');
        if (data.lowStock && data.lowStock.length > 0) {
            alertContent.innerHTML = data.lowStock.map(i => `
                <p style="color: #c0392b; font-weight: bold; margin-bottom: 5px;">⚠ ${i.name}: Only ${i.stock} left!</p>
            `).join('');
        } else {
            alertContent.innerHTML = '<p>No critical stock alerts.</p>';
        }

        // 3. Inventory List
        const pList = document.getElementById('product-master-list');
        pList.innerHTML = data.products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td style="font-weight:bold;">${p.stock}</td>
            </tr>
        `).join('');

        // 4. Retailer Ledger
        const rList = document.getElementById('retailer-master-list');
        rList.innerHTML = data.retailers.map(r => `
            <tr>
                <td>${r.shop_name}</td>
                <td style="color:red; font-weight:bold;">₹${r.pending_balance.toLocaleString('en-IN')}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        alert("Dashboard data load nahi ho pa raha hai! Console check karo.");
    }
}

// Page load hote hi chalayein
loadDashboard();