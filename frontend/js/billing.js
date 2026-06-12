const billForm = document.getElementById('add-to-bill-form');
const invoiceList = document.getElementById('invoice-list');
const grandTotalEl = document.getElementById('grand-total');
const retailerSelect = document.getElementById('bill-retailer');
const productSelect = document.getElementById('bill-product');
const priceInput = document.getElementById('bill-price');

let currentBillItems = [];
let allProducts = [];
let allRetailers = []; 
let grandTotal = 0;

// 1. Fetch Retailers
async function fetchRetailersForBill() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/retailers');
        allRetailers = await response.json();
        retailerSelect.innerHTML = '<option value="">-- Choose Shop --</option>'; 
        allRetailers.forEach(r => {
            retailerSelect.innerHTML += `<option value="${r.id}" data-phone="${r.phone || 'N/A'}" data-address="${r.address || 'N/A'}">${r.shop_name} (${r.owner_name})</option>`;
        });
    } catch (error) {
        console.error("Error fetching retailers:", error);
    }
}

// 2. Fetch Products
async function fetchProductsForBill() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/products');
        allProducts = await response.json();
        productSelect.innerHTML = '<option value="">-- Choose Product --</option>'; 
        allProducts.forEach(p => {
            productSelect.innerHTML += `<option value="${p.sku}">${p.name} (Stock: ${p.stock})</option>`;
        });
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// 3. Auto-fill Price
productSelect.addEventListener('change', function() {
    const selectedSku = this.value;
    const product = allProducts.find(p => p.sku === selectedSku);
    if (product) {
        priceInput.value = product.price; 
    } else {
        priceInput.value = '';
    }
});

// 4. ADD TO BILL LOGIC
billForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const selectedProductSku = productSelect.value;
    const product = allProducts.find(p => p.sku === selectedProductSku);
    
    const price = parseFloat(document.getElementById('bill-price').value);
    const qty = parseFloat(document.getElementById('bill-qty').value);
    
    if (!product) { 
        alert("Please select a product first!"); 
        return; 
    }

    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
        alert("Please enter a valid price and quantity!");
        return;
    }

    const total = price * qty;
    const item = {
        sku: product.sku,
        name: product.name,
        hsn: "85171300", 
        price: price,
        qty: qty,
        total: total
    };

    currentBillItems.push(item);
    renderInvoice();
    
    productSelect.value = '';
    document.getElementById('bill-price').value = '';
    document.getElementById('bill-qty').value = '';
});

// 5. Render Screen Table
function renderInvoice() {
    invoiceList.innerHTML = '';
    grandTotal = 0;

    currentBillItems.forEach((item, index) => {
        grandTotal += item.total;
        invoiceList.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>₹ ${item.price.toFixed(2)}</td>
                <td>${item.qty}</td>
                <td style="font-weight: bold;">₹ ${item.total.toFixed(2)}</td>
                <td><button type="button" onclick="removeItem(${index})" style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 3px;">X</button></td>
            </tr>
        `;
    });
    grandTotalEl.innerText = grandTotal.toFixed(2);
}

// 6. Remove Item
window.removeItem = function(index) {
    currentBillItems.splice(index, 1);
    renderInvoice();
};

// Number to Words Converter
function convertNumberToWords(amount) {
    return "INR " + amount.toFixed(2) + " Only"; 
}

// ==========================================
// 7. COMPLETE ORDER & PRINT LOGIC 
// ==========================================
// ==========================================
// 7. COMPLETE ORDER & PRINT LOGIC (DEBUG MODE)
// ==========================================
document.getElementById('complete-order-btn').addEventListener('click', function() {
    
    if (currentBillItems.length === 0) {
        alert("Bhai, pehle bill mein koi item toh add kar!");
        return;
    }

    if (!retailerSelect.value) {
        alert("Kripya pehle Retailer select karein!");
        return;
    }

    try {
        const selectedOption = retailerSelect.options[retailerSelect.selectedIndex];
        
        // Agar HTML mein yeh IDs nahi milengi toh sidha error aayega
        document.getElementById('pr-buyer-name').innerText = selectedOption.text.split(' (')[0] || 'Cash Counter';
        document.getElementById('pr-buyer-phone').innerText = selectedOption.getAttribute('data-phone') || '';
        document.getElementById('pr-buyer-address').innerText = selectedOption.getAttribute('data-address') || '';
        
        const today = new Date();
        document.getElementById('pr-date').innerText = today.toLocaleDateString('en-GB');
        document.getElementById('pr-inv-no').innerText = "INV-" + Math.floor(Math.random() * 10000);

        const prItemsBody = document.getElementById('pr-items-body');
        prItemsBody.innerHTML = '';
        let totalQty = 0;

        currentBillItems.forEach((item, index) => {
            totalQty += item.qty;
            prItemsBody.innerHTML += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><b>${item.name}</b></td>
                    <td class="text-center">${item.hsn}</td>
                    <td class="text-center">${item.qty} pcs</td>
                    <td class="text-right">${item.price.toFixed(2)}</td>
                    <td class="text-center">pcs</td>
                    <td class="text-right">${item.total.toFixed(2)}</td>
                </tr>
            `;
        });

        // Blank rows for full page Tally style
        prItemsBody.innerHTML += `
            <tr style="height: 150px;">
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
                <td style="border-bottom:none; border-top:none;"></td>
            </tr>
        `;

        document.getElementById('pr-total-qty').innerText = totalQty + " pcs";
        document.getElementById('pr-total-amount').innerText = "₹ " + grandTotal.toFixed(2);
        document.getElementById('pr-amount-words').innerText = convertNumberToWords(grandTotal);

        window.print();

        currentBillItems = [];
        renderInvoice();
        retailerSelect.value = ''; 
        alert("Order Successful! Bill generate ho gaya.");
        
    } catch (err) {
        console.error("Print Error:", err);
        // YAHAN ASLI ERROR DIKHEGA!
        alert("Bhai, HTML mein gadbad hai! Exact Error: \n" + err.message);
    }
});

fetchRetailersForBill();
fetchProductsForBill();