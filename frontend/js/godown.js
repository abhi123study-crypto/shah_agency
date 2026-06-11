const productForm = document.getElementById('add-product-form');
const productList = document.getElementById('product-list');
const categorySelect = document.getElementById('p-category');
const customCategoryInput = document.getElementById('custom-category');
const submitBtn = document.getElementById('submit-btn'); 

let allProducts = []; 

const defaultCategories = [
    "Bakery & Biscuits", "Snacks & Chips", "Beverages / Cold Drinks", 
    "Personal Care / Soaps", "Packaged Foods"
];

// Custom Category Logic
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

// Fetch Data from Server
async function fetchProducts() {
    try {
        const response = await fetch('https://shah-agency-here.onrender.com/api/products');
        allProducts = await response.json(); 
        renderTable(allProducts); 
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Render Table with EDIT Button
function renderTable(products) {
    productList.innerHTML = ''; 
    products.forEach(item => {
        productList.innerHTML += `<tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td><span style="background-color: #f1f1f1; padding: 2px 8px; border-radius: 2px; font-size: 0.8rem;">${item.category}</span></td>
            <td>₹ ${item.price}</td>
            <td style="font-weight: 600;">${item.stock}</td>
            <td>
                <button onclick="editProduct('${item.sku}')" style="background-color: #ffc107; color: #000; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Edit</button>
            </td>
        </tr>`;
    });
}

// EDIT FUNCTION: Fill Form on Click
window.editProduct = function(sku) {
    const product = allProducts.find(p => p.sku === sku);
    if(!product) return;

    document.getElementById('p-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-sku').value = product.sku;
    document.getElementById('p-gst-rate').value = product.gstRate || product.gst_rate || 18;

    let optionExists = Array.from(categorySelect.options).some(opt => opt.value === product.category);
    if (optionExists) {
        categorySelect.value = product.category;
        customCategoryInput.style.display = 'none';
    } else {
        categorySelect.value = 'Other';
        customCategoryInput.style.display = 'block';
        customCategoryInput.value = product.category;
    }

    // Set Edit Mode
    document.getElementById('edit-mode-sku').value = product.sku;
    document.getElementById('p-sku').readOnly = true; 
    document.getElementById('p-sku').style.backgroundColor = '#e9ecef';
    submitBtn.innerText = "Update Product"; 
    submitBtn.style.backgroundColor = "#28a745"; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Search Filter
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.sku.toLowerCase().includes(searchTerm) ||
               product.category.toLowerCase().includes(searchTerm);
    });
    renderTable(filteredProducts);
});

// Save or Update Product
productForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    let finalCategory = categorySelect.value === 'Other' ? customCategoryInput.value : categorySelect.value;
    const editSku = document.getElementById('edit-mode-sku').value;

    const productData = {
        name: document.getElementById('p-name').value,
        category: finalCategory, 
        price: parseFloat(document.getElementById('product-price').value), 
        stock: parseInt(document.getElementById('p-stock').value),    
        sku: document.getElementById('p-sku').value,
        gstRate: parseFloat(document.getElementById('p-gst-rate').value) 
    };

    try {
        let url = 'https://shah-agency-here.onrender.com/api/products';
        let method = 'POST';

        // Agar editSku hai, toh UPDATE wali API pe bhejo
        if (editSku) {
            url = `https://shah-agency-here.onrender.com/api/products/${editSku}`;
            method = 'PUT';
        }

        submitBtn.innerText = "Processing...";

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData) 
        });

        if (response.ok) {
            productForm.reset();
            customCategoryInput.style.display = 'none';
            customCategoryInput.required = false;
            
            // Reset Edit Mode
            document.getElementById('edit-mode-sku').value = '';
            document.getElementById('p-sku').readOnly = false;
            document.getElementById('p-sku').style.backgroundColor = '#fff';
            submitBtn.innerText = "Save Product";
            submitBtn.style.backgroundColor = ""; 
            
            fetchProducts(); 
            alert(editSku ? "Product Updated Successfully!" : "New Product Saved!");
        } else {
            const errorText = await response.text();
            alert("Backend Error: " + errorText);
            submitBtn.innerText = editSku ? "Update Product" : "Save Product";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server connection failed!");
        submitBtn.innerText = editSku ? "Update Product" : "Save Product";
    }
});

fetchProducts();