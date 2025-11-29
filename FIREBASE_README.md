# 🔥 Configuration Firebase - VisaFlow CRM

## ✅ Ce qui a été créé

### 1. **Configuration Firebase** (`firebase.ts`)
- Configuration Firebase avec variables d'environnement
- Initialisation de Firestore

### 2. **Service Firebase** (`services/firebaseService.ts`)
- Fonctions CRUD complètes pour toutes les entités :
  - Clients
  - Exigences de visa
  - Ressources externes
  - Tâches
  - Modèles de lettres
  - Logs d'ouverture
  - Paramètres
- Fonctions de sauvegarde et chargement en masse

### 3. **Hooks React** (`services/useFirebase.ts`)
- `useFirebaseSync()` - Pour synchroniser les données
- `useFirebaseData()` - Pour charger les données au démarrage

### 4. **Exemples d'utilisation** (`services/firebaseExamples.ts`)
- Exemples de code pour toutes les opérations
- Guide de migration depuis localStorage

### 5. **Variables d'environnement**
- `.env.example` - Modèle de configuration
- `vite-env.d.ts` - Déclarations TypeScript pour Vite

### 6. **Documentation**
- `FIREBASE_SETUP.md` - Guide complet de configuration

---

## 🚀 Prochaines étapes

### Étape 1 : Configurer Firebase Console

1. Allez sur https://console.firebase.google.com/
2. Créez un nouveau projet ou utilisez un projet existant
3. Activez **Firestore Database**
4. Récupérez vos clés de configuration

### Étape 2 : Créer le fichier .env.local

Dans le dossier `src/`, créez un fichier `.env.local` :

```bash
# Copiez .env.example vers .env.local
cp .env.example .env.local
```

Puis remplissez avec vos vraies valeurs Firebase :

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Étape 3 : Redémarrer le serveur

```bash
npm run dev
```

---

## 📝 Comment intégrer Firebase dans App.tsx

### Option 1 : Synchronisation automatique (Recommandé)

Modifiez votre `App.tsx` pour synchroniser automatiquement avec Firebase :

```typescript
import { useEffect } from 'react';
import { saveClient, loadAllData } from './services/firebaseService';

const App: React.FC = () => {
    // ... votre code existant ...

    // Charger les données depuis Firebase au démarrage
    useEffect(() => {
        const loadFirebaseData = async () => {
            try {
                const data = await loadAllData();
                
                // Si Firebase a des données, les utiliser
                if (data.clients && data.clients.length > 0) {
                    setClients(data.clients);
                }
                if (data.requirements && data.requirements.length > 0) {
                    setRequirements(data.requirements);
                }
                if (data.resources && data.resources.length > 0) {
                    setResources(data.resources);
                }
                if (data.tasks && data.tasks.length > 0) {
                    setTasks(data.tasks);
                }
                if (data.templates && data.templates.length > 0) {
                    setTemplates(data.templates);
                }
                if (data.openingLogs && data.openingLogs.length > 0) {
                    setOpeningLogs(data.openingLogs);
                }
                if (data.settings) {
                    setSettings(data.settings);
                }
            } catch (error) {
                console.error("Erreur chargement Firebase:", error);
                // En cas d'erreur, utiliser localStorage (fallback)
            }
        };

        loadFirebaseData();
    }, []);

    // Synchroniser avec Firebase à chaque changement
    useEffect(() => {
        if (clients.length > 0) {
            clients.forEach(client => saveClient(client));
        }
    }, [clients]);

    // ... reste de votre code ...
};
```

### Option 2 : Utiliser le Hook personnalisé

```typescript
import { useFirebaseSync } from './services/useFirebase';

const App: React.FC = () => {
    const { 
        syncClient, 
        deleteClient: deleteClientFirebase,
        loadFromFirebase 
    } = useFirebaseSync();

    // Charger au démarrage
    useEffect(() => {
        const init = async () => {
            const data = await loadFromFirebase();
            if (data) {
                setClients(data.clients);
                // ... autres données
            }
        };
        init();
    }, []);

    // Modifier handleCreateClient pour synchroniser
    const handleCreateClient = async (newClient: Client) => {
        setClients(prev => [newClient, ...prev]);
        await syncClient(newClient); // Synchroniser avec Firebase
    };

    const handleDeleteClient = async (clientId: string) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        await deleteClientFirebase(clientId); // Supprimer de Firebase
    };
};
```

---

## 🔄 Migration des données existantes

Si vous avez déjà des données dans localStorage, vous pouvez les migrer :

```typescript
import { saveAllData } from './services/firebaseService';

// Fonction à exécuter une seule fois
const migrerVersFirebase = async () => {
    const data = {
        clients: JSON.parse(localStorage.getItem('visaflow_clients') || '[]'),
        requirements: JSON.parse(localStorage.getItem('visaflow_requirements') || '[]'),
        resources: JSON.parse(localStorage.getItem('visaflow_resources') || '[]'),
        tasks: JSON.parse(localStorage.getItem('visaflow_tasks') || '[]'),
        templates: JSON.parse(localStorage.getItem('visaflow_templates') || '[]'),
        openingLogs: JSON.parse(localStorage.getItem('visaflow_opening_logs') || '[]'),
        settings: JSON.parse(localStorage.getItem('visaflow_settings') || '{}')
    };

    await saveAllData(data);
    console.log("✅ Migration terminée!");
};

// Appeler cette fonction dans la console du navigateur
// ou créer un bouton dans l'interface
```

---

## 🔒 Règles de sécurité Firestore

### Pour le développement (permissif)

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

### Pour la production (sécurisé)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📊 Structure de la base de données Firestore

```
visaflow-crm/
├── clients/
│   ├── client_1234567890/
│   │   ├── id: "client_1234567890"
│   │   ├── fullName: "Jean Dupont"
│   │   ├── applications: [...]
│   │   └── ...
│   └── ...
├── requirements/
│   └── ...
├── resources/
│   └── ...
├── tasks/
│   └── ...
├── templates/
│   └── ...
├── openingLogs/
│   └── ...
└── settings/
    └── app_settings/
```

---

## ⚠️ Points importants

1. **Ne commitez JAMAIS `.env.local`** - Il contient vos clés secrètes
2. **Testez d'abord en mode développement** avec les règles permissives
3. **Activez les règles de sécurité** avant de passer en production
4. **Gardez localStorage comme backup** en cas de problème Firebase
5. **Surveillez votre quota Firebase** (gratuit jusqu'à 50k lectures/jour)

---

## 🆘 Dépannage

### Erreur : "Property 'env' does not exist on type 'ImportMeta'"
✅ Résolu - Le fichier `vite-env.d.ts` a été créé

### Erreur : "Firebase: Error (auth/invalid-api-key)"
❌ Vérifiez que vos clés dans `.env.local` sont correctes

### Les données ne se chargent pas
1. Vérifiez que `.env.local` existe et contient les bonnes valeurs
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez les règles de sécurité Firestore

### Erreur CORS
❌ Ajoutez votre domaine dans Firebase Console > Authentication > Settings

---

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✨ Prêt à utiliser !

Tous les fichiers nécessaires ont été créés. Il ne vous reste plus qu'à :

1. ✅ Créer votre projet Firebase
2. ✅ Copier `.env.example` vers `.env.local`
3. ✅ Remplir vos clés Firebase
4. ✅ Redémarrer le serveur (`npm run dev`)
5. ✅ Intégrer les fonctions Firebase dans `App.tsx`

Bon développement ! 🚀
