# 🚀 API de Gestion de Stock - Backend Node.js

API REST complète pour la gestion de stock avec Node.js, Express et MySQL.

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- MySQL/WampServer avec la base de données `gestion_stock`
- npm (gestionnaire de paquets Node.js)

## 🛠️ Installation

1. **Installer les dépendances**
```bash
cd backend
npm install
```

2. **Configurer la base de données**
- Vérifiez que votre fichier `.env` contient les bonnes informations :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_stock
PORT=3000
```

3. **Démarrer le serveur**
```bash
npm start
```

Pour le développement avec rechargement automatique :
```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

## 📡 Endpoints API

### Produits (`/api/produits`)

#### GET `/api/produits`
Lister tous les produits

**Réponse :**
```json
[
  {
    "id": 1,
    "code_produit": "DELL-3350",
    "nom": "Dell Latitude 3350",
    "description": "Dual Core - RAM 4GB - SSD 128GB",
    "prix_achat": 45000,
    "prix_vente": 55000
  }
]
```

#### POST `/api/produits`
Ajouter un nouveau produit

**Corps de la requête :**
```json
{
  "code_produit": "HP-450",
  "nom": "HP ProBook 450",
  "description": "Intel i5 - 8GB RAM - 256GB SSD",
  "prix_achat": 50000,
  "prix_vente": 60000
}
```

### Exemplaires (`/api/exemplaires`)

#### GET `/api/exemplaires`
Lister tous les exemplaires avec informations produit

#### GET `/api/exemplaires/:num_serie`
Obtenir les détails d'un exemplaire spécifique

#### POST `/api/exemplaires`
Ajouter un ou plusieurs exemplaires

**Corps de la requête (un exemplaire) :**
```json
{
  "num_serie": "DELL3350-007",
  "id_produit": 1,
  "statut": "En stock",
  "etat_physique": "Neuf"
}
```

**Corps de la requête (plusieurs exemplaires) :**
```json
[
  {
    "num_serie": "DELL3350-007",
    "id_produit": 1,
    "statut": "En stock",
    "etat_physique": "Neuf"
  },
  {
    "num_serie": "DELL3350-008",
    "id_produit": 1,
    "statut": "En stock",
    "etat_physique": "Neuf"
  }
]
```

### Mouvements (`/api/mouvements`)

#### POST `/api/mouvements/vente`
Enregistrer une vente

**Corps de la requête :**
```json
{
  "num_serie": "DELL3350-001",
  "commentaire": "Vente client Jean Dupont"
}
```

#### POST `/api/mouvements/reparation`
Envoyer un appareil en réparation

**Corps de la requête :**
```json
{
  "num_serie": "DELL3350-002",
  "commentaire": "Problème écran"
}
```

#### POST `/api/mouvements/retour-reparation`
Retour de réparation

**Corps de la requête :**
```json
{
  "num_serie": "DELL3350-002",
  "commentaire": "Écran remplacé",
  "etat_physique": "Réparé"
}
```

#### GET `/api/mouvements/historique/:num_serie`
Obtenir l'historique complet d'un numéro de série

### Statistiques (`/api/stats`)

#### GET `/api/stats/stock-summary`
Obtenir le résumé du stock

**Réponse :**
```json
{
  "global": {
    "total_exemplaires": 10,
    "en_stock": 7,
    "vendus": 2,
    "en_reparation": 1
  },
  "par_produit": [...],
  "valeurs": {
    "valeur_stock": 385000,
    "valeur_ventes": 110000
  }
}
```

## 🧪 Tests

Utilisez le fichier `requests.http` pour tester les endpoints avec VS Code ou importez la collection Postman.

### Tests avec requests.http
1. Ouvrez le fichier `requests.http` dans VS Code
2. Cliquez sur "Send Request" au-dessus de chaque requête

### Tests avec Postman
1. Importez le fichier `requests.http` comme collection
2. Exécutez les requêtes

## 📁 Structure du projet

```
backend/
├── config/
│   └── database.js          # Configuration MySQL
├── controllers/
│   ├── produitsController.js
│   ├── exemplairesController.js
│   ├── mouvementsController.js
│   └── statsController.js
├── routes/
│   ├── produits.js
│   ├── exemplaires.js
│   ├── mouvements.js
│   └── stats.js
├── .env                     # Configuration environnement
├── package.json
├── server.js               # Point d'entrée
├── requests.http           # Fichier de tests
└── README.md
```

## 🔧 Configuration

### Variables d'environnement (.env)
- `DB_HOST`: Hôte MySQL (défaut: localhost)
- `DB_USER`: Utilisateur MySQL (défaut: root)
- `DB_PASSWORD`: Mot de passe MySQL
- `DB_NAME`: Nom de la base de données (défaut: gestion_stock)
- `PORT`: Port du serveur (défaut: 3000)

## 🐛 Dépannage

### Erreur de connexion MySQL
- Vérifiez que WampServer est démarré
- Vérifiez les identifiants dans `.env`
- Assurez-vous que la base de données `gestion_stock` existe

### Port déjà utilisé
- Changez le PORT dans `.env`
- Ou arrêtez le processus utilisant le port 3000

## 📝 Notes

- Toutes les opérations d'écriture utilisent des transactions SQL pour garantir la cohérence
- Les requêtes sont optimisées avec des jointures pour minimiser les appels à la base
- L'API utilise des connexions pool pour gérer efficacement les connexions MySQL