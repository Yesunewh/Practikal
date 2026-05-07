const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/en.json'), 'utf8'));
const am = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/am.json'), 'utf8'));
const om = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/om.json'), 'utf8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      return acc.concat(getKeys(obj[k], path));
    }
    return acc.concat(path);
  }, []);
}

const enKeys = getKeys(en);
const amKeys = getKeys(am);
const omKeys = getKeys(om);

const missingAm = enKeys.filter(k => !amKeys.includes(k));
const missingOm = enKeys.filter(k => !omKeys.includes(k));

console.log('--- Missing in AM ---');
console.log(missingAm.length);
console.log(missingAm.slice(0, 10));

console.log('\n--- Missing in OM ---');
console.log(missingOm.length);
console.log(missingOm.slice(0, 10));
