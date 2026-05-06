
const fs = require('fs');
const dataJs = fs.readFileSync('data.js', 'utf8');

const guidelineCount = (dataJs.match(/"id":\s*"g\d+"/g) || []).length;
const drugCount = (dataJs.match(/"id":\s*"(drug|d\d+)/g) || []).length;

console.log('data.js Counts:', {
    guidelines: guidelineCount,
    drugs: drugCount
});
