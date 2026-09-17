const db = require('../config/database');

// POST /api/mouvements/vente - Enregistrer une vente
exports.enregistrerVente = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { num_serie, commentaire } = req.body;
    
    if (!num_serie) {
      await connection.rollback();
      return res.status(400).json({ error: 'Numéro de série est requis' });
    }

    // Récupérer les infos de l'exemplaire
    const [exemplaire] = await connection.query(
      'SELECT num_serie, statut FROM exemplaires WHERE num_serie = ?',
      [num_serie]
    );
    
    if (exemplaire.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }
    
    if (exemplaire[0].statut === 'Vendu') {
      await connection.rollback();
      return res.status(400).json({ error: 'Cet exemplaire est déjà vendu' });
    }

    // Mettre à jour le statut de l'exemplaire
    await connection.query(
      'UPDATE exemplaires SET statut = ?, etat_physique = ? WHERE num_serie = ?',
      ['Vendu', 'Vendu', num_serie]
    );

    // Enregistrer le mouvement de stock
    await connection.query(
      'INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, ?, ?)',
      [num_serie, 'Vente', commentaire || 'Vente client']
    );

    await connection.commit();
    
    res.json({ 
      message: 'Vente enregistrée avec succès',
      num_serie,
      statut: 'Vendu'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de l\'enregistrement de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// POST /api/mouvements/reparation - Passer un appareil en réparation
exports.envoyerReparation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { num_serie, commentaire } = req.body;
    
    if (!num_serie) {
      await connection.rollback();
      return res.status(400).json({ error: 'Numéro de série est requis' });
    }

    // Récupérer les infos de l'exemplaire
    const [exemplaire] = await connection.query(
      'SELECT num_serie, statut FROM exemplaires WHERE num_serie = ?',
      [num_serie]
    );
    
    if (exemplaire.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }
    
    if (exemplaire[0].statut === 'En réparation') {
      await connection.rollback();
      return res.status(400).json({ error: 'Cet exemplaire est déjà en réparation' });
    }

    // Mettre à jour le statut de l'exemplaire
    await connection.query(
      'UPDATE exemplaires SET statut = ? WHERE num_serie = ?',
      ['En réparation', num_serie]
    );

    // Enregistrer le mouvement de stock
    await connection.query(
      'INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, ?, ?)',
      [num_serie, 'Mise en réparation', commentaire || 'Envoyé en réparation']
    );

    await connection.commit();
    
    res.json({ 
      message: 'Appareil envoyé en réparation avec succès',
      num_serie,
      statut: 'En réparation'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de l\'envoi en réparation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// POST /api/mouvements/retour-reparation - Retour de réparation
exports.retourReparation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { num_serie, commentaire, etat_physique } = req.body;
    
    if (!num_serie) {
      await connection.rollback();
      return res.status(400).json({ error: 'Numéro de série est requis' });
    }

    // Récupérer les infos de l'exemplaire
    const [exemplaire] = await connection.query(
      'SELECT num_serie, statut FROM exemplaires WHERE num_serie = ?',
      [num_serie]
    );
    
    if (exemplaire.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }
    
    if (exemplaire[0].statut !== 'En réparation') {
      await connection.rollback();
      return res.status(400).json({ error: 'Cet exemplaire n\'est pas en réparation' });
    }

    // Mettre à jour le statut de l'exemplaire
    await connection.query(
      'UPDATE exemplaires SET statut = ?, etat_physique = ? WHERE num_serie = ?',
      ['En stock', etat_physique || 'Réparé', num_serie]
    );

    // Enregistrer le mouvement de stock
    await connection.query(
      'INSERT INTO mouvements_stock (num_serie, type_mouvement, commentaire) VALUES (?, ?, ?)',
      [num_serie, 'Retour', commentaire || 'Retour de réparation - appareil fonctionnel']
    );

    await connection.commit();
    
    res.json({ 
      message: 'Appareil retourné de réparation avec succès',
      num_serie,
      statut: 'En stock',
      etat_physique: etat_physique || 'Réparé'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors du retour de réparation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// GET /api/mouvements/historique/:num_serie - Obtenir l'historique complet d'un numéro de série
exports.getHistorique = async (req, res) => {
  try {
    const { num_serie } = req.params;
    
    const [rows] = await db.query(`
      SELECT 
        e.num_serie as 'num_serie',
        p.nom as 'produit',
        p.code_produit as 'code_produit',
        p.image_url as 'image_url',
        m.type_mouvement as 'type_mouvement',
        DATE_FORMAT(m.date_mouvement, '%d/%m/%Y %H:%i') as 'date_mouvement',
        m.commentaire as 'commentaire',
        e.statut as 'statut_actuel',
        e.etat_physique as 'etat_physique'
      FROM mouvements_stock m
      JOIN exemplaires e ON m.num_serie = e.num_serie
      JOIN produits p ON e.id_produit = p.id_produit
      WHERE e.num_serie = ?
      ORDER BY m.date_mouvement DESC
    `, [num_serie]);

    if (rows.length === 0) {
      // Si aucun mouvement, vérifier si l'exemplaire existe
      const [exemplaireCheck] = await db.query(
        'SELECT * FROM exemplaires WHERE num_serie = ?', 
        [num_serie]
      );
      
      if (exemplaireCheck.length === 0) {
        return res.status(404).json({ error: 'Exemplaire non trouvé' });
      }
      
      // Retourner les infos de l'exemplaire sans historique
      const [produitInfo] = await db.query(
        'SELECT nom, code_produit, image_url FROM produits WHERE id_produit = ?', 
        [exemplaireCheck[0].id_produit]
      );
      
      return res.json({
        num_serie,
        produit: produitInfo[0]?.nom || 'N/A',
        code_produit: produitInfo[0]?.code_produit || 'N/A',
        image_url: produitInfo[0]?.image_url || null,
        statut_actuel: exemplaireCheck[0].statut,
        etat_physique: exemplaireCheck[0].etat_physique,
        mouvements: [],
        message: 'Aucun mouvement enregistré pour cet exemplaire'
      });
    }

    res.json({
      num_serie: rows[0].num_serie,
      produit: rows[0].produit,
      code_produit: rows[0].code_produit,
      image_url: rows[0].image_url,
      statut_actuel: rows[0].statut_actuel,
      etat_physique: rows[0].etat_physique,
      mouvements: rows
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};