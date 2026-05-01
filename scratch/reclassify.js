const fs = require('fs');
const path = 'c:/Users/Admin/.gemini/antigravity/scratch/pharmacy-info/data.js';
let content = fs.readFileSync(path, 'utf8');

// Extract the DB object string
const dbMatch = content.match(/const DB = ([\s\S]*?);/);
if (!dbMatch) {
    console.error("Could not find DB object");
    process.exit(1);
}

// Use eval to safely parse JS object literal (which JSON.parse can't handle if it has trailing commas, etc)
let db;
try {
    db = eval('(' + dbMatch[1] + ')');
} catch (e) {
    console.error("Eval failed:", e);
    process.exit(1);
}

const mappings = [
    {
        drugs: ['Isoniazid', 'Ethambutol', 'Pyrazinamide', 'Pretomanid', 'Delamanid', 'Rifampicin', 'Rifabutin', 'Cycloserine', 'Prothionamide'],
        major: '[14. 감염질환]',
        minor: '항결핵제',
        sub: '결핵 치료'
    },
    {
        drugs: ['Carbamazepine', 'Oxcarbazepine', 'Rufinamide', 'Eslicarbazepine', 'Fosphenytoin', 'Lacosamide', 'Lamotrigine', 'Phenytoin', 'Mg Valproate', 'Ethosuximide', 'Zonisamide'],
        major: '[13. 신경계 질환]',
        minor: '항전간제',
        sub: '뇌전증 치료'
    },
    {
        drugs: ['Entacapone', 'Opicapone', 'Amantadine', 'Rasagiline', 'Safinamide', 'Selegiline', 'Benztropine', 'Biperiden', 'Orphenadrine', 'Procyclidine', 'Trihexyphenidyl'],
        major: '[13. 신경계 질환]',
        minor: '파킨슨병 치료제',
        sub: '파킨슨병 치료'
    },
    {
        drugs: ['Brinzolamide', 'Dorzolamide', 'Carteolol', 'Timolol', 'Betaxolol', 'Nipradilol', 'Tafluprost'],
        major: '[11. 안과용제]',
        minor: '녹내장 치료제',
        sub: '안압 조절'
    },
    {
        drugs: ['Atropine', 'Tropicamide', 'Cyclopentolate', 'Homatropine', 'Phenylephrine'],
        major: '[11. 안과용제]',
        minor: '산동제',
        sub: '검사/수술용'
    },
    {
        drugs: ['Dioctahedral Smectite', 'Loperamide', 'Nifuroxazide', 'Bismuth', 'Racecadotril', 'Domperidone', 'Metoclopramide', 'Itopride'],
        major: '[3. 소화기관용제]',
        minor: '지사제 및 위장관 조절제',
        sub: '설사/구토/위장 운동'
    },
    {
        drugs: ['Thiamine', 'Fursultiamine', 'Riboflavin', 'Nicotinamide', 'Dexpanthenol', 'Pyridoxine'],
        major: '[15. 비타민 및 영양제]',
        minor: '비타민 B군',
        sub: '영양 보급'
    },
    {
        drugs: ['Salicylic acid', 'Clindamycin', 'Ibuprofen piconol', 'Octenidine', 'Chlorhexidine'],
        major: '[12. 피부과용제]',
        minor: '여드름 치료제 및 소독제',
        sub: '피부 관리'
    },
    {
        drugs: ['Upadacitinib', 'Baricitinib', 'Filgotinib', 'Methotrexate', 'Tocilizumab', 'Leflunomide', 'AAP+Tramadol', 'AAP+Ibuprofen', 'AAP+Caffeine', 'AAP+Diphenhydramine'],
        major: '[7. 근골격계 및 면역질환]',
        minor: '류마티스 및 복합 진통제',
        sub: '염증/통증 조절'
    },
    {
        drugs: ['Sodium Hyaluronate', 'Carbamide Peroxide'],
        major: '[11. 안과용제]',
        minor: '기타 안과용제',
        sub: '인공눈물/세정'
    }
];

const normalize = name => (name || "").toLowerCase().replace(/[^a-z0-9]/g, '');

db.drugs.forEach(category => {
    let foundMapping = null;
    category.items.forEach(item => {
        const itemNorm = normalize(item.ingredient);
        mappings.forEach(m => {
            if (m.drugs.some(d => normalize(d) === itemNorm)) {
                foundMapping = m;
            }
        });
    });

    if (foundMapping) {
        category.major = foundMapping.major;
        category.minor = foundMapping.minor;
        category.sub = foundMapping.sub;
        console.log(`Re-classified block ${category.id} to ${foundMapping.major}`);
    }
});

// Also fix the Diabetes drugs
db.drugs.forEach(category => {
    if (category.sub === 'Sulfonylurea(SU)') {
        category.major = '[2. 호르몬&대사 질환]';
        category.minor = '당뇨병 치료제';
        console.log(`Fixed Sulfonylurea category`);
    }
});

// Write back - stringify with null, 2
const newDbStr = JSON.stringify(db, null, 2);
const newContent = `// Mock 데이터베이스\nconst DB = ${newDbStr};\n\nwindow.DB = DB;\n`;
fs.writeFileSync(path, newContent, 'utf8');
console.log("Database update complete.");
