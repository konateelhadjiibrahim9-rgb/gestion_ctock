-- Script de nettoyage de la base de données gestion_stock
-- Ce script vide toutes les tables sans supprimer leur structure
-- À exécuter sur la base de données gestion_stock

-- Désactiver les contraintes de clés étrangères temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- Vider les tables dans l'ordre inverse des dépendances
TRUNCATE TABLE mouvements_stock;
TRUNCATE TABLE exemplaires;
TRUNCATE TABLE produits;
TRUNCATE TABLE marques;
TRUNCATE TABLE categories;

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Réinitialiser les AUTO_INCREMENT
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE marques AUTO_INCREMENT = 1;
ALTER TABLE produits AUTO_INCREMENT = 1;
ALTER TABLE mouvements_stock AUTO_INCREMENT = 1;

-- Vérification du nettoyage
SELECT 'Catégories' as table_name, COUNT(*) as remaining_rows FROM categories
UNION ALL
SELECT 'Marques', COUNT(*) FROM marques
UNION ALL
SELECT 'Produits', COUNT(*) FROM produits
UNION ALL
SELECT 'Exemplaires', COUNT(*) FROM exemplaires
UNION ALL
SELECT 'Mouvements', COUNT(*) FROM mouvements_stock;

-- Message de confirmation
SELECT 'Base de données gestion_stock nettoyée avec succès !' as message;