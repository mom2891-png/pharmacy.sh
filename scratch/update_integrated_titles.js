const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./public/data/db/pharmacy.db');

const updateTitle = (major, sub, newTitle) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT summary FROM category_metadata WHERE major = ? AND sub = ?', [major, sub], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve();
            
            // 구식 제목 패턴을 찾아 새로운 제목으로 교체
            const updatedSummary = row.summary.replace(/^# .*\n/, `# ${newTitle}\n`);
            
            db.run('UPDATE category_metadata SET summary = ? WHERE major = ? AND sub = ?', [updatedSummary, major, sub], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

Promise.all([
    updateTitle('심혈관질환', '1. 고혈압', '고혈압 가이드라인 통합본'),
    updateTitle('심혈관질환', '2. 심부전', '심부전 가이드라인 통합본')
]).then(() => {
    console.log('✅ Successfully updated titles for Hypertension and Heart Failure');
    db.close();
}).catch(err => {
    console.error('❌ Error updating titles:', err);
    db.close();
});
