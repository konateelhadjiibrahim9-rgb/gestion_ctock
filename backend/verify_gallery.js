const mysql = require('mysql2/promise');

async function verifyGallery() {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'gestion_stock'});
  try {
    const [produits] = await conn.execute('SELECT id_produit, nom, image_url, images_galerie FROM produits LIMIT 3');
    console.log('📊 Vérification des données galerie:');
    produits.forEach(p => {
      console.log('\n📦 ' + p.nom + ' (ID: ' + p.id_produit + ')');
      console.log('   Image principale: ' + p.image_url);
      console.log('   Type galerie: ' + typeof p.images_galerie);
      console.log('   Galerie: ' + JSON.stringify(p.images_galerie).substring(0, 150) + '...');
      if (p.images_galerie) {
        let gallery = p.images_galerie;
        if (typeof gallery === 'string') {
          gallery = JSON.parse(gallery);
        }
        console.log('   Nombre d\'images: ' + (Array.isArray(gallery) ? gallery.length : 'N/A'));
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  await conn.end();
}

verifyGallery();