-- Ajout de la colonne image_url à la table produits
-- Base de données : gestion_stock

-- Ajouter la colonne image_url
ALTER TABLE produits ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER description;

-- Vérification de l'ajout
DESCRIBE produits;

-- Message de confirmation
SELECT 'Colonne image_url ajoutée avec succès à la table produits' as message;