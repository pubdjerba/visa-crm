# Guide de Configuration Firebase pour VisaFlow CRM

## Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Donnez un nom à votre projet (ex: "visaflow-crm")
4. Suivez les étapes de création

## Étape 2 : Activer Firestore Database

1. Dans votre projet Firebase, allez dans "Build" > "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez le mode :
   - **Mode test** (pour le développement) : Accès en lecture/écriture pendant 30 jours
   - **Mode production** : Nécessite des règles de sécurité
4. Choisissez l'emplacement de votre base de données (ex: europe-west1)

## Étape 3 : Configurer les règles de sécurité Firestore

Pour le développement, vous pouvez utiliser ces règles (à modifier pour la production) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ ATTENTION** : Ces règles permettent un accès complet. Pour la production, implémentez des règles de sécurité appropriées.

## Étape 4 : Obtenir les clés de configuration

1. Dans Firebase Console, cliquez sur l'icône ⚙️ (Paramètres du projet)
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône Web `</>`
4. Enregistrez votre application (ex: "VisaFlow Web")
5. Copiez les valeurs de configuration

## Étape 5 : Configurer les variables d'environnement

1. Copiez le fichier `.env.example` en `.env.local` :
   ```bash
   cp .env.example .env.local
   ```

2. Ouvrez `.env.local` et remplissez avec vos valeurs Firebase :
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre-projet
   VITE_FIREBASE_STORAGE_BUCKET=votre-projet.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

## Étape 6 : Redémarrer le serveur de développement

Après avoir configuré `.env.local`, redémarrez votre serveur :

```bash
npm run dev
```

## Étape 7 : Migrer les données existantes (optionnel)

Si vous avez déjà des données dans localStorage, vous pouvez les migrer vers Firebase en utilisant les fonctions du service Firebase.

## Structure des Collections Firestore

Votre base de données Firestore aura les collections suivantes :

- `clients` - Tous les clients et leurs dossiers
- `requirements` - Documents requis par type de visa
- `resources` - Liens et ressources utiles
- `tasks` - Tâches à faire
- `templates` - Modèles de lettres
- `openingLogs` - Historique des ouvertures de RDV
- `settings` - Paramètres de l'application

## Sécurité

- ⚠️ **Ne commitez JAMAIS** le fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Utilisez `.env.example` comme modèle pour les autres développeurs

## Règles de sécurité recommandées pour la production

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre l'accès uniquement aux utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Pour une sécurité maximale, vous devrez implémenter Firebase Authentication.

## Support

Pour plus d'informations :
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
