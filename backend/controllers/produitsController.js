const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { matchProducts } = require('../services/searchMatcher');

// Fonction utilitaire pour supprimer un fichier de manière sécurisée
async function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  
  try {
    // Extraire le nom du fichier de l'URL
    const fileName = path.basename(imageUrl);
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    
    // Vérifier si le fichier existe avant de le supprimer
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`Fichier image supprimé: ${fileName}`);
  } catch (error) {
    // Ignorer les erreurs si le fichier n'existe pas déjà
    if (error.code !== 'ENOENT') {
      console.error(`Erreur lors de la suppression du fichier image: ${error.message}`);
    }
  }
}

// GET /api/produits - Lister tous les produits
exports.getAllProduits = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, COUNT(CASE WHEN e.statut = 'En stock' THEN 1 END) AS stock_disponible
      FROM produits p
      LEFT JOIN exemplaires e ON e.id_produit = p.id_produit
      GROUP BY p.id_produit
      ORDER BY p.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/produits/:id_produit - Obtenir un produit spécifique
exports.getProduitById = async (req, res) => {
  try {
    const { id_produit } = req.params;
    
    const [rows] = await db.query('SELECT * FROM produits WHERE id_produit = ?', [id_produit]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/produits/:id_produit/images - Supprimer une image de galerie
exports.removeGalleryImage = async (req, res) => {
  try {
    const { id_produit } = req.params;
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'URL de l’image requise' });

    const [rows] = await db.query(
      'SELECT image_url, images_galerie FROM produits WHERE id_produit = ?',
      [id_produit]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });

    const currentGallery = rows[0].images_galerie
      ? (typeof rows[0].images_galerie === 'string' ? JSON.parse(rows[0].images_galerie) : rows[0].images_galerie)
      : [];
    const gallery = currentGallery.filter(image => image !== image_url);
    const wasMainImage = rows[0].image_url === image_url;
    if (!wasMainImage && gallery.length === currentGallery.length) {
      return res.status(404).json({ error: 'Image non trouvée dans la galerie' });
    }

    const nextMainImage = wasMainImage ? (gallery[0] || null) : rows[0].image_url;
    await db.query(
      'UPDATE produits SET image_url = ?, images_galerie = ? WHERE id_produit = ?',
      [nextMainImage, gallery.length ? JSON.stringify(gallery) : null, id_produit]
    );
    await deleteImageFile(image_url);

    res.json({ image_url: nextMainImage, images_galerie: gallery });
  } catch (error) {
    console.error('Erreur lors de la suppression de l’image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/produits/match-search - Rechercher des produits depuis un listing libre
exports.matchSearch = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Le texte à analyser est requis' });
    }

    const [products] = await db.query(`
            SELECT p.*,
              COUNT(CASE WHEN e.statut = 'En stock' THEN 1 END) AS stock_disponible,
              MIN(CASE WHEN e.statut = 'En stock' THEN e.num_serie END) AS num_serie_disponible
      FROM produits p
      LEFT JOIN exemplaires e ON e.id_produit = p.id_produit
      GROUP BY p.id_produit
      ORDER BY p.nom
    `);
    const availableProducts = products.filter(product => Number(product.stock_disponible) > 0);

    res.json({
      results: matchProducts(text, availableProducts),
      productsAnalyzed: availableProducts.length
    });
  } catch (error) {
    console.error('Erreur lors de la recherche intelligente:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l’analyse' });
  }
};

// POST /api/produits - Ajouter un nouveau produit
exports.createProduit = async (req, res) => {
  try {
    const { nom, description, prix_achat, prix_vente, images_galerie } = req.body;
    
    if (!nom) {
      return res.status(400).json({ error: 'Le nom du produit est requis' });
    }

    const [lastProduct] = await db.query('SELECT COALESCE(MAX(id_produit), 0) + 1 AS next_id FROM produits');
    const code_produit = `PROD-${String(lastProduct[0].next_id).padStart(2, '0')}`;

    // Gérer l'image si elle est fournie
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      'INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url, images_galerie) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code_produit, nom, description, prix_achat, prix_vente, image_url, images_galerie ? JSON.stringify(images_galerie) : null]
    );

    res.status(201).json({ 
      id_produit: result.insertId, 
      code_produit, 
      nom, 
      description, 
      prix_achat, 
      prix_vente,
      image_url,
      images_galerie
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/produits/:id_produit - Modifier un produit
exports.updateProduit = async (req, res) => {
  try {
    const { id_produit } = req.params;
    const { code_produit, nom, description, prix_achat, prix_vente, images_galerie } = req.body;
    
    if (!code_produit || !nom) {
      return res.status(400).json({ error: 'Code produit et nom sont requis' });
    }

    // Vérifier si le produit existe
    const [existing] = await db.query('SELECT id_produit, image_url, images_galerie FROM produits WHERE id_produit = ?', [id_produit]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Gérer l'image si elle est fournie
    let image_url = existing[0].image_url; // Conserver l'ancienne image par défaut
    if (req.file) {
      // Supprimer l'ancienne image si elle existe et est différente de la nouvelle
      if (existing[0].image_url && existing[0].image_url !== `/uploads/${req.file.filename}`) {
        await deleteImageFile(existing[0].image_url);
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    const galleryValue = images_galerie === undefined
      ? existing[0].images_galerie
      : (images_galerie ? JSON.stringify(images_galerie) : null);
    const [result] = await db.query(
      'UPDATE produits SET code_produit = ?, nom = ?, description = ?, prix_achat = ?, prix_vente = ?, image_url = ?, images_galerie = ? WHERE id_produit = ?',
      [code_produit, nom, description, prix_achat, prix_vente, image_url, galleryValue, id_produit]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ 
      id_produit, 
      code_produit, 
      nom, 
      description, 
      prix_achat, 
      prix_vente,
      image_url,
      images_galerie
    });
  } catch (error) {
    console.error('Erreur lors de la modification du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/produits/:id_produit - Supprimer un produit
exports.deleteProduit = async (req, res) => {
  try {
    const { id_produit } = req.params;
    
    // Vérifier si le produit existe
    const [existing] = await db.query('SELECT id_produit, image_url, images_galerie FROM produits WHERE id_produit = ?', [id_produit]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier s'il y a des exemplaires liés
    const [exemplaires] = await db.query('SELECT COUNT(*) as count FROM exemplaires WHERE id_produit = ?', [id_produit]);
    if (exemplaires[0].count > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce produit',
        details: `${exemplaires[0].count} exemplaire(s) lié(s) à ce produit. Supprimez d\'abord les exemplaires.`
      });
    }

    // Supprimer le fichier image associé si présent
    if (existing[0].image_url) {
      await deleteImageFile(existing[0].image_url);
    }
    if (existing[0].images_galerie) {
      const gallery = typeof existing[0].images_galerie === 'string'
        ? JSON.parse(existing[0].images_galerie)
        : existing[0].images_galerie;
      for (const imageUrl of gallery || []) {
        if (imageUrl !== existing[0].image_url) await deleteImageFile(imageUrl);
      }
    }

    const [result] = await db.query('DELETE FROM produits WHERE id_produit = ?', [id_produit]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès', id_produit });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};