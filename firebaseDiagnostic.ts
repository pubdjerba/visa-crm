// Script de diagnostic Firebase
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
    console.log('🔍 Test de connexion Firebase...');

    try {
        // Test 1: Vérifier la configuration
        console.log('📋 Configuration Firebase:', {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Défini' : '❌ Manquant',
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Défini' : '❌ Manquant',
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Défini' : '❌ Manquant',
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Défini' : '❌ Manquant',
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Défini' : '❌ Manquant',
            appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Défini' : '❌ Manquant',
        });

        // Test 2: Essayer de lire la collection tasks
        console.log('📖 Test de lecture de la collection "tasks"...');
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        console.log(`✅ Collection "tasks" accessible. Nombre de documents: ${tasksSnapshot.size}`);

        // Test 3: Essayer d'écrire une tâche de test
        console.log('✍️ Test d\'écriture d\'une tâche de test...');
        const testTask = {
            id: `test_${Date.now()}`,
            text: 'Test Firebase Connection',
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'low' as const,
            category: 'other' as const
        };

        await addDoc(collection(db, 'tasks'), testTask);
        console.log('✅ Écriture réussie dans Firebase !');

        return {
            success: true,
            message: 'Firebase est correctement configuré et fonctionnel'
        };

    } catch (error: any) {
        console.error('❌ Erreur Firebase:', error);

        if (error.code === 'permission-denied') {
            return {
                success: false,
                message: 'Erreur de permissions Firestore. Vérifiez les règles de sécurité.',
                error: error.message
            };
        } else if (error.message?.includes('projectId')) {
            return {
                success: false,
                message: 'Configuration Firebase manquante. Créez un fichier .env.local avec vos credentials.',
                error: error.message
            };
        } else {
            return {
                success: false,
                message: 'Erreur de connexion Firebase',
                error: error.message
            };
        }
    }
};

// Fonction pour afficher les instructions de configuration
export const showFirebaseSetupInstructions = () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          CONFIGURATION FIREBASE REQUISE                        ║
╚════════════════════════════════════════════════════════════════╝

Les tâches ne se stockent pas dans Firebase car la configuration
est manquante.

📝 ÉTAPES À SUIVRE :

1. Créez un fichier .env.local à la racine du projet

2. Ajoutez-y vos credentials Firebase :

   VITE_FIREBASE_API_KEY=votre_api_key
   VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre_projet_id
   VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   VITE_FIREBASE_APP_ID=votre_app_id

3. Redémarrez le serveur de développement :
   npm run dev

📍 OÙ TROUVER VOS CREDENTIALS ?

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet (ou créez-en un)
3. Cliquez sur l'icône ⚙️ (Paramètres du projet)
4. Descendez jusqu'à "Vos applications"
5. Cliquez sur "Config" ou ajoutez une application web
6. Copiez les valeurs de firebaseConfig

╔════════════════════════════════════════════════════════════════╗
║  IMPORTANT : Ne commitez JAMAIS le fichier .env.local !       ║
║  Il est déjà dans .gitignore                                   ║
╚════════════════════════════════════════════════════════════════╝
    `);
};
