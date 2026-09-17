const db = require('../config/database');

// GET /api/stats/stock-summary - Obtenir le résumé du stock
exports.getStockSummary = async (req, res) => {
  try {
    // Résumé global
    const [globalStats] = await db.query(`
      SELECT 
        COUNT(e.num_serie) as total_exemplaires,
        SUM(CASE WHEN e.statut = 'En stock' THEN 1 ELSE 0 END) as en_stock,
        SUM(CASE WHEN e.statut = 'Vendu' THEN 1 ELSE 0 END) as vendus,
        SUM(CASE WHEN e.statut = 'En réparation' THEN 1 ELSE 0 END) as en_reparation
      FROM exemplaires e
    `);

    // Résumé par produit
    const [productStats] = await db.query(`
      SELECT 
        p.id_produit,
        p.code_produit,
        p.nom,
        COUNT(e.num_serie) as total_exemplaires,
        SUM(CASE WHEN e.statut = 'En stock' THEN 1 ELSE 0 END) as en_stock,
        SUM(CASE WHEN e.statut = 'Vendu' THEN 1 ELSE 0 END) as vendus,
        SUM(CASE WHEN e.statut = 'En réparation' THEN 1 ELSE 0 END) as en_reparation,
        p.prix_vente
      FROM produits p
      LEFT JOIN exemplaires e ON p.id_produit = e.id_produit
      GROUP BY p.id_produit, p.code_produit, p.nom, p.prix_vente
      ORDER BY p.nom
    `);

    // Valeur du stock
    const [stockValue] = await db.query(`
      SELECT 
        SUM(CASE WHEN e.statut = 'En stock' THEN p.prix_vente ELSE 0 END) as valeur_stock,
        SUM(CASE WHEN e.statut = 'Vendu' THEN p.prix_vente ELSE 0 END) as valeur_ventes
      FROM exemplaires e
      LEFT JOIN produits p ON e.id_produit = p.id_produit
    `);

    res.json({
      global: globalStats[0],
      par_produit: productStats,
      valeurs: stockValue[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};