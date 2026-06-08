// frontend/js/billing.js

let currentBill = [];
let grandTotalValue = 0;
let allProducts = []; // Database ke saare products yahan save rahenge taaki price auto-fill ho sake

const billForm = document.getElementById('add-to-bill-form');
const invoiceList = document.getElementById('invoice-list');
const grandTotalDisplay = document.getElementById('grand-total');

const retailerSelect = document.getElementById('bill-retailer');
const productSelect = document.getElementById('bill-product');
const priceInput = document.getElementById('bill-price');

// 1. Page khulte hi Database se Retailers aur Products mangwana
async function loadDropdowns() {
    try {
        // Dukaandaron (Retailers) ko mangwana
        const rResponse = await fetch('https://shah-agency-here.onrender.com/api/retailers');
        const retailers = await rResponse.json();
        
        retailerSelect.innerHTML = '<option value="">-- Choose Shop --</option>';
        for(let i = 0; i < retailers.length; i++) {
            // Dropdown mein database ka data daalna
            retailerSelect.innerHTML += `<option value="${retailers[i].id}">${retailers[i].shop_name} (${retailers[i].owner_name})</option>`;
        }

        // Products ko mangwana
        const pResponse = await fetch('https://shah-agency-here.onrender.com/api/products');
        allProducts = await pResponse.json();
        
        productSelect.innerHTML = '<option value="">-- Choose Item --</option>';
        for(let i = 0; i < allProducts.length; i++) {
            // Sirf wahi item dikhayenge jiska stock 0 se zyada hai
            if(allProducts[i].stock > 0) {
                productSelect.innerHTML += `<option value="${allProducts[i].id}">${allProducts[i].name} (Stock: ${allProducts[i].stock})</option>`;
            }
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// 2. MAGIC: Jaise hi tu product select karega, price apne aap bhar jayegi
productSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if(selectedId) {
        // allProducts list mein us product ko dhoondhna
        const selectedProduct = allProducts.find(p => p.id == selectedId);
        priceInput.value = selectedProduct.price; // Price auto-fill
    } else {
        priceInput.value = '';
    }
});

// 3. Bill mein item add karna
billForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const selectedProductId = document.getElementById('bill-product').value;
    const price = parseFloat(document.getElementById('bill-price').value);
    const qty = parseInt(document.getElementById('bill-qty').value);

    if (selectedProductId === "") {
        alert("Please select a product first!");
        return;
    }

    // Selected product ki poori detail nikalna
    const selectedProduct = allProducts.find(p => p.id == selectedProductId);

    // 🛑 Check karna ki godown mein utna stock hai ya nahi!
    if (qty > selectedProduct.stock) {
        alert(`Bhai, godown mein sirf ${selectedProduct.stock} item bache hain! Tu usse zyada nahi bech sakta.`);
        return;
    }

    const itemTotal = price * qty;

    const billItem = {
        productId: selectedProductId, // Backend mein stock kam karne ke liye id chahiye
        name: selectedProduct.name,
        price: price,
        qty: qty,
        total: itemTotal
    };

    currentBill.push(billItem);
    grandTotalValue += itemTotal;
    updateInvoiceTable();

    // Agle item ke liye form saaf karna
    document.getElementById('bill-product').value = "";
    document.getElementById('bill-price').value = "";
    document.getElementById('bill-qty').value = "";
});

function updateInvoiceTable() {
    invoiceList.innerHTML = '';
    for (let i = 0; i < currentBill.length; i++) {
        let item = currentBill[i];
        let row = `<tr>
            <td>${item.name}</td>
            <td>₹ ${item.price}</td>
            <td>${item.qty}</td>
            <td style="font-weight: bold;">₹ ${item.total}</td>
        </tr>`;
        invoiceList.innerHTML += row;
    }
    grandTotalDisplay.innerText = `₹ ${grandTotalValue}`;
}

// 4. Final 'Complete Order' Button (Baad mein yahan backend ka Order API jodenge)
// 4. Final 'Complete Order' Button jo Backend API ko order bhejega
document.getElementById('generate-bill-btn').addEventListener('click', async function() {
    if (currentBill.length === 0) {
        alert("Bill is empty! Koi item add kar pehle.");
        return;
    }
    
    const retailerId = retailerSelect.value;
    if (retailerId === "") {
        alert("Please select a Retailer first!");
        return;
    }
    
    // Order ka data jo hum API ko bhejenge
    const orderData = {
        retailerId: retailerId,
        grandTotal: grandTotalValue,
        billItems: currentBill
    };

    try {
        // Backend (API) ko order bhejna
        const response = await fetch('https://shah-agency-here.onrender.com/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // Bill banne ke baad Alert!
            alert(`✅ Bill Generated Successfully! Grand Total: ₹${grandTotalValue}`);

            // Dukaan ka pura text nikalna PDF ke liye
            const retailerText = retailerSelect.options[retailerSelect.selectedIndex].text;
            // PDF download ka function chalana
            downloadPDF(retailerText);

            // Bill clear kar dena naye grahak ke liye
            currentBill = [];
            grandTotalValue = 0;
            updateInvoiceTable();
            
            // Dropdowns wapas load karna taaki naya (kam hua) stock dikhe
            loadDropdowns(); 
            retailerSelect.value = "";
        } else {
            alert("Error generating bill!");
        }
    } catch (error) {
        console.error("Order error:", error);
    }
});

