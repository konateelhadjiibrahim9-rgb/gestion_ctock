require('dotenv').config();
const db = require('../config/database');

function salePrice(purchasePrice) {
  const purchase = Number(purchasePrice) || 0;
  if (purchase <= 0) return 0;
  return Math.round(purchase * (purchase <= 100000 ? 1.4 : 1.25));
}

async function recalculatePrices() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.query('SELECT id_produit, prix_achat, prix_vente FROM produits');
    let updated = 0;

    for (const product of products) {
      const currentPurchase = Number(product.prix_achat) || 0;
      const purchase = currentPurchase > 0 ? currentPurchase : Number(product.prix_vente) || 0;
      const sale = salePrice(purchase);
      await connection.query(
        'UPDATE produits SET prix_achat = ?, prix_vente = ? WHERE id_produit = ?',
        [purchase, sale, product.id_produit]
      );
      updated++;
    }

    await connection.commit();
    console.log(`produits_recalcules=${updated}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

recalculatePrices().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
