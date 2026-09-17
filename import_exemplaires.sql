-- Importation des exemplaires dans la table exemplaires
-- Base de données : gestion_stock
-- IMPORTANT : Exécuter d'abord import_produits.sql pour que l'ID du produit existe
-- Note : La table exemplaires utilise num_serie comme clé primaire et id_produit comme clé étrangère

-- Insertion des 6 exemplaires Dell Latitude 3350
-- Note : id_produit fait référence à l'id_produit auto-incrémenté de la table produits
INSERT INTO exemplaires (num_serie, id_produit, statut, etat_physique)
VALUES 
('DELL3350-001', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion'),
('DELL3350-002', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion'),
('DELL3350-003', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion'),
('DELL3350-004', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion'),
('DELL3350-005', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion'),
('DELL3350-006', (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350'), 'En stock', 'Occasion');

-- Vérification de l'insertion
SELECT * FROM exemplaires WHERE id_produit = (SELECT id_produit FROM produits WHERE code_produit = 'DELL-3350');