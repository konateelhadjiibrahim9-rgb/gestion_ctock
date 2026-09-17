# Guide des opérations de gestion de stock

## 📋 Fichier créé
`operations_stock.sql` - Contient toutes les requêtes SQL pour les opérations de stock

## 🚀 Opérations disponibles

### 1. ENREGISTRER UNE VENTE

**But** : Passer le statut d'un exemplaire à 'Vendu' et tracer le mouvement

**Étapes** :
1. Identifier le numéro de série de l'appareil vendu
2. Exécuter la transaction de vente

**Exemple d'utilisation** :
```sql
-- Remplacez 'DELL3350-001' par le numéro de série réel
START TRANSACTION;

SET @exemplaire_id = (SELECT id FROM exemplaires WHERE num_serie = 'DELL3350-001');

UPDATE exemplaires 
SET statut = 'Vendu', etat_physique = 'Vendu'
WHERE id = @exemplaire_id;

INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES (@exemplaire_id, 'sortie', 1, NOW(), 'Vente', 'Vente client');

COMMIT;
```

### 2. ENREGISTRER UNE ENTRÉE EN RÉPARATION

**But** : Envoyer un appareil en réparation et tracer le mouvement

**Exemple d'utilisation** :
```sql
-- Remplacez 'DELL3350-002' par le numéro de série réel
START TRANSACTION;

SET @exemplaire_id = (SELECT id FROM exemplaires WHERE num_serie = 'DELL3350-002');

UPDATE exemplaires 
SET statut = 'En réparation'
WHERE id = @exemplaire_id;

INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES (@exemplaire_id, 'sortie', 1, NOW(), 'Réparation', 'Envoyé en réparation');

COMMIT;
```

### 3. ENREGISTRER LE RETOUR DE RÉPARATION

**But** : Réceptionner un appareil réparé et le remettre en stock

**Exemple d'utilisation** :
```sql
-- Remplacez 'DELL3350-002' par le numéro de série réel
START TRANSACTION;

SET @exemplaire_id = (SELECT id FROM exemplaires WHERE num_serie = 'DELL3350-002');

UPDATE exemplaires 
SET statut = 'En stock',
    etat_physique = 'Réparé'
WHERE id = @exemplaire_id;

INSERT INTO mouvements_stock (exemplaire_id, type_mouvement, quantite, date_mouvement, motif, commentaire)
VALUES (@exemplaire_id, 'entree', 1, NOW(), 'Retour réparation', 'Retour de réparation - appareil fonctionnel');

COMMIT;
```

### 4. HISTORIQUE DES MOUVEMENTS PAR NUMÉRO DE SÉRIE

**But** : Voir tout l'historique des mouvements pour un appareil spécifique

**Requête** :
```sql
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
JOIN exemplaires e ON m.exemplaire_id = e.id
JOIN produits p ON e.id_produit = p.id
WHERE e.num_serie = 'DELL3350-001'
ORDER BY m.date_mouvement DESC;
```

## 📊 Requêtes additionnelles utiles

### État du stock par produit
```sql
SELECT 
    p.code_produit,
    p.nom,
    COUNT(e.id) as total_exemplaires,
    SUM(CASE WHEN e.statut = 'En stock' THEN 1 ELSE 0 END) as en_stock,
    SUM(CASE WHEN e.statut = 'Vendu' THEN 1 ELSE 0 END) as vendus,
    SUM(CASE WHEN e.statut = 'En réparation' THEN 1 ELSE 0 END) as en_reparation
FROM produits p
LEFT JOIN exemplaires e ON p.id = e.id_produit
GROUP BY p.id, p.code_produit, p.nom;
```

### Exemplaires disponibles à la vente
```sql
SELECT 
    e.num_serie,
    p.nom as produit,
    p.prix_vente,
    e.etat_physique
FROM exemplaires e
JOIN produits p ON e.id_produit = p.id
WHERE e.statut = 'En stock'
ORDER BY p.nom, e.num_serie;
```

### Derniers mouvements de stock
```sql
SELECT 
    e.num_serie,
    p.nom as produit,
    m.type_mouvement,
    m.motif,
    DATE_FORMAT(m.date_mouvement, '%d/%m/%Y %H:%i') as date
FROM mouvements_stock m
JOIN exemplaires e ON m.exemplaire_id = e.id
JOIN produits p ON e.id_produit = p.id
ORDER BY m.date_mouvement DESC
LIMIT 10;
```

## 💡 Conseils d'utilisation

1. **Toujours utiliser des transactions** (`START TRANSACTION` ... `COMMIT`) pour garantir la cohérence des données
2. **Remplacer les numéros de série** dans les exemples par vos valeurs réelles
3. **Personnaliser les commentaires** pour tracer l'origine des mouvements
4. **Vérifier les résultats** après chaque opération importante

## 🔧 Structure des transactions

Chaque opération importante suit ce pattern :
1. `START TRANSACTION` - Début de la transaction
2. Identification de l'exemplaire (SELECT id)
3. Mise à jour du statut (UPDATE exemplaires)
4. Enregistrement du mouvement (INSERT mouvements_stock)
5. `COMMIT` - Validation de la transaction

Si une erreur survient, vous pouvez faire `ROLLBACK` pour annuler les changements.