const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Frontend se aane wale JSON data ko samajhne ke liye

// Database Connection (PostgreSQL)
// Vercel/Render par environment variables se URL aayega
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false // Cloud database connections ke liye zaroori
    }
});

// ==========================================
// 1. ADMIN LOGIN API
// ==========================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'abhishek' && password === 'shahadmin123') {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.status(401).json({ success: false, message: "Galat Username ya Password!" });
    }
});

// ==========================================
// 2. GET ALL PRODUCTS (Godown list ke liye)
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Error:", err.message);
        res.status(500).send("Database se data nikalne mein error aaya.");
    }
});

// ==========================================
// 3. ADD NEW PRODUCT (Naya item save karna)
// ==========================================
app.post('/api/products', async (req, res) => {
    const { name, category, price, stock, sku, gstRate } = req.body;
    
    try {
        const insertQuery = `
            INSERT INTO products (sku, name, category, price, stock, gst_rate) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const values = [sku, name, category, price, stock, gstRate];
        const result = await pool.query(insertQuery, values);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Insert Error:", err.message);
        // Error Code 23505 ka matlab hai 'Duplicate SKU'
        if (err.code === '23505') { 
            res.status(400).send("Bhai, yeh SKU pehle se database mein hai!");
        } else {
            res.status(500).send("Server Error: Product save nahi ho paya.");
        }
    }
});

// ==========================================
// 4. UPDATE EXISTING PRODUCT (Edit Feature)
// ==========================================
app.put('/api/products/:sku', async (req, res) => {
    const sku = req.params.sku; // URL se purana SKU pakda
    const { name, category, price, stock, gstRate } = req.body; // Form se naya data pakda

    try {
        const updateQuery = `
            UPDATE products 
            SET name = $1, category = $2, price = $3, stock = $4, gst_rate = $5 
            WHERE sku = $6 
            RETURNING *;
        `;
        const values = [name, category, price, stock, gstRate, sku];
        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).send("Product nahi mila!");
        }

        res.status(200).json({ message: "Product Update ho gaya!", product: result.rows[0] });
    } catch (error) {
        console.error("Database Update Error:", error.message);
        res.status(500).send("Failed to update product in database");
    }
});

// ==========================================
// SERVER START
// ==========================================
app.listen(port, () => {
    console.log(`Bhai, Server ekdum mast chal raha hai Port: ${port} par!`);
});