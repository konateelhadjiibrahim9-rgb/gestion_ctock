const express = require('express');
const router = express.Router();
const exemplairesController = require('../controllers/exemplairesController');

// GET /api/exemplaires - Lister tous les exemplaires
router.get('/', exemplairesController.getAllExemplaires);

// GET /api/exemplaires/:num_serie - Obtenir les détails d'un exemplaire
router.get('/:num_serie', exemplairesController.getExemplaireByNumSerie);

// POST /api/exemplaires - Ajouter un ou plusieurs exemplaires
router.post('/', exemplairesController.createExemplaires);

// PUT /api/exemplaires/:num_serie - Modifier un exemplaire
router.put('/:num_serie', exemplairesController.updateExemplaire);

// DELETE /api/exemplaires/:num_serie - Supprimer un exemplaire
router.delete('/:num_serie', exemplairesController.deleteExemplaire);

module.exports = router;