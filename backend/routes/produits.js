const express = require('express');
const router = express.Router();
const produitsController = require('../controllers/produitsController');

// GET /api/produits - Lister tous les produits
router.get('/', produitsController.getAllProduits);

// GET /api/produits/:id_produit - Obtenir un produit spécifique
router.get('/:id_produit', produitsController.getProduitById);

// POST /api/produits/match-search - Recherche intelligente par texte
router.post('/match-search', produitsController.matchSearch);

// POST /api/produits - Ajouter un nouveau produit (avec upload d'image)
router.post('/', produitsController.createProduit);

// PUT /api/produits/:id_produit - Modifier un produit (avec upload d'image)
router.put('/:id_produit', produitsController.updateProduit);

// DELETE /api/produits/:id_produit - Supprimer un produit
router.delete('/:id_produit', produitsController.deleteProduit);

module.exports = router;