
async function checkDb() {
    try {
        const res = await fetch('http://localhost:3000/api/db');
        const db = await res.json();
        console.log('Guideline 0:', JSON.stringify(db.guidelines[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}
checkDb();
