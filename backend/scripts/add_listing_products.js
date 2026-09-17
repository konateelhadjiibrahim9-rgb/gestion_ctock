require('dotenv').config();
const db = require('../config/database');

const products = [
  ['Lenovo ThinkPad X13 GEN1', 'Core i5 10e génération; RAM 16 GB DDR4; SSD 256 GB; écran 13 pouces; clavier AZERTY', 185000],
  ['HP Probook 455 G10', 'AMD Ryzen 7 7730U; RAM 16 GB DDR4; SSD 256 GB; écran 15.6 pouces; Radeon Graphics; clavier pavé numérique', 350000],
  ['DELL Latitude 7320 2-en-1 Detachable', 'Core i5 11e génération; RAM 16 GB DDR4; SSD 256 GB; écran tactile 13 pouces; Intel UHD Graphics; clavier QWERTY; stylet offert', 280000],
  ['Microsoft Surface Laptop 4', 'Core i7 11e génération; RAM 16 GB DDR4; SSD 256 GB; écran tactile 15.6 pouces; Intel Iris Graphics', 365000],
  ['Microsoft Surface Laptop 3', 'Core i7 10e génération; RAM 16 GB DDR4; SSD 256 GB; écran tactile 13.6 pouces; Intel Iris Graphics', 280000],
  ['HP EliteBook 820 G1', 'Core i5 4e génération; RAM 4 GB DDR4; HDD 500 GB; écran 12 pouces; Intel HD Graphics', 75000],
  ['BUREAU COMPLET HP ProDesk 600 G2', 'Core i5 6e génération; RAM 8 GB DDR4; HDD 500 GB; écran 22 pouces; clavier et souris RGB; webcam', 105000],
  ['DELL INSPIRON 3383', 'Core i5 8e génération; RAM 8 GB DDR4; stockage 1 TB; écran 15.6 pouces; Intel UHD Graphics; pavé numérique', 145000],
  ['DELL XPS 13 7390', 'Core i5 10e génération; RAM 8 GB DDR4; SSD 256 GB; écran 13.3 pouces FHD; Intel UHD Graphics', 295000],
  ['Dell latitude 3390 2in1', 'Core i5 8e génération; RAM 8 GB; SSD 256 GB; écran tactile 13.3 pouces', 145000],
  ['Dell latitude 7470', 'Core i7 6e génération; RAM 16 GB; SSD 512 GB; écran 14 pouces', 165000],
  ['Dell latitude 7480', 'Core i7 6e génération; RAM 16 GB; SSD 512 GB; écran 14 pouces', 170000],
  ['HP Elitebook 850 G7', 'Core i5 10e génération; RAM 16 GB; SSD 512 GB; écran 15.6 pouces', 300000],
  ['Dell latitude 7400', 'Core i7 8e génération; RAM 32 GB; SSD 512 GB; écran 14 pouces', 210000],
  ['Dell latitude 7400 i5', 'Core i5 8e génération; RAM 16 GB; SSD 256 GB; écran 14 pouces', 165000],
  ['Dell latitude 5310', 'Core i7 10e génération; RAM 16 GB; SSD 512 GB; écran 13.3 pouces', 190000],
  ['HP Elitebook 830 G6', 'Core i7 8e génération; RAM 16 GB; SSD 512 GB; écran tactile 14 pouces', 230000],
  ['HP Elitebook 830 G6 i5', 'Core i5 8e génération; RAM 16 GB; SSD 512 GB; écran tactile 13.3 pouces', 200000],
  ['HP Elitebook 850 G6', 'Core i7 8e génération; RAM 16 GB; SSD 1 TB; écran 15.6 pouces', 260000],
  ['Lenovo ThinkPad L390 Yoga', 'Core i3 8e génération; RAM 8 GB; SSD 256 GB; écran tactile 13.3 pouces', 140000],
  ['Dell latitude 7410 2en1', 'Core i5 10e génération; RAM 16 GB; SSD 512 GB; écran 14 pouces', 215000],
  ['HP Zbook Firefly 14 G8', 'Core i7 11e génération; RAM 16 GB; SSD 512 GB; écran tactile 14 pouces', 350000],
  ['HP Zbook 15U G5', 'Core i7 8e génération; RAM 32 GB; SSD 512 GB; écran 15.6 pouces; carte graphique 2 GB', 325000],
  ['HP ZBOOK STUDIO G5', 'Core i7 8e génération; RAM 32 GB; SSD 512 GB; écran 15.6 pouces; carte graphique 4 GB', 350000],
  ['HP ZBOOK STUDIO x360 G5', 'Core i7 8e génération; RAM 32 GB; SSD 1 TB; écran tactile 15.6 pouces', 400000],
  ['HP Elitebook 840 G7', 'Core i5 10e génération; RAM 16 GB; SSD 512 GB; écran 14 pouces', 235000],
  ['HP Elitebook 850 G8', 'Core i7 11e génération; RAM 32 GB; SSD 1 TB; écran 15.6 pouces', 400000],
  ['DELL LATITUDE 5300 2en1', 'Core i7 8e génération; RAM 16 GB; SSD 512 GB; écran tactile 13.3 pouces', 225000],
  ['DELL LATITUDE 5300 2en1 i5', 'Core i5 8e génération; RAM 16 GB; SSD 512 GB; écran tactile 13.3 pouces', 200000],
  ['HP Elitebook 1040 x360 G6', 'Core i7 8e génération; RAM 16 GB; SSD 1 TB; écran tactile 14 pouces', 280000],
  ['Lenovo ThinkPad x1 Yoga G6', 'Core i7 11e génération; RAM 32 GB; SSD 1 TB; écran 14 pouces', 380000],
  ['Lenovo ThinkPad T470s', 'Core i5 7e génération; RAM 8 GB; SSD 256 GB; écran 14 pouces', 145000],
  ['HP Elitebook 830 x360 G7', 'Core i5 10e génération; RAM 16 GB; SSD 512 GB; écran tactile 13.3 pouces', 260000],
  ['Lenovo ThinkPad x390 Yoga', 'Core i5 8e génération; RAM 8 GB; SSD 256 GB; écran tactile 13.3 pouces', 160000],
  ['Lenovo ThinkPad L380 Yoga', 'Core i5 8e génération; RAM 8 GB; SSD 256 GB; écran tactile 13.3 pouces', 150000],
  ['DELL Precision 5540', 'Core i9 9e génération; RAM 16 GB; SSD 512 GB; écran 15.6 pouces', 335000],
  ['DELL Latitude 7310', 'Core i7 10e génération; RAM 16 GB; SSD 512 GB; écran tactile 13.3 pouces', 235000],
  ['DELL latitude 9410', 'Core i7 10e génération; RAM 16 GB; SSD 512 GB; écran tactile 14 pouces X360', 270000],
  ['HP Probook x360 11 G5EE', 'Pentium 8e génération; RAM 4 GB; SSD 128 GB; écran 11.6 pouces', 90000],
  ['Lenovo ThinkPad P50S', 'Core i7 6e génération; RAM 16 GB; SSD 512 GB; écran 15.6 pouces; carte graphique 2 GB', 180000],
  ['DELL Latitude 7420 2en1', 'Core i7 11e génération; RAM 16 GB; SSD 512 GB; écran 14 pouces X360', 300000],
  ['DELL 3380', 'Core i3 6e génération; RAM 8 GB; HDD 500 GB; écran 12 pouces', 90000],
  ['HP Elitebook 850 G2', 'Core i5 5e génération; RAM 8 GB; HDD 500 GB; écran tactile 15.6 pouces', 125000],
  ['DELL 3390', 'Core i3 7e génération; RAM 8 GB; SSD 128 GB; écran tactile 13.3 pouces X360', 110000],
  ['HP EliteBook 840 G8', 'Core i5 11e génération; RAM 16 GB; SSD 512 GB; écran tactile 14 pouces', 250000],
  ['Surface Pro 4', 'Core i5 6e génération; RAM 8 GB; SSD 256 GB; écran 12.5 pouces', 165000],
  ['HP Elitebook Folio 1040 G3', 'Core i5 6e génération; RAM 8 GB; SSD 256 GB; écran 14 pouces', 155000]
];

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
}

