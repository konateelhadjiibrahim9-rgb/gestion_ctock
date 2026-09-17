const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

// Configuration
const STOCKS_DIR = 'C:\\Users\\KONATE\\Pictures\\stocks';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gestion_stock'
};

// Connexion à la base de données
let dbConnection;

async function getConnection() {
  if (!dbConnection) {
    dbConnection = await mysql.createConnection(DB_CONFIG);
  }
  return dbConnection;
}

// Fonction pour exécuter des requêtes MySQL
async function executeMySQL(sql, params = []) {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Erreur MySQL:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    return null;
  }
}

// Fonction pour extraire le texte d'un document Word
async function extractTextFromDocx(docxPath) {
  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    return result.value;
  } catch (error) {
    console.error('Erreur extraction DOCX:', error.message);
    return null;
  }
}

// Fonction pour parser le texte et extraire les informations
function parseProductInfo(text, docxFileName) {
  const info = {
    nom: '',
    marque: '',
    modele: '',
    description: '',
    prix_achat: null,
    prix_vente: null,
    code_produit: '',
    numero_serie: '',
    quantite: 1
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  for (const line of lines) {
    // Recherche patterns courants
    if (line.toLowerCase().includes('nom') || line.toLowerCase().includes('appareil')) {
      info.nom = line.split(/:|-/).pop().trim();
    } else if (line.toLowerCase().includes('marque') || line.toLowerCase().includes('brand')) {
      info.marque = line.split(/:|-/).pop().trim();
    } else if (line.toLowerCase().includes('modèle') || line.toLowerCase().includes('model')) {
      info.modele = line.split(/:|-/).pop().trim();
    } else if (line.toLowerCase().includes('description') || line.toLowerCase().includes('desc')) {
      info.description = line.split(/:|-/).pop().trim();
    } else if (line.toLowerCase().includes('prix') && line.toLowerCase().includes('achat')) {
      const prix = line.match(/[\d.,]+/);
      if (prix) info.prix_achat = parseFloat(prix[0].replace(',', '.'));
    } else if (line.toLowerCase().includes('prix') && line.toLowerCase().includes('vente')) {
      const prix = line.match(/[\d.,]+/);
      if (prix) info.prix_vente = parseFloat(prix[0].replace(',', '.'));
    } else if (line.toLowerCase().includes('série') || line.toLowerCase().includes('serial') || line.toLowerCase().includes('code')) {
      info.numero_serie = line.split(/:|-/).pop().trim();
    } else if (line.toLowerCase().includes('quantité') || line.toLowerCase().includes('quantite') || line.toLowerCase().includes('stock') || line.toLowerCase().includes('nombre')) {
      const qty = line.match(/[\d]+/);
      if (qty) info.quantite = parseInt(qty[0]);
    }
  }

  // TOUJOURS utiliser le nom du fichier Word comme nom du produit
  if (docxFileName) {
    info.nom = docxFileName.replace('.docx', '').trim();
  }

  // Si toujours pas de nom, utiliser la première ligne
  if (!info.nom) {
    info.nom = lines[0] || 'Produit sans nom';
  }

  // Utiliser le texte complet comme description si pas de description trouvée
  if (!info.description && lines.length > 1) {
    info.description = lines.slice(1).join(' ').substring(0, 500);
  }

  // Générer un code produit basé sur le nom du produit
  if (!info.code_produit) {
    const cleanName = info.nom.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    info.code_produit = `PROD-${cleanName.toUpperCase()}-${Date.now().toString().slice(-4)}`;
  }

  // Générer un numéro de série si non trouvé
  if (!info.numero_serie) {
    info.numero_serie = `SN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  }

  return info;
}

// Fonction pour copier une image dans le dossier uploads
async function copyImageToUploads(sourcePath, productName) {
  try {
    const ext = path.extname(sourcePath);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const newFileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${random}${ext}`;
    const destPath = path.join(UPLOADS_DIR, newFileName);

    await fs.copyFile(sourcePath, destPath);
    return `/uploads/${newFileName}`;
  } catch (error) {
    console.error('Erreur copie image:', error.message);
    return null;
  }
}

// Fonction pour trouver la première image dans un dossier
async function findFirstImage(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        return path.join(dirPath, file);
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur recherche image:', error.message);
    return null;
  }
}

// Fonction pour trouver le document Word dans un dossier
async function findDocxFile(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.docx')) {
        return path.join(dirPath, file);
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur recherche DOCX:', error.message);
    return null;
  }
}

