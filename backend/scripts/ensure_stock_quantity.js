require('dotenv').config();
const db = require('../config/database');

async function ensureTenCopiesPerProduct() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.query('SELECT id_produit, code_produit FROM produits ORDER BY id_produit');
    let created = 0;

    for (const product of products) {
      const [countRows] = await connection.query(
        "SELECT COUNT(*) AS total FROM exemplaires WHERE id_produit = ? AND statut = 'En stock'",
        [product.id_produit]
      );
      const missing = Math.max(0, 10 - Number(countRows[0].total));
      for (let index = 0; index < missing; index++) {
        let serial;
        let serialIndex = Number(countRows[0].total) + index + 1;
        do {
          serial = `${product.code_produit}-SN-${String(serialIndex).padStart(2, '0')}`;
          const [existing] = await connection.query('SELECT 1 FROM exemplaires WHERE num_serie = ?', [serial]);
          if (existing.length === 0) break;
          serialIndex++;
        } while (true);
        await connection.query(
          "INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique) VALUES (?, ?, 'En stock', 'Bon état')",
          [serial, product.id_produit]
        );
        await connection.query(
          "INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, 'Entrée', 'Complément automatique du stock à 10 exemplaires')",
          [serial]
        );
        created++;
      }
    }

    await connection.commit();
    console.log(`produits=${products.length}`);
    console.log(`exemplaires_crees=${created}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

ensureTenCopiesPerProduct().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});