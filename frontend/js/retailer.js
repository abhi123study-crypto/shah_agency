// frontend/js/retailer.js

const retailerForm = document.getElementById('add-retailer-form');
const retailerList = document.getElementById('retailer-list');
// Yeh naye variables hain payment box ke liye
const paymentForm = document.getElementById('payment-form');
const payRetailerSelect = document.getElementById('pay-retailer');

// 1. Database se saare retailers mangwana
async function fetchRetailers() {
    try {
        const response = await fetch('http://localhost:5000/api/retailers');
        const retailers = await response.json();
        
        updateRetailerTable(retailers);
        updatePaymentDropdown(retailers); // Yeh function tera dropdown bharega!
    } catch (error) {
        console.error("Error fetching retailers:", error);
    }
}

// 2. Table Update karna
function updateRetailerTable(retailers) {
    retailerList.innerHTML = ''; 
    for (let i = 0; i < retailers.length; i++) {
        let r = retailers[i];
        let row = `<tr>
            <td>${r.shop_name}</td>
            <td>${r.owner_name}</td>
            <td>${r.phone}</td>
            <td style="color: #e74c3c; font-weight: bold;">₹ ${r.pending_balance}</td>
        </tr>`;
        retailerList.innerHTML += row;
    }
}

// 3. Payment Dropdown Update karna (Yahi data daalega)
function updatePaymentDropdown(retailers) {
    // Pehle purana data saaf karo
    payRetailerSelect.innerHTML = '<option value="">-- Choose Shop --</option>';
    
    // Loop chalakar saare dukaandaron ka naam list mein daalo
    for (let i = 0; i < retailers.length; i++) {
        payRetailerSelect.innerHTML += `<option value="${retailers[i].id}">${retailers[i].shop_name} (Pending: ₹${retailers[i].pending_balance})</option>`;
    }
}

// 4. Naya retailer Save karna
retailerForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const newRetailer = {
        shopName: document.getElementById('r-shop').value,
        ownerName: document.getElementById('r-owner').value,
        phone: document.getElementById('r-phone').value,
        address: document.getElementById('r-address').value,
        gst: document.getElementById('r-gst').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/retailers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRetailer)
        });

        if (response.ok) {
            retailerForm.reset();
            fetchRetailers(); 
        } else {
            alert("Error saving retailer!");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// 5. Payment Receive karna aur Udhaar kam karna
paymentForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const selectedRetailerId = document.getElementById('pay-retailer').value;
    const amountReceived = parseFloat(document.getElementById('pay-amount').value);

    if (selectedRetailerId === "") {
        alert("Please select a shop first!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/retailers/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                retailerId: selectedRetailerId,
                amount: amountReceived
            })
        });

        if (response.ok) {
            alert(`✅ Payment of ₹${amountReceived} received successfully!`);
            paymentForm.reset();
            fetchRetailers(); // Data update hone ke baad Table aur Dropdown wapas fresh karna
        } else {
            alert("Error updating payment!");
        }
    } catch (error) {
        console.error("Payment error:", error);
    }
});

// Page khulte hi sabse pehle fetchRetailers() chalu karna
fetchRetailers();