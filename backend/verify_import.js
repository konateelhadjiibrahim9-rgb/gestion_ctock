const mysql = require('mysql2/promise');

async function verify() {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'gestion_stock'});
  try {
    const [produits] = await conn.execute('SELECT COUNT(*) as count FROM produits');
    const [exemplaires] = await conn.execute('SELECT COUNT(*) as count FROM exemplaires');
    const [mouvements] = await conn.execute('SELECT COUNT(*) as count FROM mouvements_stock');
    
    console.log('📊 Vérification des données en base:');
    console.log(`✅ Produits: ${produits[0].count}`);
    console.log(`✅ Exemplaires: ${exemplaires[0].count}`);
    console.log(`✅ Mouvements: ${mouvements[0].count}`);
    
    const [sampleProduits] = await conn.execute('SELECT id_produit, nom, code_produit FROM produits LIMIT 5');
    console.log('\n📦 Exemple de produits:');
    sampleProduits.forEach(p => {
      console.log(`   - ${p.nom} (${p.code_produit})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  await conn.end();
}

verify();