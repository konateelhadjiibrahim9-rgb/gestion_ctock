# Guide d'importation des données - Gestion de Stock

## ✅ Fichils CSV transférés
- `produits.csv` : déplacé dans le dossier DATA_BASE
- `exemplaires.csv` : créé dans le dossier DATA_BASE
- `import_produits.sql` : script SQL pour importer les produits
- `import_exemplaires.sql` : script SQL pour importer les exemplaires

## 📋 Structure des fichiers
### produits.csv
```
code_produit;nom;description;prix_achat;prix_vente
DELL-3350;Dell Latitude 3350;Dual Core - RAM 4GB - SSD 128GB - 13.3 pouces - Clavier AZERTY;45000;55000
```

### exemplaires.csv
```
num_serie;id_produit;statut;etat_physique
DELL3350-001;1;En stock;Occasion
DELL3350-002;1;En stock;Occasion
DELL3350-003;1;En stock;Occasion
DELL3350-004;1;En stock;Occasion
DELL3350-005;1;En stock;Occasion
DELL3350-006;1;En stock;Occasion
```

## 🚀 Procédure d'importation

### Option 1 : Importation via phpMyAdmin (CSV)
1. Ouvrez phpMyAdmin et sélectionnez la base `gestion_stock`
2. **Import des produits** :
   - Cliquez sur la table `produits` → onglet "Importer"
   - Sélectionnez `produits.csv`
   - Format : CSV
   - Séparateur : `;` (point-virgule)
   - Enclosure : `"` (guillemets)
   - Cochez "La première ligne contient les noms des colonnes"
   - Cliquez sur "Exécuter"

3. **Import des exemplaires** :
   - Cliquez sur la table `exemplaires` → onglet "Importer"
   - Sélectionnez `exemplaires.csv`
   - Même configuration (séparateur `;`)
   - Cliquez sur "Exécuter"

### Option 2 : Importation via SQL (Recommandé)
1. Ouvrez phpMyAdmin et sélectionnez la base `gestion_stock`
2. Cliquez sur l'onglet "SQL"
3. **IMPORTANT** : Exécutez d'abord `import_produits.sql`
4. Vérifiez que le produit a été créé (id = 1)
5. Exécutez ensuite `import_exemplaires.sql`

## 🔍 Vérifications après importation

### Vérifier les produits
```sql
SELECT * FROM produits;
```

### Vérifier les exemplaires
```sql
SELECT * FROM exemplaires;
```

### Vérifier le stock par produit
```sql
SELECT p.nom, COUNT(e.id) as quantite
FROM produits p
LEFT JOIN exemplaires e ON p.id = e.produit_id
GROUP BY p.id, p.nom;
```

## ⚠️ Notes importantes
- Les fichiers CSV utilisent le séparateur `;` (point-virgule) typique d'Excel français
- Les scripts SQL présument que le produit Dell aura l'ID = 1 après insertion
- Si vous avez d'autres produits dans la table, ajustez l'ID dans `import_exemplaires.sql`