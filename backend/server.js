const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false 
    }
});

// --- 1. ADMIN LOGIN API ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'abhishek' && password === 'shahadmin123') {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.status(401).json({ success: false, message: "Galat Username ya Password!" });
    }
});

// --- 2. GODOWN: GET ALL PRODUCTS ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Database fetch error");
    }
});

// --- 3. GODOWN: ADD NEW PRODUCT ---
app.post('/api/products', async (req, res) => {
    const { name, category, price, stock, sku, gstRate } = req.body;
    try {
        const insertQuery = `INSERT INTO products (sku, name, category, price, stock, gst_rate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const result = await pool.query(insertQuery, [sku, name, category, price, stock, gstRate]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') res.status(400).send("SKU already exists!");
        else res.status(500).send("Failed to save product.");
    }
});

// --- 4. GODOWN: UPDATE PRODUCT ---
app.put('/api/products/:sku', async (req, res) => {
    const sku = req.params.sku;
    const { name, category, price, stock, gstRate } = req.body;
    try {
        const updateQuery = `UPDATE products SET name = $1, category = $2, price = $3, stock = $4, gst_rate = $5 WHERE sku = $6 RETURNING *;`;
        const result = await pool.query(updateQuery, [name, category, price, stock, gstRate, sku]);
        if (result.rows.length === 0) return res.status(404).send("Product not found!");
        res.status(200).json({ message: "Updated successfully", product: result.rows[0] });
    } catch (error) {
        res.status(500).send("Failed to update product");
    }
});

// ==========================================
// --- 5. RETAILER: GET ALL RETAILERS ---
// ==========================================
app.get('/api/retailers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM retailers ORDER BY shop_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Retailers Error:", err.message);
        res.status(500).send("Database se retailers nikalne mein error aaya.");
    }
});

// ==========================================
// --- 6. RETAILER: ADD NEW RETAILER ---
// ==========================================
app.post('/api/retailers', async (req, res) => {
    const { shopName, ownerName, phone, address, gstPin } = req.body;
    try {
        const insertQuery = `
            INSERT INTO retailers (shop_name, owner_name, phone, address, gst, pending_balance) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const values = [shopName, ownerName, phone, address, gstPin || null, 0];
        const result = await pool.query(insertQuery, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Insert Retailer Error:", err.message);
        res.status(500).send("Server Error: Retailer save nahi ho paya.");
    }
});

app.listen(port, () => {
    console.log(`Backend mast chal raha hai Port: ${port} par!`);
});