const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rendre l'upload middleware disponible pour les routes
app.upload = upload;

// Routes
const produitsController = require('./controllers/produitsController');

// Produits routes avec upload middleware
app.get('/api/produits', produitsController.getAllProduits);
app.get('/api/produits/:id_produit', produitsController.getProduitById);
app.post('/api/produits', upload.single('image'), produitsController.createProduit);
app.put('/api/produits/:id_produit', upload.single('image'), produitsController.updateProduit);
app.delete('/api/produits/:id_produit', produitsController.deleteProduit);

app.use('/api/exemplaires', require('./routes/exemplaires'));
app.use('/api/mouvements', require('./routes/mouvements'));
app.use('/api/stats', require('./routes/stats'));

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API de gestion de stock',
    version: '1.0.0',
    endpoints: {
      produits: '/api/produits',
      exemplaires: '/api/exemplaires',
      mouvements: '/api/mouvements',
      stats: '/api/stats'
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📦 API disponible sur http://localhost:${PORT}/api`);
});