function salePrice(purchasePrice) {
  const purchase = Number(purchasePrice) || 0;
  return purchase <= 0 ? 0 : Math.round(purchase * (purchase <= 100000 ? 1.4 : 1.25));
}

async function addListingProducts() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let added = 0;
    for (const [nom, description, price] of products) {
      const [existing] = await connection.query('SELECT id_produit FROM produits WHERE LOWER(nom) = LOWER(?)', [nom]);
      if (existing.length > 0) continue;
      const [sameFamily] = await connection.query('SELECT id_produit, nom FROM produits');
      if (sameFamily.some(product => slug(product.nom) === slug(nom))) continue;
      const [result] = await connection.query(
        'INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url, images_galerie) VALUES (?, ?, ?, ?, ?, NULL, NULL)',
        ['TEMP', nom, description, price, salePrice(price)]
      );
      const code = `PROD-${String(result.insertId).padStart(2, '0')}`;
      await connection.query('UPDATE produits SET code_produit = ? WHERE id_produit = ?', [code, result.insertId]);
      for (let index = 1; index <= 10; index++) {
        const serial = `${code}-SN-${String(index).padStart(2, '0')}`;
        await connection.query("INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique) VALUES (?, ?, 'En stock', 'Bon état')", [serial, result.insertId]);
        await connection.query("INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, 'Entrée', 'Ajout depuis le listing fournisseur')", [serial]);
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

addListingProducts().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
