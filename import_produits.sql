-- Importation des produits dans la table produits
-- Base de données : gestion_stock
-- Note : La table produits utilise id_produit comme clé primaire

-- Insertion du produit Dell Latitude 3350
INSERT INTO produits (code_produit, nom, description, prix_achat, prix_vente)
VALUES ('DELL-3350', 'Dell Latitude 3350', 'Dual Core - RAM 4GB - SSD 128GB - 13.3 pouces - Clavier AZERTY', 45000, 55000);

-- Vérification de l'insertion
SELECT * FROM produits WHERE code_produit = 'DELL-3350';