// Fonction pour insérer un produit en base de données
async function insertProduct(productInfo, imageUrl) {
  const sql = `INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  const result = await executeMySQL(sql, [
    productInfo.code_produit,
    productInfo.nom,
    productInfo.description,
    productInfo.prix_achat || 0,
    productInfo.prix_vente || 0,
    imageUrl || null
  ]);
  
  if (result && result.insertId) {
    return result.insertId;
  }
  return null;
}

// Fonction pour insérer un exemplaire
async function insertExemplaire(numeroSerie, idProduit) {
  const sql = `INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique) 
               VALUES (?, ?, 'En stock', 'Bon état')`;
  
  const result = await executeMySQL(sql, [numeroSerie, idProduit]);
  
  if (result && result.affectedRows > 0) {
    return result.insertId || true; // Retourner true si succès mais pas d'insertId
  }
  return null;
}

// Fonction pour créer un mouvement d'entrée
async function createMouvement(numeroSerie, type = 'entrée') {
  const sql = `INSERT INTO mouvements_stock (num_serie, type_mouvement, date_mouvement, commentaire) 
               VALUES (?, ?, NOW(), 'Importation automatique')`;
  
  const result = await executeMySQL(sql, [numeroSerie, type]);
  return result !== null;
}

// Fonction principale d'importation
async function importStocks() {
  console.log('🚀 Début de l\'importation des stocks...');
  console.log(`📁 Répertoire source: ${STOCKS_DIR}`);
  console.log(`📤 Répertoire uploads: ${UPLOADS_DIR}`);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    totalExemplaires: 0,
    errors: []
  };

  try {
    // Créer le dossier uploads s'il n'existe pas
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Lister tous les dossiers de 1 à 28
    for (let i = 1; i <= 28; i++) {
      const folderPath = path.join(STOCKS_DIR, i.toString());
      results.total++;

      console.log(`\n📂 Traitement du dossier ${i}/28...`);

      try {
        // Vérifier si le dossier existe
        await fs.access(folderPath);

        // Trouver le document Word
        const docxPath = await findDocxFile(folderPath);
        if (!docxPath) {
          console.log(`❌ Aucun document Word trouvé dans le dossier ${i}`);
          results.failed++;
          results.errors.push(`Dossier ${i}: Aucun document Word trouvé`);
          continue;
        }

        // Extraire le texte du document
        console.log(`📄 Lecture du document: ${path.basename(docxPath)}`);
        const text = await extractTextFromDocx(docxPath);
        if (!text) {
          console.log(`❌ Impossible d'extraire le texte du document`);
          results.failed++;
          results.errors.push(`Dossier ${i}: Échec extraction texte`);
          continue;
        }

        // Parser les informations du produit
        console.log(`🔍 Analyse des informations du produit...`);
        const productInfo = parseProductInfo(text, path.basename(docxPath));
        console.log(`📦 Produit identifié: ${productInfo.nom}`);
        console.log(`   - Code: ${productInfo.code_produit}`);
        console.log(`   - Prix achat: ${productInfo.prix_achat || 'N/A'}`);
        console.log(`   - Prix vente: ${productInfo.prix_vente || 'N/A'}`);
        console.log(`   - Quantité: ${productInfo.quantite}`);

        // Trouver et copier l'image principale
        const imagePath = await findFirstImage(folderPath);
        let imageUrl = null;
        if (imagePath) {
          console.log(`🖼️  Image principale trouvée: ${path.basename(imagePath)}`);
          imageUrl = await copyImageToUploads(imagePath, productInfo.nom);
          if (imageUrl) {
            console.log(`✅ Image copiée: ${imageUrl}`);
          }
        } else {
          console.log(`⚠️  Aucune image trouvée dans le dossier`);
        }

        // Insérer le produit en base de données
        console.log(`💾 Insertion du produit en base de données...`);
        const productId = await insertProduct(productInfo, imageUrl);
        if (!productId) {
          console.log(`❌ Échec de l'insertion du produit`);
          results.failed++;
          results.errors.push(`Dossier ${i}: Échec insertion produit`);
          continue;
        }
        console.log(`✅ Produit inséré (ID: ${productId})`);

        // Insérer les exemplaires selon la quantité spécifiée
        console.log(`💾 Insertion de ${productInfo.quantite} exemplaire(s)...`);
        let exemplairesCreated = 0;
        for (let q = 0; q < productInfo.quantite; q++) {
          // Générer un numéro de série unique pour chaque exemplaire
          const serieNumero = q === 0 ? productInfo.numero_serie : 
            `SN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}${q}`;
          
          const exemplaireResult = await insertExemplaire(serieNumero, productId);
          if (exemplaireResult) {
            exemplairesCreated++;
            console.log(`   ✅ Exemplaire ${q + 1}/${productInfo.quantite} inséré (Série: ${serieNumero})`);
            
            // Créer le mouvement d'entrée pour cet exemplaire
            const mouvementSuccess = await createMouvement(serieNumero);
            if (!mouvementSuccess) {
              console.log(`   ⚠️  Échec création mouvement (non critique)`);
            }
          } else {
            console.log(`   ❌ Échec insertion exemplaire ${q + 1}/${productInfo.quantite}`);
          }
        }

        if (exemplairesCreated === 0) {
          console.log(`❌ Aucun exemplaire créé`);
          results.failed++;
          results.errors.push(`Dossier ${i}: Échec insertion exemplaires`);
          continue;
        }

        console.log(`✅ ${exemplairesCreated} exemplaire(s) créé(s)`);

        console.log(`✅ Dossier ${i} traité avec succès`);
        results.success++;
        results.totalExemplaires += exemplairesCreated;

      } catch (error) {
        console.error(`❌ Erreur traitement dossier ${i}:`, error.message);
        results.failed++;
        results.errors.push(`Dossier ${i}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors de l\'importation:', error.message);
  }

  // Afficher le rapport final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RAPPORT D\'IMPORTATION');
  console.log('='.repeat(50));
  console.log(`📁 Total dossiers traités: ${results.total}`);
  console.log(`✅ Produits importés: ${results.success}`);
  console.log(`📦 Total exemplaires créés: ${results.totalExemplaires}`);
  console.log(`❌ Importations échouées: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${((results.success / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Erreurs détaillées:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n🎉 Importation terminée !');
  
  // Fermer la connexion à la base de données
  if (dbConnection) {
    await dbConnection.end();
    console.log('🔌 Connexion BDD fermée');
  }
}

// Exécuter l'importation
importStocks().catch(console.error);