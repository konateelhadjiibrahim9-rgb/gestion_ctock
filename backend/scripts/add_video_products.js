require('dotenv').config();
const db = require('../config/database');

const products = [
  {
    nom: 'DELL Latitude 7390 2-en-1 Detachable',
    description: 'DELL Latitude 7390 2-en-1 Detachable\nCore i5 11e génération\nRAM 16 GB DDR4\nDisque 256 Go SSD\nÉcran 13.3 pouces\nVitesse 1.80 GHz turbo boost\nIntel UHD Graphics\nClavier AZERTY\nChargeur inclus',
    prix_vente: 0
  },
  {
    nom: 'HP EliteBook 840 G5/G6',
    description: 'HP EliteBook 840 G5/G6\nCore i5 8e génération\nRAM 8 GB DDR4\nDisque 256 Go SSD\nÉcran 14 pouces\nClavier professionnel\nChargeur inclus',
    prix_vente: 155000
  }
];

async function addProducts() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let added = 0;

    for (const product of products) {
      const [existing] = await connection.query(
        'SELECT id_produit FROM produits WHERE LOWER(nom) = LOWER(?)',
        [product.nom]
      );
      if (existing.length > 0) continue;

      const [result] = await connection.query(
        'INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url, images_galerie) VALUES (?, ?, ?, ?, ?, NULL, NULL)',
        [`PROD-${String((await nextProductId(connection))).padStart(2, '0')}`, product.nom, product.description, 0, product.prix_vente]
      );
      const idProduit = result.insertId;
      const code = `PROD-${String(idProduit).padStart(2, '0')}`;
      await connection.query('UPDATE produits SET code_produit = ? WHERE id_produit = ?', [code, idProduit]);

      for (let index = 1; index <= 10; index++) {
        const serial = `${code}-SN-${String(index).padStart(2, '0')}`;
        await connection.query(
          "INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique) VALUES (?, ?, 'En stock', 'Bon état')",
          [serial, idProduit]
        );
        await connection.query(
          "INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, 'Entrée', 'Ajout depuis la liste vidéo')",
          [serial]
        );
      }
      added++;
    }

    await connection.commit();
    console.log(`produits_ajoutes=${added}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

async function nextProductId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(id_produit), 0) + 1 AS next_id FROM produits');
  return rows[0].next_id;
}

addProducts().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
