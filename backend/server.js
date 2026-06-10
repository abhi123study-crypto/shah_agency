require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection - Using single Pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log("Database connection SUCCESSFUL!"))
    .catch((err) => console.error("Database connection error:", err.stack));

// ==========================================
// API ROUTES
// ==========================================

// 1. Product Save/Update
app.post('/api/products', async (req, res) => {
    try {
        const { sku, name, category, price, stock } = req.body;
        const upsertQuery = `
            INSERT INTO products (sku, name, category, price, stock) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (sku) 
            DO UPDATE SET 
                stock = products.stock + EXCLUDED.stock,
                price = EXCLUDED.price,
                name = EXCLUDED.name,
                category = EXCLUDED.category
            RETURNING *
        `;
        const newProduct = await pool.query(upsertQuery, [sku, name, category, price, stock]);
        res.json(newProduct.rows[0]); 
    } catch (err) {
        console.error("Error saving/updating product:", err.message);
        res.status(500).send("Server Error");
    }
});

// 2. Get Products
app.get('/api/products', async (req, res) => {
    try {
        const allProducts = await pool.query("SELECT * FROM products ORDER BY id DESC");
        res.json(allProducts.rows);
    } catch (err) {
        console.error("Error fetching products:", err.message);
        res.status(500).send("Server Error");
    }
});

// 3. Save Retailer
app.post('/api/retailers', async (req, res) => {
    try {
        const { shopName, ownerName, phone, address, gst } = req.body;
        const newRetailer = await pool.query(
            "INSERT INTO retailers (shop_name, owner_name, phone, address, gst) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [shopName, ownerName, phone, address, gst]
        );
        res.json(newRetailer.rows[0]); 
    } catch (err) {
        console.error("Error saving retailer:", err.message);
        res.status(500).send("Server Error");
    }
});

// 4. Get Retailers
app.get('/api/retailers', async (req, res) => {
    try {
        const allRetailers = await pool.query("SELECT * FROM retailers ORDER BY id DESC");
        res.json(allRetailers.rows);
    } catch (err) {
        console.error("Error fetching retailers:", err.message);
        res.status(500).send("Server Error");
    }
});

// 5. Orders API
app.post('/api/orders', async (req, res) => {
    const { retailerId, grandTotal, billItems } = req.body;
    try {
        await pool.query("UPDATE retailers SET pending_balance = pending_balance + $1 WHERE id = $2", [grandTotal, retailerId]);
        for (let item of billItems) {
            await pool.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.qty, item.productId]);
        }
        res.json({ message: "Order Successful!" });
    } catch (err) {
        console.error("Error processing order:", err.message);
        res.status(500).send("Server Error");
    }
});

// 6. Dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        const udhaar = await pool.query("SELECT SUM(pending_balance) as total_udhaar FROM retailers");
        const stock = await pool.query("SELECT SUM(price * stock) as total_value FROM products");
        const cash = await pool.query("SELECT SUM(amount) as total_received FROM payment_history");
        const allProducts = await pool.query("SELECT name, stock, category FROM products ORDER BY stock ASC");
        const allRetailers = await pool.query("SELECT shop_name, pending_balance FROM retailers ORDER BY pending_balance DESC");
        const lowStock = await pool.query("SELECT name, stock FROM products WHERE stock < 10 LIMIT 5");

        res.json({
            totalUdhaar: parseFloat(udhaar.rows[0].total_udhaar || 0),
            totalValue: parseFloat(stock.rows[0].total_value || 0),
            totalCashReceived: parseFloat(cash.rows[0].total_received || 0),
            products: allProducts.rows,
            retailers: allRetailers.rows,
            lowStock: lowStock.rows
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// 7. Payment API
app.post('/api/retailers/pay', async (req, res) => {
    const { retailerId, amount } = req.body;
    try {
        await pool.query("UPDATE retailers SET pending_balance = pending_balance - $1 WHERE id = $2", [amount, retailerId]);
        await pool.query("INSERT INTO payment_history (retailer_id, amount) VALUES ($1, $2)", [retailerId, amount]);
        res.json({ message: "Payment Successful!" });
    } catch (err) {
        console.error("Payment Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// 8. History API
app.get('/api/payment-history', async (req, res) => {
    try {
        const history = await pool.query(`
            SELECT p.id, p.amount, p.payment_date, r.shop_name, r.owner_name
            FROM payment_history p
            JOIN retailers r ON p.retailer_id = r.id
            ORDER BY p.payment_date DESC
        `);
        res.json(history.rows);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// Admin Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Yahan tu multiple users aur unke passwords set kar sakta hai
    const validUsers = {
        "abhishek": "shahadmin123",  // Tera main login
        "staff": "staff123"          // Kisi aur ko access dene ke liye
    };

    if (validUsers[username] && validUsers[username] === password) {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.status(401).json({ success: false, message: "Galat Username ya Password!" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});