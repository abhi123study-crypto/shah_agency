// frontend/js/dashboard.js

async function loadDashboardStats() {
    try {
        console.log("Fetching dashboard data...");
        
        // 1. STOCK VALUE CALCULATE KARNA
        const prodResponse = await fetch('https://shah-agency-here.onrender.com/api/products');
        if (prodResponse.ok) {
            const products = await prodResponse.json();
            let totalStockValue = 0;
            
            products.forEach(item => {
                totalStockValue += (parseFloat(item.price) * parseInt(item.stock));
            });

            document.getElementById('stock-value-display').innerText = 
                '₹ ' + totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // 2. MARKET UDHAAR CALCULATE KARNA
        const retResponse = await fetch('https://shah-agency-here.onrender.com/api/retailers');
        if (retResponse.ok) {
            const retailers = await retResponse.json();
            let totalUdhaar = 0;
            
            retailers.forEach(shop => {
                totalUdhaar += parseFloat(shop.pending_balance || 0);
            });

            document.getElementById('udhaar-value-display').innerText = 
                '₹ ' + totalUdhaar.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

    } catch (error) {
        console.error("Dashboard Data fetch error:", error);
    }
}

loadDashboardStats();