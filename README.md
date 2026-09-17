# Gestion de Stock - Application Full-Stack

Application complète de gestion de stock avec suivi par numéros de série, gestion des ventes, historique des mouvements et gestion des photos produits.

## 📋 Présentation

Système de gestion de stock moderne et complet permettant de :
- Gérer un catalogue de produits avec photos
- Suivre les exemplaires par numéros de série uniques
- Enregistrer les ventes et les mouvements de stock
- Visualiser des statistiques en temps réel
- Maintenir un historique complet des opérations

## 🏗️ Architecture et Technologies

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Multer** - Gestion des uploads de fichiers
- **mysql2** - Driver MySQL avec promises
- **dotenv** - Gestion des variables d'environnement
- **CORS** - Gestion des requêtes cross-origin

### Frontend
- **HTML5** - Structure sémantique
- **JavaScript (Vanilla)** - Logique applicative
- **Tailwind CSS** - Framework CSS utilitaire
- **Font Awesome** - Icônes
- **SPA (Single Page Application)** - Navigation fluide

### Base de Données
- **MySQL** - Système de gestion de base de données relationnelle
- **WampServer** - Serveur local PHP/MySQL

## 📁 Structure du Projet

```
DATA_BASE/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuration de la connexion BDD
│   ├── controllers/
│   │   ├── produitsController.js    # Gestion des produits
│   │   ├── exemplairesController.js # Gestion des exemplaires
│   │   ├── mouvementsController.js  # Gestion des mouvements
│   │   └── statsController.js       # Statistiques
│   ├── routes/
│   │   ├── produits.js          # Routes produits
│   │   ├── exemplaires.js       # Routes exemplaires
│   │   ├── mouvements.js        # Routes mouvements
│   │   └── stats.js             # Routes statistiques
│   ├── uploads/                 # Dossier des images uploadées
│   │   └── .gitkeep
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                # Point d'entrée du serveur
│   └── README.md
├── frontend/
│   ├── index.html               # Interface principale
│   ├── app.js                   # Logique frontend
│   ├── .gitignore
│   └── README.md
├── .gitignore
├── reset_db.sql                 # Script d'initialisation BDD
├── add_image_column.sql         # Script ajout colonne image
├── import_produits.sql          # Script d'import produits
├── import_exemplaires.sql       # Script d'import exemplaires
├── operations_stock.sql         # Script opérations stock
└── README.md                    # Ce fichier
```

## 🚀 Guide d'Installation et Démarrage

### Prérequis
- **WampServer** (ou autre serveur MySQL local)
- **Node.js** (v14 ou supérieur)
- **Navigateur web moderne**

### Étape 1 : Configuration de la Base de Données

