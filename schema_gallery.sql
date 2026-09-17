-- Schema requis pour l'import par dossier.
ALTER TABLE produits MODIFY description LONGTEXT NULL;
ALTER TABLE produits ADD COLUMN images_galerie JSON NULL AFTER image_url;