const express = require('express');
const router = express.Router();
const mouvementsController = require('../controllers/mouvementsController');

// POST /api/mouvements/vente - Enregistrer a vente
router.post('/vente', mouvementsController.enregistrerVente);
router.post('/annuler-vente', mouvementsController.annulerVente);

// POST /api/mouvements/reparation - Envoyer en réparation
router.post('/reparation', mouvementsController.envoyerReparation);

// POST /api/mouvements/retour-reparation - Retour de réparation
router.post('/retour-reparation', mouvementsController.retourReparation);

// GET /api/mouvements/historique/:num_serie - Historique d'un exemplaire
router.get('/historique/:num_serie', mouvementsController.getHistorique);

module.exports = router;