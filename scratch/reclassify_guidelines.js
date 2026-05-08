const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', 'guidelines', 'legacy', 'medical_classification.csv');
const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');

const db = new sqlite3.Database(DB_FILE);

function parseCsv(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += line[i];
            }
        }
        parts.push(current.trim());
        return {
            dept: parts[0],
            category: parts[1] || parts[0],
            disease: parts[2]
        };
    });
}

async function run() {
    const csvData = parseCsv(CSV_FILE);
    const existingGuidelines = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM guidelines", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });

    let currentMaxId = 255;
    const categoryCounters = {};

    console.log('🚀 Starting Reclassification...');

    for (const item of csvData) {
        if (!item.disease) continue;

        const major = item.category;
        if (!categoryCounters[major]) categoryCounters[major] = 1;
        
        const subName = `${categoryCounters[major]}. ${item.disease}`;
        categoryCounters[major]++;

        // Try to find existing guideline by disease name
        const existing = existingGuidelines.find(g => 
            g.title.includes(item.disease) || (g.sub && g.sub.includes(item.disease))
        );

        if (existing) {
            // Update existing
            await new Promise((resolve, reject) => {
                db.run("UPDATE guidelines SET major = ?, sub = ? WHERE id = ?", [major, subName, existing.id], (err) => {
                    if (err) reject(err); else resolve();
                });
            });
            console.log(`📝 Updated: ${existing.id} -> ${major} / ${subName}`);
        } else {
            // Insert new
            currentMaxId++;
            const newId = `g${currentMaxId}`;
            await new Promise((resolve, reject) => {
                db.run("INSERT INTO guidelines (id, major, sub, title) VALUES (?, ?, ?, ?)", 
                    [newId, major, subName, item.disease], (err) => {
                        if (err) reject(err); else resolve();
                    });
            });
            console.log(`✨ Added: ${newId} -> ${major} / ${subName}`);
        }
    }

    // Update category_metadata to match new major/sub structure
    // We'll use the sync_categories.js later, but we need to ensure the DB categories are cleaned up.
    
    db.close();
    console.log('🏁 Reclassification completed.');
}

run().catch(console.error);
