// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const cors = require('cors');
app.use(cors());

app.use(cors());
app.use(express.json());

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

pool.connect()
    .then(() => console.log("🔥 Database se connection SUCCESSFUL!"))
    .catch((err) => console.error("❌ Database connection error:", err.stack));

// ==========================================
// 🚀 NAYE API ROUTES YAHAN SE SHURU HAIN
// ==========================================

// 1. Naya Product Save karne ka API (Godown form se aayega)
// 1. Product Save ya Update (Stock Plus) karne ka API
app.post('/api/products', async (req, res) => {
    try {
        const { sku, name, category, price, stock } = req.body;
        
        // MAGIC QUERY: Agar SKU takrayega (Conflict hoga), toh yeh stock ko plus (+) kar dega aur rate naya wala set kar dega!
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

// 2. Saare Products mangwane ka API (Godown table aur Billing mein dikhane ke liye)
app.get('/api/products', async (req, res) => {
    try {
        // Database se sab kuch nikalne ki SQL command
        const allProducts = await pool.query("SELECT * FROM products ORDER BY id DESC");
        
        // Frontend ko saara data bhej dena
        res.json(allProducts.rows);
    } catch (err) {
        console.error("Error fetching products:", err.message);
        res.status(500).send("Server Error");
    }
});
// 3. Naya Retailer (Dukaandar) Save karne ka API
app.post('/api/retailers', async (req, res) => {
    try {
        const { shopName, ownerName, phone, address, gst } = req.body;
        
        // Database mein data daalna. (pending_balance database khud 0.00 set kar dega default mein)
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

// 4. Saare Retailers mangwane ka API
app.get('/api/retailers', async (req, res) => {
    try {
        const allRetailers = await pool.query("SELECT * FROM retailers ORDER BY id DESC");
        res.json(allRetailers.rows);
    } catch (err) {
        console.error("Error fetching retailers:", err.message);
        res.status(500).send("Server Error");
    }
});


// 5. Order Complete karne ka API (Stock ghatana aur Udhaar badhana)
app.post('/api/orders', async (req, res) => {
    // Frontend se aane wala data (Retailer ID, Total Bill, aur Items ki list)
    const { retailerId, grandTotal, billItems } = req.body;

    try {
        // Kaam 1: Dukaandar ka udhaar (pending_balance) update karna
        await pool.query(
            "UPDATE retailers SET pending_balance = pending_balance + $1 WHERE id = $2",
            [grandTotal, retailerId]
        );

        // Kaam 2: Godown se stock kam karna (Kyunki bill mein multiple items ho sakte hain, hum loop chalayenge)
        for (let i = 0; i < billItems.length; i++) {
            let item = billItems[i];
            await pool.query(
                "UPDATE products SET stock = stock - $1 WHERE id = $2",
                [item.qty, item.productId]
            );
        }

        // Jab dono kaam ho jayein, toh frontend ko success message bhejo
        res.json({ message: "Order Successful! Stock aur Ledger dono update ho gaye." });
    } catch (err) {
        console.error("Error processing order:", err.message);
        res.status(500).send("Server Error");
    }
});

// 6. Dashboard Analytics API (Total hisaab-kitaab nikalne ke liye)
app.get('/api/dashboard', async (req, res) => {
    try {
        const udhaar = await pool.query("SELECT SUM(pending_balance) as total_udhaar FROM retailers");
        const stock = await pool.query("SELECT SUM(price * stock) as total_value FROM products");
        const cash = await pool.query("SELECT SUM(amount) as total_received FROM payment_history");
        
        // Items and Retailers list (Full list for dashboard)
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


// 7. Payment Receive karne ka API (Udhaar kam karna)
// 7. Payment Receive karna aur History Save karna
app.post('/api/retailers/pay', async (req, res) => {
    const { retailerId, amount } = req.body;

    try {
        // Kaam 1: Database mein pending_balance se amount minus karna
        const result = await pool.query(
            "UPDATE retailers SET pending_balance = pending_balance - $1 WHERE id = $2 RETURNING *",
            [amount, retailerId]
        );

        // Kaam 2: Payment History table mein entry marna
        await pool.query(
            "INSERT INTO payment_history (retailer_id, amount) VALUES ($1, $2)",
            [retailerId, amount]
        );
        
        res.json({ message: "Payment Successful!", updatedRetailer: result.rows[0] });
    } catch (err) {
        console.error("Payment Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// 8. Payment History Mangwane ka API (Shop naam aur time ke sath)
app.get('/api/payment-history', async (req, res) => {
    try {
        // SQL JOIN use karke history aur dukaan ka naam ek sath nikalna
        const history = await pool.query(`
            SELECT p.id, p.amount, p.payment_date, r.shop_name, r.owner_name
            FROM payment_history p
            JOIN retailers r ON p.retailer_id = r.id
            ORDER BY p.payment_date DESC
        `);
        res.json(history.rows);
    } catch (err) {
        console.error("History Error:", err.message);
        res.status(500).send("Server Error");
    }
});
// ==========================================
// 🚀 API ROUTES KHATAM
// ==========================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});