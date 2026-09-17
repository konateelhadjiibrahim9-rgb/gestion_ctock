const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

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
    const [rows] = await db.query('SELECT * FROM produits ORDER BY nom');
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

// POST /api/produits - Ajouter un nouveau produit
exports.createProduit = async (req, res) => {
  try {
    const { code_produit, nom, description, prix_achat, prix_vente } = req.body;
    
    if (!code_produit || !nom) {
      return res.status(400).json({ error: 'Code produit et nom sont requis' });
    }

    // Gérer l'image si elle est fournie
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      'INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [code_produit, nom, description, prix_achat, prix_vente, image_url]
    );

    res.status(201).json({ 
      id_produit: result.insertId, 
      code_produit, 
      nom, 
      description, 
      prix_achat, 
      prix_vente,
      image_url
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
    const { code_produit, nom, description, prix_achat, prix_vente } = req.body;
    
    if (!code_produit || !nom) {
      return res.status(400).json({ error: 'Code produit et nom sont requis' });
    }

    // Vérifier si le produit existe
    const [existing] = await db.query('SELECT id_produit, image_url FROM produits WHERE id_produit = ?', [id_produit]);
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

    const [result] = await db.query(
      'UPDATE produits SET code_produit = ?, nom = ?, description = ?, prix_achat = ?, prix_vente = ?, image_url = ? WHERE id_produit = ?',
      [code_produit, nom, description, prix_achat, prix_vente, image_url, id_produit]
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
      image_url
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
    const [existing] = await db.query('SELECT id_produit, image_url FROM produits WHERE id_produit = ?', [id_produit]);
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