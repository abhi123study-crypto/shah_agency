const retailerForm = document.getElementById('add-retailer-form');
const retailerList = document.getElementById('retailer-list');
const submitBtn = document.getElementById('submit-retailer-btn');
const payRetailerSelect = document.getElementById('pay-retailer-select');
const updatePaymentBtn = document.getElementById('update-payment-btn'); // Naya Button Pakda

let allRetailers = [];

// 1. Fetch Retailers
async function fetchRetailers() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/retailers');
        allRetailers = await response.json();
        
        renderRetailerTable(allRetailers);
        populateDropdown(allRetailers); 
        
    } catch (error) {
        console.error("Error fetching retailers:", error);
    }
}

// 2. Render Table
function renderRetailerTable(retailers) {
    retailerList.innerHTML = ''; 
    retailers.forEach(item => {
        let balanceStyle = item.pending_balance > 0 ? 'color: red; font-weight: bold;' : 'color: green; font-weight: bold;';
        
        retailerList.innerHTML += `<tr>
            <td style="font-weight: 600;">${item.shop_name}</td>
            <td>${item.owner_name}</td>
            <td>${item.phone}</td>
            <td style="${balanceStyle}">₹ ${item.pending_balance || 0}</td>
        </tr>`;
    });
}

// 3. Populate Dropdown
function populateDropdown(retailers) {
    payRetailerSelect.innerHTML = '<option value="">-- Choose Shop --</option>'; 
    retailers.forEach(r => {
        payRetailerSelect.innerHTML += `<option value="${r.id}">${r.shop_name} (${r.owner_name})</option>`;
    });
}

// 4. Add New Retailer
retailerForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const newRetailer = {
        shopName: document.getElementById('r-shop-name').value,
        ownerName: document.getElementById('r-owner-name').value,
        phone: document.getElementById('r-phone').value,
        address: document.getElementById('r-address').value,
        gstPin: document.getElementById('r-gst').value
    };

    try {
        submitBtn.innerText = "Saving...";
        
        const response = await fetch('https://shah-agency-here.onrender.com/api/retailers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRetailer) 
        });

        if (response.ok) {
            retailerForm.reset();
            submitBtn.innerText = "Save Retailer";
            fetchRetailers(); 
            alert("Retailer mast save ho gaya!");
        } else {
            const errorText = await response.text();
            alert("Backend Error: " + errorText);
            submitBtn.innerText = "Save Retailer";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server connection failed!");
        submitBtn.innerText = "Save Retailer";
    }
});

// ==========================================
// 5. UPDATE PAYMENT LOGIC (YEH NAYA HAI)
// ==========================================
updatePaymentBtn.addEventListener('click', async function() {
    const retailerId = payRetailerSelect.value;
    const amountStr = document.getElementById('pay-amount').value;
    const amount = parseFloat(amountStr);

    if (!retailerId) {
        alert("Bhai, pehle dukaan (Retailer) toh select kar!");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert("Sahi amount daal bhai!");
        return;
    }

    try {
        updatePaymentBtn.innerText = "Updating...";
        
        // Backend ke naye API pe data bhej rahe hain
        const response = await fetch(`https://shah-agency-here.onrender.com/api/retailers/${retailerId}/pay`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount }) 
        });

        if (response.ok) {
            document.getElementById('pay-amount').value = '';
            payRetailerSelect.value = '';
            updatePaymentBtn.innerText = "Update Payment";
            
            fetchRetailers(); // Isse Table aur Dropdown dono taaza ho jayenge
            alert("Payment Update ho gayi bhai! Balance minus kar diya gaya hai.");
        } else {
            const errorText = await response.text();
            alert("Backend Error: " + errorText);
            updatePaymentBtn.innerText = "Update Payment";
        }
    } catch (error) {
        console.error("Payment Error:", error);
        alert("Server connection failed!");
        updatePaymentBtn.innerText = "Update Payment";
    }
});

// Page khulte hi data le aao
fetchRetailers();