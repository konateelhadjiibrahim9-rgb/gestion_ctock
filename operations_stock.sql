-- Opérations de gestion de stock - Base de données : gestion_stock
-- Ce fichier contient les requêtes pour les opérations courantes

-- ============================================================================
-- 1. ENREGISTRER UNE VENTE
-- ============================================================================
-- Procédure : Change le statut de l'exemplaire à 'Vendu' et ajoute un mouvement de sortie
-- Note : La table exemplaires utilise num_serie comme clé primaire

-- Exemple : Vente de l'exemplaire DELL3350-001
-- Étape 1 : Mettre à jour le statut de l'exemplaire
UPDATE exemplaires 
SET statut = 'Vendu', 
    etat_physique = 'Vendu'
WHERE num_serie = 'DELL3350-001';

-- Étape 2 : Enregistrer le mouvement de stock
INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES (
    'DELL3350-001',
    'sortie',
    1,
    NOW(),
    'Vente',
    'Vente client - Dell Latitude 3350'
);

-- Version combinée (transaction complète)
START TRANSACTION;

-- Mettre à jour l'exemplaire
UPDATE exemplaires 
SET statut = 'Vendu', etat_physique = 'Vendu'
WHERE num_serie = 'DELL3350-001';

-- Enregistrer le mouvement
INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES ('DELL3350-001', 'sortie', 1, NOW(), 'Vente', 'Vente client');

COMMIT;

-- ============================================================================
-- 2. ENREGISTRER UNE ENTRÉE EN RÉPARATION
-- ============================================================================
-- Procédure : Change le statut à 'En réparation' et ajoute un mouvement de sortie (réparation)

-- Exemple : Envoyer DELL3350-002 en réparation
START TRANSACTION;

-- Mettre à jour le statut
UPDATE exemplaires 
SET statut = 'En réparation'
WHERE num_serie = 'DELL3350-002';

-- Enregistrer le mouvement
INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES ('DELL3350-002', 'sortie', 1, NOW(), 'Réparation', 'Envoyé en réparation');

COMMIT;

-- ============================================================================
-- 3. ENREGISTRER LE RETOUR DE RÉPARATION
-- ============================================================================
-- Procédure : Change le statut à 'En stock' et ajoute un mouvement d'entrée

START TRANSACTION;

-- Mettre à jour le statut
UPDATE exemplaires 
SET statut = 'En stock',
    etat_physique = 'Réparé'
WHERE num_serie = 'DELL3350-002';

-- Enregistrer le mouvement
INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES ('DELL3350-002', 'entree', 1, NOW(), 'Retour réparation', 'Retour de réparation - appareil fonctionnel');

COMMIT;

-- ============================================================================
-- 4. HISTORIQUE DES MOUVEMENTS PAR NUMÉRO DE SÉRIE
-- ============================================================================
-- Affiche tous les mouvements pour un numéro de série donné

SELECT 
    e.num_serie,
    p.nom as produit,
    m.type_mouvement,
    m.quantite,
    m.date_mouvement,
    m.motif,
    m.commentaire,
    e.statut as statut_actuel
FROM mouvements_stock m
JOIN exemplaires e ON m.exemplaire_id = e.num_serie
JOIN produits p ON e.id_produit = p.id_produit
WHERE e.num_serie = 'DELL3350-001'
ORDER BY m.date_mouvement DESC;

-- Version avec détails complets
SELECT 
    e.num_serie as 'Numéro de série',
    p.nom as 'Produit',
    p.code_produit as 'Code produit',
    m.type_mouvement as 'Type mouvement',
    m.quantite as 'Quantité',
    DATE_FORMAT(m.date_mouvement, '%d/%m/%Y %H:%i') as 'Date',
    m.motif as 'Motif',
    m.commentaire as 'Commentaire',
    e.statut as 'Statut actuel',
    e.etat_physique as 'État physique'
FROM mouvements_stock m
JOIN exemplaires e ON m.exemplaire_id = e.num_serie
JOIN produits p ON e.id_produit = p.id_produit
WHERE e.num_serie = 'DELL3350-001'
ORDER BY m.date_mouvement DESC;

-- ============================================================================
-- 5. REQUÊTES UTILES ADDITIONNELLES
-- ============================================================================

-- Voir le stock actuel par produit
SELECT 
    p.code_produit,
    p.nom,
    COUNT(e.num_serie) as total_exemplaires,
    SUM(CASE WHEN e.statut = 'En stock' THEN 1 ELSE 0 END) as en_stock,
    SUM(CASE WHEN e.statut = 'Vendu' THEN 1 ELSE 0 END) as vendus,
    SUM(CASE WHEN e.statut = 'En réparation' THEN 1 ELSE 0 END) as en_reparation
FROM produits p
LEFT JOIN exemplaires e ON p.id_produit = e.id_produit
GROUP BY p.id_produit, p.code_produit, p.nom;

-- Voir les exemplaires disponibles à la vente
SELECT 
    e.num_serie,
    p.nom as produit,
    p.prix_vente,
    e.etat_physique
FROM exemplaires e
JOIN produits p ON e.id_produit = p.id_produit
WHERE e.statut = 'En stock'
ORDER BY p.nom, e.num_serie;

-- Derniers mouvements de stock (tous produits)
SELECT 
    e.num_serie,
    p.nom as produit,
    m.type_mouvement,
    m.motif,
    DATE_FORMAT(m.date_mouvement, '%d/%m/%Y %H:%i') as date
FROM mouvements_stock m
JOIN exemplaires e ON m.exemplaire_id = e.num_serie
JOIN produits p ON e.id_produit = p.id_produit
ORDER BY m.date_mouvement DESC
LIMIT 10;