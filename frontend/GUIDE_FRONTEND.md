# 🎨 Guide Frontend - Interface de Gestion de Stock

## 📋 Vue d'ensemble

Interface web moderne et réactive pour la gestion de stock, construite avec :
- **HTML5** : Structure sémantique
- **Tailwind CSS** : Styling moderne et responsive
- **JavaScript Vanilla** : Logique interactive sans framework
- **Font Awesome** : Icônes professionnelles

## 🚀 Méthodes de démarrage

### Option 1 : Extension Live Server (VS Code) - Recommandée ⭐

1. **Installer l'extension Live Server** dans VS Code
2. **Ouvrir le fichier** `index.html` dans VS Code
3. **Clic droit** sur le fichier → "Open with Live Server"
4. L'application s'ouvre automatiquement sur `http://127.0.0.1:5500`

### Option 2 : Python Simple HTTP Server

```bash
cd frontend
python -m http.server 8080
```

Puis ouvrir : `http://localhost:8080`

### Option 3 : Node.js http-server

```bash
cd frontend
npx http-server -p 8080
```

Puis ouvrir : `http://localhost:8080`

### Option 4 : Ouvrir directement dans le navigateur

Double-cliquez simplement sur `index.html` pour l'ouvrir dans votre navigateur.

## 🔧 Prérequis

- **Backend API démarré** : Le serveur Node.js doit tourner sur `http://localhost:3000`
- **Base de données** : MySQL/WampServer avec la base `gestion_stock` opérationnelle
- **Navigateur moderne** : Chrome, Firefox, Edge, ou Safari

## 📱 Fonctionnalités de l'interface

### 1. Tableau de Bord (Dashboard)

**Cartes statistiques :**
- Total des exemplaires
- Exemplaires en stock (vert)
- Exemplaires vendus (rouge)
- Exemplaires en réparation (orange)
- Valeur du stock
- Valeur des ventes

**Actions rapides :**
- Nouvelle vente
- Rechercher dans le stock
- Voir l'historique
- Actualiser les données

### 2. Gestion du Stock

**Filtrage et recherche :**
- Recherche par numéro de série ou nom de produit
- Filtre par statut (En stock, Vendu, En réparation)
- Tableau responsive avec tri visuel

**Informations affichées :**
- Numéro de série
- Nom du produit et code
- Statut avec badge coloré
- État physique
- Actions rapides (voir détails, copier)

### 3. Interface de Vente Rapide

**Fonctionnalités :**
- Champ de saisie pour numéro de série
- Aperçu automatique du produit lors de la saisie
- Champ commentaire optionnel
- Validation en temps réel
- Historique des ventes récentes

**Workflow :**
1. Saisir/Scanner le numéro de série
2. Vérifier l'aperçu du produit
3. Ajouter un commentaire si nécessaire
4. Cliquer sur "Valider la Vente"
5. Confirmation automatique

### 4. Historique & Traçabilité

**Recherche d'historique :**
- Saisie du numéro de série
- Affichage des informations de l'exemplaire
- Timeline chronologique des mouvements
- Détails de chaque mouvement (date, motif, commentaire)

**Visualisation :**
- Timeline verticale avec indicateurs de couleur
- Entrées (vert) et Sorties (rouge)
- Informations détaillées par mouvement

## 🎨 Design et UX

### Palette de couleurs
- **Principal** : Violet/Indigo (`#667eea` → `#764ba2`)
- **Succès** : Vert (`#10b981`)
- **Erreur** : Rouge (`#ef4444`)
- **Attention** : Orange (`#f59e0b`)
- **Neutre** : Gris (`#6b7280`)

### Responsive Design
- **Mobile** : Interface adaptée pour smartphones
- **Tablette** : Mise en page optimisée
- **Desktop** : Expérience complète avec toutes les fonctionnalités

### Interactions
- Animations fluides (fade-in, slide-in)
- Hover effects sur les cartes et boutons
- Notifications toast pour les actions
- Chargement avec spinners

## 🔌 Connexion API

L'interface se connecte automatiquement à l'API backend :
- **URL de base** : `http://localhost:3000/api`
- **Endpoints utilisés** :
  - `GET /stats/stock-summary` : Statistiques
  - `GET /exemplaires` : Liste des exemplaires
  - `GET /exemplaires/:num_serie` : Détails exemplaire
  - `POST /mouvements/vente` : Enregistrer vente
  - `GET /mouvements/historique/:num_serie` : Historique

## 🐛 Dépannage

### Problème : "Déconnecté" dans le header
**Solution** : Vérifiez que le backend est démarré avec `cd backend && npm start`

### Problème : Erreur lors du chargement des données
**Solution** : 
- Vérifiez que WampServer/MySQL est démarré
- Vérifiez que la base de données `gestion_stock` existe
- Vérifiez les identifiants dans le backend `.env`

### Problème : Les styles ne s'affichent pas correctement
**Solution** : 
- Vérifiez votre connexion internet (Tailwind CSS est chargé via CDN)
- Ou utilisez un serveur local au lieu d'ouvrir directement le fichier

### Problème : Boutons non réactifs
**Solution** : Vérifiez la console JavaScript du navigateur (F12) pour les erreurs

## 📱 Accessibilité

- Navigation au clavier fonctionnelle
- Contrastes respectés
- Textes alternatifs pour les icônes
- Structure sémantique HTML5

## 🔒 Sécurité

- Validation des entrées côté client
- Gestion des erreurs API
- Pas de stockage sensible côté client
- Communication HTTPS recommandée en production

## 🚀 Personnalisation

### Changer les couleurs
Modifiez les classes Tailwind dans `index.html` ou ajoutez des customs colors dans la section `<style>`.

### Ajouter de nouvelles fonctionnalités
1. Ajoutez les endpoints correspondants dans le backend
2. Ajoutez les fonctions JavaScript dans `app.js`
3. Ajoutez l'interface HTML dans `index.html`

### Modifier l'API URL
Changez la constante `API_BASE_URL` dans `app.js` :
```javascript
const API_BASE_URL = 'http://votre-nouvelle-url:port/api';
```

## 📝 Prochaines améliorations possibles

- **Mode sombre** : Toggle pour thème dark/light
- **Export PDF** : Générer des rapports
- **Graphiques** : Visualisation avancée avec Chart.js
- **Notifications** : Web Push API pour alertes
- **Offline** : Service Worker pour mode hors ligne
- **PWA** : Application installable

## 🎯 Checklist de lancement

- [ ] Backend démarré (`cd backend && npm start`)
- [ ] Base de données opérationnelle
- [ ] Frontend ouvert (Live Server ou autre méthode)
- [ ] Test de connexion API (statut "Connecté" visible)
- [ ] Test des fonctionnalités principales

---

**Votre interface frontend est prête ! 🎉**

Ouvrez simplement `index.html` avec votre méthode préférée et commencez à gérer votre stock !