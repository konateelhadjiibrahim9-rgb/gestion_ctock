require('dotenv').config();
const db = require('../config/database');

async function cleanDescriptions() {
  const [rows] = await db.query('SELECT id_produit, description FROM produits');
  let updated = 0;

  for (const row of rows) {
    const cleaned = (row.description || '')
      .split(/\r?\n/)
      .filter(line => !(/\b(prix|promo)\b/i.test(line)))
      .join('\n')
      .trim();

    if (cleaned !== row.description) {
      await db.query('UPDATE produits SET description = ? WHERE id_produit = ?', [cleaned, row.id_produit]);
      updated++;
    }
  }

  const [check] = await db.query("SELECT COUNT(*) AS remaining FROM produits WHERE description REGEXP 'prix|promo'");
  console.log(`descriptions_nettoyees=${updated}`);
  console.log(`descriptions_contenant_prix=${check[0].remaining}`);
  await db.end();
}

cleanDescriptions().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