// Page load hote hi Dropdowns bharna
loadDropdowns();

// 5. PDF Invoice Banane ka function
// 5. PDF Invoice Banane ka PRO function
// 5. PRO GST TAX INVOICE GENERATOR (Like the photo)
// 5. PRO GST TAX INVOICE GENERATOR (Updated with simple columns)
function downloadPDF(retailerName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. HEADER
    doc.rect(10, 10, 190, 277); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("TAX INVOICE", 105, 18, null, null, "center");

    doc.setFontSize(20);
    doc.text("SHAH AGENCY", 105, 26, null, null, "center");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Doomdooma Town Tinsukia district, Assam", 105, 31, null, null, "center");
    doc.text("GSTIN: 18AAGFI8590M1ZL | State Code: 18 | Phone: +91 6901978812", 105, 36, null, null, "center");

    doc.line(10, 40, 200, 40);

    // 2. BUYER & INVOICE DETAILS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Billed To (Buyer):", 12, 45);
    doc.setFont("helvetica", "normal");
    doc.text(retailerName, 12, 51);
    doc.text("Jorhat, Assam", 12, 56);
    doc.text("State: Assam, Code: 18", 12, 61);

    doc.line(100, 40, 100, 65); 

    doc.setFont("helvetica", "bold");
    let randomInvoiceNo = "ID/" + Math.floor(Math.random() * 10000);
    doc.text(`Invoice No: ${randomInvoiceNo}`, 102, 45);
    doc.text(`Dated: ${new Date().toLocaleDateString()}`, 102, 51);
    doc.setFont("helvetica", "normal");
    doc.text("Place of Supply: Assam (18)", 102, 61);

    doc.line(10, 65, 200, 65);

    // 3. ITEMS TABLE (Clean 5 Columns)
    const tableColumn = ["S.No", "Description of Goods", "Qty", "Rate", "Amount"];
    const tableRows = [];
    
    for(let i=0; i<currentBill.length; i++) {
        let item = currentBill[i];
        let rowData = [
            i + 1, 
            item.name, 
            `${item.qty} pcs`, 
            item.price.toFixed(2), 
            item.total.toFixed(2)
        ];
        tableRows.push(rowData);
    }

    doc.autoTable({
        startY: 65,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid', 
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        margin: { left: 10, right: 10 }
    });

    let finalY = doc.lastAutoTable.finalY;

    // 4. TAX BREAKDOWN
    let taxableValue = grandTotalValue;
    let cgstAmount = (taxableValue * 0.09).toFixed(2);
    let sgstAmount = (taxableValue * 0.09).toFixed(2);
    let finalAmountWithTax = (parseFloat(taxableValue) + parseFloat(cgstAmount) + parseFloat(sgstAmount)).toFixed(2);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    doc.text("OUTPUT CGST @ 9%", 100, finalY + 8, null, null, "right");
    doc.text(cgstAmount, 190, finalY + 8, null, null, "right");
    
    doc.text("OUTPUT SGST @ 9%", 100, finalY + 14, null, null, "right");
    doc.text(sgstAmount, 190, finalY + 14, null, null, "right");

    doc.line(10, finalY + 18, 200, finalY + 18);

    doc.setFontSize(12);
    doc.text("Grand Total:", 100, finalY + 25, null, null, "right");
    doc.text(`Rs. ${finalAmountWithTax}`, 190, finalY + 25, null, null, "right");

    doc.line(10, finalY + 30, 200, finalY + 30);

    // 5. FOOTER
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Company's Bank Details:", 12, finalY + 36);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Name: ICICI Bank", 12, finalY + 41);
    doc.text("A/c No: 047305002771", 12, finalY + 46);
    doc.text("Branch & IFS Code: Jorhat & ICIC0000473", 12, finalY + 51);

    doc.line(130, finalY + 30, 130, 287); 

    doc.setFont("helvetica", "bold");
    doc.text("For SHAH AGENCY", 140, finalY + 36);
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", 145, 280);

    doc.save(`GST_Invoice_${retailerName}.pdf`);
}