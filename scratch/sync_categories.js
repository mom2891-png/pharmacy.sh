const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const CATEGORIES_DIR = path.join(__dirname, '..', 'guidelines', 'summaries', 'categories');

const db = new sqlite3.Database(DB_FILE);

function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err); else resolve({ changes: this.changes });
        });
    });
}

async function syncCategories() {
    console.log('🔄 Synchronizing category metadata to database...');
    
    if (!fs.existsSync(CATEGORIES_DIR)) {
        console.error('Error: Categories directory not found');
        return;
    }

    const files = fs.readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(CATEGORIES_DIR, file), 'utf8');
        const basename = file.replace('.md', '');
        const parts = basename.split('_');
        
        let major, sub;
        if (parts.length >= 2) {
            major = parts[0];
            sub = parts.slice(1).join(' ').trim();
        } else {
            major = basename;
            sub = "통합 가이드라인";
        }
        
        try {
            await dbRun(`INSERT INTO category_metadata (major, sub, summary) VALUES (?, ?, ?) 
                         ON CONFLICT(major, sub) DO UPDATE SET summary = excluded.summary`, 
                         [major, sub, content]);
            console.log(`✅ Updated Category: ${major} - ${sub}`);
        } catch (err) {
            console.error(`❌ Error updating category ${major}-${sub}:`, err.message);
        }
    }
    
    db.close();
    console.log('🏁 Category sync completed.');
}

syncCategories();
