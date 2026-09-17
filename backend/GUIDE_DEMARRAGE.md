# 🚀 Guide de Démarrage Rapide - API Gestion de Stock

## ⚡ Démarrage en 3 étapes

### 1️⃣ Installation des dépendances
```bash
cd backend
npm install
```

### 2️⃣ Vérification de la configuration
Ouvrez le fichier `.env` et vérifiez :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_stock
PORT=3000
```

### 3️⃣ Démarrage du serveur
```bash
npm start
```

✅ Le serveur démarre sur `http://localhost:3000`

## 🧪 Premier test

### Test 1 : Vérifier que le serveur fonctionne
Ouvrez votre navigateur et allez sur :
```
http://localhost:3000
```

Vous devriez voir :
```json
{
  "message": "API de gestion de stock",
  "version": "1.0.0",
  "endpoints": {
    "produits": "/api/produits",
    "exemplaires": "/api/exemplaires",
    "mouvements": "/api/mouvements",
    "stats": "/api/stats"
  }
}
```

### Test 2 : Lister les produits
```
http://localhost:3000/api/produits
```

### Test 3 : Lister les exemplaires
```
http://localhost:3000/api/exemplaires
```

## 🛠️ Outils de test

### Option 1 : VS Code avec REST Client
1. Installez l'extension "REST Client" dans VS Code
2. Ouvrez le fichier `requests.http`
3. Cliquez sur "Send Request" au-dessus de chaque requête

### Option 2 : Postman
1. Importez le fichier `requests.http` comme collection
2. Exécutez les requêtes

### Option 3 : cURL
```bash
# Lister les produits
curl http://localhost:3000/api/produits

# Lister les exemplaires
curl http://localhost:3000/api/exemplaires

# Obtenir le résumé du stock
curl http://localhost:3000/api/stats/stock-summary
```

## 🔧 Problèmes courants

### "Cannot connect to database"
- Vérifiez que WampServer est démarré
- Vérifiez que le service MySQL est actif
- Vérifiez les identifiants dans `.env`

### "Port already in use"
- Changez le PORT dans `.env` (ex: PORT=3001)
- Ou arrêtez le processus utilisant le port 3000

### "Module not found"
- Assurez-vous d'avoir exécuté `npm install`
- Vérifiez que vous êtes dans le dossier `backend`

## 📝 Prochaine étape

Une fois le serveur démarré et testé :
1. Importez vos données avec les scripts SQL
2. Testez les endpoints avec `requests.http`
3. Intégrez l'API dans votre application frontend

## 🎯 Exemple de workflow complet

1. **Démarrer le serveur** : `npm start`
2. **Importer les données** : Exécuter `import_produits.sql` et `import_exemplaires.sql` dans phpMyAdmin
3. **Tester l'API** : Utiliser `requests.http`
4. **Créer une vente** : POST `/api/mouvements/vente`
5. **Vérifier l'historique** : GET `/api/mouvements/historique/DELL3350-001`
6. **Voir les stats** : GET `/api/stats/stock-summary`

---

**Votre API est prête ! 🎉**