const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001; // Different port
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

app.use(cors());

app.get('/api/db', (req, res) => {
  console.log('Received /api/db request');
  const start = Date.now();
  
  db.all("SELECT * FROM guidelines", (err, guidelines) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`Guidelines fetched in ${Date.now() - start}ms`);
    
    db.all("SELECT * FROM drugs", (err, drugs) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log(`Drugs fetched in ${Date.now() - start}ms`);
      
      db.all("SELECT * FROM drug_items", (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`Items fetched in ${Date.now() - start}ms`);
        
        res.json({ guidelines, drugs, items });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Debug server running on http://localhost:${port}`);
});
