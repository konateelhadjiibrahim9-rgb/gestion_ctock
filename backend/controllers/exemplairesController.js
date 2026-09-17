const db = require('../config/database');

// GET /api/exemplaires - Lister tous les exemplaires avec le nom du produit
exports.getAllExemplaires = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, p.nom as nom_produit, p.code_produit, p.image_url 
      FROM exemplaires e 
      LEFT JOIN produits p ON e.id_produit = p.id_produit 
      ORDER BY p.nom, e.num_serie
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des exemplaires:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/exemplaires/:num_serie - Obtenir les détails d'un exemplaire spécifique
exports.getExemplaireByNumSerie = async (req, res) => {
  try {
    const { num_serie } = req.params;
    
    const [rows] = await db.query(`
      SELECT e.*, p.nom as nom_produit, p.code_produit, p.prix_vente, p.image_url 
      FROM exemplaires e 
      LEFT JOIN produits p ON e.id_produit = p.id_produit 
      WHERE e.num_serie = ?
    `, [num_serie]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'exemplaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/exemplaires - Ajouter un ou plusieurs nouveaux exemplaires
exports.createExemplaires = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const exemplaires = req.body;
    
    // Vérifier si c'est un tableau ou un objet unique
    const itemsArray = Array.isArray(exemplaires) ? exemplaires : [exemplaires];
    
    if (itemsArray.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Aucun exemplaire fourni' });
    }

    const results = [];
    
    for (const item of itemsArray) {
      const { num_serie, id_produit, statut, etat_physique } = item;
      
      if (!num_serie || !id_produit) {
        await connection.rollback();
        return res.status(400).json({ error: 'Numéro de série et ID produit sont requis' });
      }

      // Vérifier que le produit existe
      const [produitCheck] = await connection.query(
        'SELECT id_produit FROM produits WHERE id_produit = ?', 
        [id_produit]
      );
      
      if (produitCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: `Produit avec ID ${id_produit} non trouvé` });
      }

      // Vérifier que le numéro de série n'existe pas déjà
      const [serieCheck] = await connection.query(
        'SELECT num_serie FROM exemplaires WHERE num_serie = ?', 
        [num_serie]
      );
      
      if (serieCheck.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: `Numéro de série ${num_serie} existe déjà` });
      }

      // Vérifier si la table a la colonne date_entree
      const [columnCheck] = await connection.query(
        "SHOW COLUMNS FROM exemplaires LIKE 'date_entree'"
      );
      
      let insertQuery, insertValues;
      if (columnCheck.length > 0) {
        insertQuery = 'INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique, date_entree) VALUES (?, ?, ?, ?, NOW())';
        insertValues = [num_serie, id_produit, statut || 'En stock', etat_physique || 'Neuf'];
      } else {
        insertQuery = 'INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique) VALUES (?, ?, ?, ?)';
        insertValues = [num_serie, id_produit, statut || 'En stock', etat_physique || 'Neuf'];
      }

      const [result] = await connection.query(insertQuery, insertValues);

      results.push({
        num_serie,
        id_produit,
        statut: statut || 'En stock',
        etat_physique: etat_physique || 'Neuf'
      });
    }

    await connection.commit();
    res.status(201).json({ 
      message: `${results.length} exemplaire(s) créé(s) avec succès`,
      exemplaires: results 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création des exemplaires:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// PUT /api/exemplaires/:num_serie - Modifier un exemplaire
exports.updateExemplaire = async (req, res) => {
  try {
    const { num_serie } = req.params;
    const { id_produit, statut, etat_physique } = req.body;
    
    // Vérifier si l'exemplaire existe
    const [existing] = await db.query('SELECT num_serie FROM exemplaires WHERE num_serie = ?', [num_serie]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    // Si id_produit est fourni, vérifier que le produit existe
    if (id_produit) {
      const [produitCheck] = await db.query('SELECT id_produit FROM produits WHERE id_produit = ?', [id_produit]);
      if (produitCheck.length === 0) {
        return res.status(400).json({ error: `Produit avec ID ${id_produit} non trouvé` });
      }
    }

    const updates = [];
    const values = [];
    
    if (id_produit !== undefined) {
      updates.push('id_produit = ?');
      values.push(id_produit);
    }
    if (statut !== undefined) {
      updates.push('statut = ?');
      values.push(statut);
    }
    if (etat_physique !== undefined) {
      updates.push('etat_physique = ?');
      values.push(etat_physique);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }
    
    values.push(num_serie);
    
    const [result] = await db.query(
      `UPDATE exemplaires SET ${updates.join(', ')} WHERE num_serie = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    // Récupérer l'exemplaire mis à jour
    const [updated] = await db.query(`
      SELECT e.*, p.nom as nom_produit, p.code_produit, p.image_url 
      FROM exemplaires e 
      LEFT JOIN produits p ON e.id_produit = p.id_produit 
      WHERE e.num_serie = ?
    `, [num_serie]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'exemplaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/exemplaires/:num_serie - Supprimer un exemplaire
exports.deleteExemplaire = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { num_serie } = req.params;
    
    // Vérifier si l'exemplaire existe
    const [existing] = await connection.query('SELECT num_serie FROM exemplaires WHERE num_serie = ?', [num_serie]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    // Supprimer les mouvements de stock liés à cet exemplaire
    await connection.query('DELETE FROM mouvements_stock WHERE num_serie = ?', [num_serie]);

    // Supprimer l'exemplaire
    const [result] = await connection.query('DELETE FROM exemplaires WHERE num_serie = ?', [num_serie]);
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    connection.release();
    res.json({ message: 'Exemplaire supprimé avec succès', num_serie });
  } catch (error) {
    if (connection) connection.release();
    console.error('Erreur lors de la suppression de l\'exemplaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};