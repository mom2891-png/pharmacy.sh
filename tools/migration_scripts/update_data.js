const fs = require('fs');

let content = fs.readFileSync('data.js', 'utf8');

// The file starts with:
// // Mock 데이터베이스
// const DB = {
let startIdx = content.indexOf('const DB = ');
if (startIdx === -1) {
  console.log('Error: const DB = not found');
  process.exit(1);
}

let prefix = content.substring(0, startIdx);
let objStr = content.substring(startIdx + 11);

// remove trailing semicolon or spaces
objStr = objStr.trim();
if (objStr.endsWith(';')) objStr = objStr.slice(0, -1);

let DB;
eval('DB = ' + objStr);

DB.guidelines.forEach(item => {
    let name = item.title || "";
    if(name.includes('고혈압') && (!item.content || item.content.includes('원본 PDF 파일'))) {
         item.content = `고혈압의 일차 약제로는 A, C, D가 주로 권고됩니다. 동반 질환에 따라 선택합니다. <br><br>\n당뇨병 동반 시 <a class="smart-link" onclick="navigateTo('/drugs/d1')">Ramipril</a>(ACE 억제제) 사용 권장.<br>\n협심증이 있는 경우 <a class="smart-link" onclick="navigateTo('/drugs/d2')">Amlodipine</a>(CCB) 권장.`;
    }
});

let newContent = prefix + 'const DB = ' + JSON.stringify(DB, null, 2) + ';\n';
fs.writeFileSync('data.js', newContent, 'utf8');
console.log('Successfully updated data.js');
