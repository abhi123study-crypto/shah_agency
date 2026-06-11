const retailerForm = document.getElementById('add-retailer-form');
const retailerList = document.getElementById('retailer-list');
const submitBtn = document.getElementById('submit-retailer-btn');

let allRetailers = [];

// 1. Database se Retailers nikalo
async function fetchRetailers() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/retailers');
        allRetailers = await response.json();
        renderRetailerTable(allRetailers);
    } catch (error) {
        console.error("Error fetching retailers:", error);
    }
}

// 2. Table mein Retailers show karo
function renderRetailerTable(retailers) {
    retailerList.innerHTML = ''; 
    retailers.forEach(item => {
        // Pending balance red/green logic
        let balanceStyle = item.pending_balance > 0 ? 'color: red; font-weight: bold;' : 'color: green; font-weight: bold;';
        
        retailerList.innerHTML += `<tr>
            <td style="font-weight: 600;">${item.shop_name}</td>
            <td>${item.owner_name}</td>
            <td>${item.phone}</td>
            <td style="${balanceStyle}">₹ ${item.pending_balance || 0}</td>
        </tr>`;
    });
}

// 3. Naya Retailer Save karo
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
            fetchRetailers(); // List refresh
            alert("Retailer mast save ho gaya bhai!");
        } else {
            // Yahan Asli Error dikhega
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

// Page load hote hi data le aao
fetchRetailers();