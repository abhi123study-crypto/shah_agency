// frontend/js/godown.js

const productForm = document.getElementById('add-product-form');
const productList = document.getElementById('product-list');

const categorySelect = document.getElementById('p-category');
const customCategoryInput = document.getElementById('custom-category');

// 1. MAGIC: Dropdown change hone par Custom Box ko dikhana ya chhupana
categorySelect.addEventListener('change', function() {
    if (this.value === 'Other') {
        customCategoryInput.style.display = 'block'; 
        customCategoryInput.required = true; 
    } else {
        customCategoryInput.style.display = 'none'; 
        customCategoryInput.required = false; 
        customCategoryInput.value = ''; 
    }
});

// Default categories jo hamesha dropdown mein rahengi
const defaultCategories = [
    "Bakery & Biscuits",
    "Snacks & Chips",
    "Beverages / Cold Drinks",
    "Personal Care / Soaps",
    "Packaged Foods"
];

// NAYA FUNCTION: Database se categories nikal kar Dropdown mein dalna
function updateCategoryDropdown(products) {
    // Database mein jo bhi purani categories hain unko nikalna
    const dbCategories = [];
    for(let i = 0; i < products.length; i++) {
        dbCategories.push(products[i].category);
    }
    
    // Default aur Database wali categories ko milana, aur Set() ka use karke duplicates hatana
    const uniqueCategories = [...new Set([...defaultCategories, ...dbCategories])];

    // Dropdown ko naye options ke sath dobara banana
    let optionsHTML = '<option value="">-- Select Type --</option>';
    for(let i = 0; i < uniqueCategories.length; i++) {
        optionsHTML += `<option value="${uniqueCategories[i]}">${uniqueCategories[i]}</option>`;
    }
    // Aakhri mein Other wala option jod do
    optionsHTML += '<option value="Other">Other (Add Custom Category)...</option>';

    // Naya dropdown HTML mein set kar do
    categorySelect.innerHTML = optionsHTML;
}

// Ensure this variable exists globally in your godown.js
let allProducts = []; 

// 1. Updated fetch function to store products in the global variable
async function fetchProducts() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/products');
        allProducts = await response.json(); 
        renderTable(allProducts); // Use renderTable instead of updateTable
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// 2. Dedicated render function
function renderTable(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; 

    products.forEach(item => {
        productList.innerHTML += `<tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td><span style="background-color: #f1f1f1; padding: 2px 8px; border-radius: 2px; font-size: 0.8rem;">${item.category}</span></td>
            <td>₹ ${item.price}</td>
            <td style="font-weight: 600;">${item.stock}</td>
        </tr>`;
    });
}

// 3. Search Event Listener
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredProducts = allProducts.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.sku.toLowerCase().includes(searchTerm) ||
               product.category.toLowerCase().includes(searchTerm);
    });
    
    renderTable(filteredProducts);
});

// 4. Naya product Database mein save karna
productForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    let finalCategory = categorySelect.value;
    if (finalCategory === 'Other') {
        finalCategory = customCategoryInput.value; 
    }

   const newProduct = {
        name: document.getElementById('p-name').value,
        category: finalCategory, 
        price: parseFloat(document.getElementById('product-price').value), // Debugging line
        stock: parseInt(document.getElementById('p-stock').value),    // Yahan parseInt lagaya
        sku: document.getElementById('p-sku').value,
        gstRate: parseFloat(document.getElementById('p-gst-rate').value) // Yahan parseFloat lagaya
    };

    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct) 
        });

        if (response.ok) {
            productForm.reset();
            customCategoryInput.style.display = 'none';
            customCategoryInput.required = false;
            fetchProducts(); // Yeh function wapas chalega toh dropdown mein nayi category update ho jayegi!
        } else {
            alert("Error saving product.");
        }
    } catch (error) {
        console.error("Error saving data:", error);
    }
});

fetchProducts();