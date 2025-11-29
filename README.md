# 🌍 VisaFlow CRM

> Système de gestion de clients pour agence de voyage spécialisée dans les visas

![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.16-cyan)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration Firebase](#-configuration-firebase)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [Technologies](#-technologies)
- [Documentation](#-documentation)

---

## ✨ Fonctionnalités

### 📊 Gestion des clients
- ✅ Annuaire complet des clients
- ✅ Gestion des dossiers de visa
- ✅ Historique des interactions
- ✅ Documents et pièces jointes
- ✅ Suivi des paiements

### 📅 Suivi des rendez-vous
- ✅ Tracker automatique de disponibilités
- ✅ Notifications et alertes
- ✅ Logs d'ouverture de créneaux
- ✅ Modes de priorité (urgent, normal, dormant)

### 📈 Tableau de bord
- ✅ Vue d'ensemble des dossiers en cours
- ✅ Pipeline Kanban
- ✅ Calendrier des rendez-vous
- ✅ Statistiques et métriques

### 🔧 Outils
- ✅ Modèles de lettres personnalisables
- ✅ Liste des documents requis par type de visa
- ✅ Liens et ressources utiles
- ✅ Gestionnaire de tâches
- ✅ Archives des dossiers terminés

### 🔒 Sécurité
- ✅ Écran de verrouillage avec mot de passe
- ✅ Stockage sécurisé dans Firebase
- ✅ Backup automatique

---

## 🚀 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Compte Firebase (gratuit)

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd CRM-VISA/src
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Firebase** (voir section suivante)

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir l'application**
   ```
   http://localhost:5173
   ```

---

## 🔥 Configuration Firebase

### 📖 Guide rapide (15 minutes)

**👉 Pour un guide détaillé, consultez : [`FIREBASE_INDEX.md`](FIREBASE_INDEX.md)**

#### 1. Créer un projet Firebase
- Allez sur https://console.firebase.google.com/
- Créez un nouveau projet "visaflow-crm"
- Activez Firestore Database

#### 2. Récupérer les clés de configuration
- Paramètres du projet → Vos applications → Web
- Copiez les valeurs de configuration

#### 3. Configurer les variables d'environnement
```bash
# Copiez le fichier exemple
cp .env.example .env.local

# Éditez .env.local avec vos vraies valeurs Firebase
```

Contenu de `.env.local` :
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

#### 4. Redémarrer le serveur
```bash
npm run dev
```

### 📚 Documentation Firebase complète

| Document | Description |
|----------|-------------|
| [`FIREBASE_INDEX.md`](FIREBASE_INDEX.md) | 📑 Index et guide de navigation |
| [`QUICK_START.md`](QUICK_START.md) | ⚡ Démarrage rapide (15 min) |
| [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) | 📖 Configuration Firebase Console |
| [`FIREBASE_README.md`](FIREBASE_README.md) | 📘 Guide d'intégration complet |
| [`FIREBASE_COMPLETE.md`](FIREBASE_COMPLETE.md) | 📊 Récapitulatif avec architecture |

---

## 💻 Utilisation

### Premier lancement

1. **Mot de passe par défaut** : `1234`
   - Modifiable dans Paramètres → Mot de passe

2. **Créer votre premier client**
   - Annuaire Clients → Bouton "+"
   - Remplir les informations
   - Ajouter un dossier de visa

3. **Configurer vos paramètres**
   - Paramètres → Personnaliser les types de visa
   - Ajouter vos destinations
   - Configurer les centres de visa

### Fonctionnalités principales

#### 📋 Gestion des dossiers
1. Créer un client dans l'annuaire
2. Ajouter un dossier de visa
3. Suivre le statut (Brouillon → RDV → Dépôt → Traitement → Retrait)
4. Ajouter des documents et notes

#### 🤖 Suivi automatique des RDV
1. Activer le radar dans "Suivi RDV (Bot)"
2. Configurer les identifiants du portail de visa
3. Définir les dates cibles
4. Le système vous alertera automatiquement

#### 📊 Tableau de bord
- Vue d'ensemble des dossiers actifs
- Pipeline Kanban pour visualiser les étapes
- Calendrier des rendez-vous

---

## 📁 Structure du projet

```
CRM-VISA/src/
├── 📄 App.tsx                    # Composant principal
├── 📄 main.tsx                   # Point d'entrée
├── 📄 firebase.ts                # Configuration Firebase
├── 📄 types.ts                   # Types TypeScript
├── 📄 constants.ts               # Constantes et données initiales
│
├── 📁 components/
│   ├── Layout.tsx                # Layout principal avec sidebar
│   ├── LockScreen.tsx            # Écran de verrouillage
│   └── Icons.tsx                 # Composants d'icônes
│
├── 📁 views/
│   ├── Dashboard.tsx             # Tableau de bord
│   ├── ClientList.tsx            # Liste des clients
│   ├── ClientDetail.tsx          # Détails d'un client
│   ├── KanbanView.tsx            # Vue Kanban
│   ├── AppointmentTracker.tsx    # Suivi des RDV
│   ├── CalendarView.tsx          # Calendrier
│   ├── RequirementsView.tsx      # Documents requis
│   ├── ResourcesView.tsx         # Liens utiles
│   ├── TasksView.tsx             # Tâches
│   ├── TemplatesView.tsx         # Modèles de lettres
│   └── SettingsView.tsx          # Paramètres
│
├── 📁 services/
│   ├── firebaseService.ts        # Service CRUD Firebase
│   ├── useFirebase.ts            # Hooks React Firebase
│   └── firebaseExamples.ts       # Exemples d'utilisation
│
└── 📚 Documentation/
    ├── FIREBASE_INDEX.md         # Index de la documentation
    ├── QUICK_START.md            # Guide de démarrage rapide
    ├── FIREBASE_SETUP.md         # Configuration Firebase
    ├── FIREBASE_README.md        # Guide d'intégration
    └── FIREBASE_COMPLETE.md      # Récapitulatif complet
```

---

## 🛠️ Technologies

### Frontend
- **React 19.2.0** - Framework UI
- **TypeScript 5.8.2** - Typage statique
- **Vite 6.2.0** - Build tool
- **TailwindCSS 3.4.16** - Framework CSS

### Backend / Base de données
- **Firebase Firestore** - Base de données NoSQL cloud
- **Firebase SDK** - Synchronisation en temps réel

### Outils
- **Recharts** - Graphiques et statistiques
- **PostCSS** - Traitement CSS
- **Autoprefixer** - Compatibilité CSS

---

## 📚 Documentation

### Pour démarrer
1. 📖 Lisez [`QUICK_START.md`](QUICK_START.md) pour configurer Firebase (15 min)
2. 📖 Consultez [`FIREBASE_INDEX.md`](FIREBASE_INDEX.md) pour naviguer dans la documentation

### Pour développer
- 💻 [`services/firebaseExamples.ts`](services/firebaseExamples.ts) - Exemples de code
- 💻 [`services/useFirebase.ts`](services/useFirebase.ts) - Hooks React
- 📖 [`FIREBASE_README.md`](FIREBASE_README.md) - Guide d'intégration

### Référence
- 📊 [`FIREBASE_COMPLETE.md`](FIREBASE_COMPLETE.md) - Vue d'ensemble complète
- 📖 [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) - Configuration détaillée

---

## 🔒 Sécurité

### Variables d'environnement
- ⚠️ **Ne commitez JAMAIS** le fichier `.env.local`
- ✅ Le fichier `.env.local` est déjà dans `.gitignore`
- ✅ Utilisez `.env.example` comme modèle

### Firebase
- 🔒 Configurez les règles de sécurité Firestore
- 🔒 Activez l'authentification pour la production
- 🔒 Limitez l'accès aux collections sensibles

---

## 🚀 Déploiement

### Build de production
```bash
npm run build
```

### Prévisualisation
```bash
npm run preview
```

### Déploiement sur Vercel/Netlify
1. Connectez votre repository Git
2. Configurez les variables d'environnement dans le dashboard
3. Déployez automatiquement à chaque push

---

## 🆘 Support

### Problèmes courants

**Le serveur ne démarre pas**
```bash
npm install
npm run dev
```

**Erreurs Firebase**
- Vérifiez que `.env.local` existe et contient vos vraies clés
- Consultez [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)

**Erreurs TypeScript**
- Le fichier `vite-env.d.ts` corrige les erreurs de type
- Redémarrez votre éditeur si nécessaire

### Ressources
- 📖 [Documentation Firebase](https://firebase.google.com/docs)
- 📖 [Documentation React](https://react.dev)
- 📖 [Documentation Vite](https://vitejs.dev)
- 📖 [Documentation TailwindCSS](https://tailwindcss.com)

---

## 📝 Licence

Ce projet est privé et destiné à un usage interne.

---

## 🎉 Prêt à commencer !

1. ✅ Installez les dépendances : `npm install`
2. ✅ Configurez Firebase : Lisez [`QUICK_START.md`](QUICK_START.md)
3. ✅ Lancez l'application : `npm run dev`

**Bon développement ! 🚀**

