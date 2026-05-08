const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, '..', 'backend', 'database', 'pharmacy.db');
const SUMMARIES_DIR = path.join(__dirname, '..', 'guidelines', 'summaries');

const db = new sqlite3.Database(DB_FILE);

function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err); else resolve({ changes: this.changes });
        });
    });
}

async function sync() {
    console.log('🔄 Synchronizing summaries to database...');
    
    if (!fs.existsSync(SUMMARIES_DIR)) {
        console.error('Error: Summaries directory not found');
        return;
    }

    const files = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
        const id = file.replace('.md', '');
        const content = fs.readFileSync(path.join(SUMMARIES_DIR, file), 'utf8');
        
        try {
            const result = await dbRun("UPDATE guidelines SET aiSummary = ? WHERE id = ?", [content, id]);
            if (result.changes > 0) {
                console.log(`✅ Updated ${id}`);
            } else {
                console.warn(`⚠️ No guideline found for ID: ${id}`);
            }
        } catch (err) {
            console.error(`❌ Error updating ${id}:`, err.message);
        }
    }
    
    db.close();
    console.log('🏁 Sync completed.');
}

sync();