1. Démarrez WampServer
2. Ouvrez phpMyAdmin (http://localhost/phpmyadmin)
3. Créez une nouvelle base de données nommée `gestion_stock`
4. Exécutez le script d'initialisation :
   ```sql
   -- Exécutez le contenu de reset_db.sql dans phpMyAdmin
   ```
5. Exécutez le script pour ajouter la colonne image :
   ```sql
   -- Exécutez le contenu de add_image_column.sql
   ```

### Étape 2 : Configuration du Backend

1. Naviguez vers le dossier backend :
   ```bash
   cd backend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement :
   ```bash
   # Créez un fichier .env avec le contenu suivant :
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gestion_stock
   PORT=3000
   ```

4. Démarrez le serveur :
   ```bash
   npm start
   ```
   *Pour le développement avec auto-reload :*
   ```bash
   npm run dev
   ```

Le serveur backend sera accessible sur `http://localhost:3000`

### Étape 3 : Lancement du Frontend

1. Ouvrez le fichier `frontend/index.html` dans votre navigateur
2. Ou utilisez un serveur de développement (Live Server dans VS Code, etc.)
3. L'application sera automatiquement connectée à l'API backend

## 🔌 Endpoints de l'API REST

### Produits
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/produits` | Lister tous les produits |
| GET | `/api/produits/:id_produit` | Obtenir un produit spécifique |
| POST | `/api/produits` | Créer un nouveau produit (avec image) |
| PUT | `/api/produits/:id_produit` | Modifier un produit (avec image) |
| DELETE | `/api/produits/:id_produit` | Supprimer un produit |

### Exemplaires
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/exemplaires` | Lister tous les exemplaires |
| GET | `/api/exemplaires/:id_exemplaire` | Obtenir un exemplaire spécifique |
| POST | `/api/exemplaires` | Créer un nouvel exemplaire |
| PUT | `/api/exemplaires/:id_exemplaire` | Modifier un exemplaire |
| DELETE | `/api/exemplaires/:id_exemplaire` | Supprimer un exemplaire |

### Mouvements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/mouvements` | Lister tous les mouvements |
| GET | `/api/mouvements/:id_mouvement` | Obtenir un mouvement spécifique |
| POST | `/api/mouvements` | Créer un nouveau mouvement |
| GET | `/api/mouvements/exemplaire/:num_serie` | Historique d'un exemplaire |

### Statistiques
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Statistiques globales |
| GET | `/api/stats/dashboard` | Données pour le tableau de bord |

## ✨ Fonctionnalités Clés

### 📦 Gestion des Produits
- **CRUD complet** : Création, lecture, modification, suppression de produits
- **Upload d'images** : Gestion des photos produits avec Multer
- **Suppression automatique** : Les fichiers images sont supprimés automatiquement lors de la suppression ou mise à jour d'un produit
- **Validation** : Contrôle des champs obligatoires

### 🏷️ Gestion des Exemplaires
- **Numéros de série uniques** : Chaque exemplaire est identifié par son numéro de série
- **Statuts variés** : En stock, Vendu, En réparation
- **État physique** : Suivi de l'état des produits
- **Recherche avancée** : Filtrage par statut et recherche par numéro de série

### 💰 Module de Vente
- **Vente rapide** : Enregistrement de vente par numéro de série
- **Historique complet** : Traçabilité de tous les mouvements
- **Commentaires** : Possibilité d'ajouter des notes aux ventes

### 📊 Tableau de Bord
- **Indicateurs en temps réel** : Total exemplaires, stock, vendus, en réparation
- **Valeur du stock** : Calcul automatique de la valeur du stock
- **Ventes totales** : Suivi du chiffre d'affaires
- **Actions rapides** : Accès direct aux fonctionnalités principales

### 🔧 Sécurité et Performance
- **Gestion des erreurs** : Try/catch pour éviter les plantages
- **Validation des fichiers** : Contrôle du type et taille des images
- **Nettoyage automatique** : Suppression des fichiers orphelins
- **CORS configuré** : Communication sécurisée entre frontend et backend

## 📝 Scripts SQL Utilitaires

### Initialisation
- `reset_db.sql` - Création complète de la structure de la base de données
- `add_image_column.sql` - Ajout de la colonne image_url aux produits

### Importation
- `import_produits.sql` - Import de produits depuis CSV
- `import_exemplaires.sql` - Import d'exemplaires depuis CSV

### Opérations
- `operations_stock.sql` - Exemples d'opérations de stock

## 🎯 Points Forts du Projet

- **Architecture modulaire** : Séparation claire entre backend et frontend
- **Gestion automatique des fichiers** : Suppression sécurisée des images
- **Interface utilisateur moderne** : Design responsive avec Tailwind CSS
- **API REST complète** : Tous les endpoints nécessaires pour la gestion
- **Documentation détaillée** : Guides et README dans chaque module
- **Code sécurisé** : Gestion des erreurs et validation des entrées

## 📱 Interface Utilisateur

L'interface utilisateur se compose de 5 sections principales :

1. **Tableau de Bord** - Vue d'ensemble avec statistiques
2. **Produits** - Gestion du catalogue
3. **Stock** - Recherche et filtrage des exemplaires
4. **Vente** - Enregistrement rapide des ventes
5. **Historique** - Consultation des mouvements

## 🔧 Dépannage

### Problèmes courants

**Le serveur ne démarre pas :**
- Vérifiez que Node.js est installé : `node --version`
- Vérifiez que les dépendances sont installées : `npm install`
- Vérifiez le fichier `.env` et la connexion BDD

**Les images ne s'affichent pas :**
- Vérifiez que le dossier `backend/uploads` existe
- Vérifiez les permissions du dossier
- Vérifiez que le serveur sert les fichiers statiques

**Erreur de connexion BDD :**
- Vérifiez que WampServer est démarré
- Vérifiez les identifiants dans le fichier `.env`
- Vérifiez que la base de données `gestion_stock` existe

## 📄 Licence

Ce projet est fourni à des fins éducatives et d'apprentissage.

## 👨‍💻 Auteur

Projet développé avec [Devin](https://devin.ai) - Assistant de développement IA

---

**Repository GitHub** : https://github.com/konateelhadjiibrahim9-rgb/gestion_ctock.git