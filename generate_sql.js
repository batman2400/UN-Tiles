/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const catalogStr = fs.readFileSync('./src/data/catalog.json', 'utf8');
const catalog = JSON.parse(catalogStr);

let sql = `-- Revert Product Names and Dimensions to Original\n\n`;

for (const p of catalog.products) {
    sql += `UPDATE public.products SET name = '${p.name.replace(/'/g, "''")}', dimensions = '${p.dimensions}', finish = '${p.finish}', application = '${p.application}' WHERE sku = '${p.sku}';\n`;
}

fs.writeFileSync('revert_products.sql', sql);
console.log('SQL generated!');
