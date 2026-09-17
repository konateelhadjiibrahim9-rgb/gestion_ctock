const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const STOCKS_DIR = 'C:\\Users\\KONATE\\Pictures\\stocks';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_stock'
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
  const connection = await getConnection();
  const [result] = await connection.execute(sql, params);
  return result;
}

async function prepareDatabase() {
  const connection = await getConnection();
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  await connection.execute('TRUNCATE TABLE mouvements_stock');
  await connection.execute('TRUNCATE TABLE exemplaires');
  await connection.execute('TRUNCATE TABLE produits');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  await connection.execute('ALTER TABLE produits MODIFY description LONGTEXT NULL');
  const [columns] = await connection.execute(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'produits' AND column_name = 'images_galerie'`
  );
  if (columns[0].count === 0) {
    await connection.execute('ALTER TABLE produits ADD COLUMN images_galerie JSON NULL AFTER image_url');
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
  const cleanLine = line => line.replace(/^[✓✅🔌💰*\s]+/, '').replace(/[*]+$/, '').trim();
  const firstLine = cleanLine(lines[0] || 'Produit sans nom');

  for (const line of lines) {
    const normalizedLine = cleanLine(line);
    const lowerLine = normalizedLine.toLowerCase();
    if (/^(nom|appareil)\s*[:\-]/i.test(normalizedLine)) {
      info.nom = line.split(/:|-/).pop().trim();
    } else if (/^(marque|brand)\s*[:\-]/i.test(normalizedLine)) {
      info.marque = line.split(/:|-/).pop().trim();
    } else if (/^(modèle|modele|model)\s*[:\-]/i.test(normalizedLine)) {
      info.modele = line.split(/:|-/).pop().trim();
    } else if (/^(description|desc)\s*[:\-]/i.test(normalizedLine)) {
      info.description = line.split(/:|-/).pop().trim();
    } else if (lowerLine.includes('prix') && lowerLine.includes('achat')) {
      const prix = line.match(/[\d.,]+/);
      if (prix) info.prix_achat = parsePrice(prix[0]);
    } else if (lowerLine.includes('prix') && lowerLine.includes('vente')) {
      const prix = line.match(/[\d.,]+/);
      if (prix) info.prix_vente = parsePrice(prix[0]);
    } else if (lowerLine.includes('prix')) {
      const prix = line.match(/[\d.,]+/);
      if (prix) info.prix_vente = parsePrice(prix[0]);
    } else if (/^(série|serie|serial|code)\s*[:\-]/i.test(normalizedLine)) {
      info.numero_serie = line.split(/:|-/).pop().trim();
    } else if (/^(quantité|quantite|stock|nombre)\s*[:\-]/i.test(normalizedLine)) {
      const qty = line.match(/[\d]+/);
      if (qty) info.quantite = parseInt(qty[0]);
    }
  }

  info.nom = cleanLine(info.nom || firstLine);
  info.marque = info.marque || (info.nom.split(/\s+/)[0] || '');
  info.description = lines
    .filter(line => !/\b(prix|promo)\b/i.test(line))
    .join('\n')
    .trim();

  // Générer un code produit basé sur le nom du produit
  if (!info.code_produit) {
    const cleanName = info.nom.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    info.code_produit = `PROD-${cleanName.toUpperCase()}`;
  }

  // Générer un numéro de série si non trouvé
  if (!info.numero_serie) {
    info.numero_serie = `SN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  }

  return info;
}

function parsePrice(value) {
  const normalized = String(value).replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  return Number.parseFloat(normalized) || 0;
}

// Fonction pour copier une image dans le dossier uploads
async function copyImageToUploads(sourcePath, productName, index = 0) {
  try {
    const ext = path.extname(sourcePath);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const newFileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${index}_${timestamp}_${random}${ext}`;
    const destPath = path.join(UPLOADS_DIR, newFileName);

    await fs.copyFile(sourcePath, destPath);
    return `/uploads/${newFileName}`;
  } catch (error) {
    console.error('Erreur copie image:', error.message);
    return null;
  }
}

// Fonction pour trouver toutes les images dans un dossier
async function findAllImages(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        images.push(path.join(dirPath, file));
      }
    }
    return images;
  } catch (error) {
    console.error('Erreur recherche images:', error.message);
    return [];
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
async function insertProduct(productInfo, imageUrl, imagesGalerie) {
  const sql = `INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url, images_galerie)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const result = await executeMySQL(sql, [
    productInfo.code_produit,
    productInfo.nom,
    productInfo.description,
    productInfo.prix_achat || 0,
    productInfo.prix_vente || 0,
    imageUrl || null,
    imagesGalerie ? JSON.stringify(imagesGalerie) : null
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
    await prepareDatabase();
    await fs.rm(UPLOADS_DIR, { recursive: true, force: true });
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
        productInfo.code_produit = `PROD-${String(i).padStart(2, '0')}`;
        productInfo.quantite = 10;
        console.log(`📦 Produit identifié: ${productInfo.nom}`);
        console.log(`   - Code: ${productInfo.code_produit}`);
        console.log(`   - Prix achat: ${productInfo.prix_achat || 'N/A'}`);
        console.log(`   - Prix vente: ${productInfo.prix_vente || 'N/A'}`);
        console.log(`   - Quantité: ${productInfo.quantite}`);

        // Trouver et copier TOUTES les images du dossier
        const imagePaths = await findAllImages(folderPath);
        console.log(`🖼️  ${imagePaths.length} image(s) trouvée(s) dans le dossier`);

        let imageUrl = null;
        let imagesGalerie = [];

        if (imagePaths.length > 0) {
          // Copier toutes les images
          for (let j = 0; j < imagePaths.length; j++) {
            const copiedImage = await copyImageToUploads(imagePaths[j], productInfo.nom, j);
            if (copiedImage) {
              imagesGalerie.push(copiedImage);
              console.log(`   ✅ Image ${j + 1}/${imagePaths.length} copiée: ${copiedImage}`);
            }
          }

          // Utiliser la première image comme image principale
          imageUrl = imagesGalerie[0];
          console.log(`📸 Image principale: ${imageUrl}`);
        } else {
          console.log(`⚠️  Aucune image trouvée dans le dossier`);
        }

        // Insérer le produit en base de données avec galerie
        console.log(`💾 Insertion du produit en base de données...`);
        const productId = await insertProduct(productInfo, imageUrl, imagesGalerie);
        if (!productId) {
          console.log(`❌ Échec de l'insertion du produit`);
          results.failed++;
          results.errors.push(`Dossier ${i}: Échec insertion produit`);
          continue;
        }
        console.log(`✅ Produit inséré (ID: ${productId}) avec ${imagesGalerie.length} image(s)`);

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