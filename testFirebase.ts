/**
 * Script de test de connexion Firebase
 * Ce fichier teste la connexion à Firebase et affiche les informations de configuration
 */

import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

console.log('🔥 Test de connexion Firebase...\n');

// Vérifier que les variables d'environnement sont chargées
console.log('📋 Variables d\'environnement :');
console.log('- API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Définie' : '❌ Manquante');
console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Définie' : '❌ Manquante');
console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Définie' : '❌ Manquante');
console.log('- Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Définie' : '❌ Manquante');
console.log('- Messaging Sender ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Définie' : '❌ Manquante');
console.log('- App ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Définie' : '❌ Manquante');
console.log('');

// Test de connexion à Firestore
async function testFirestoreConnection() {
    try {
        console.log('🔍 Test de connexion à Firestore...');

        // Créer un document de test
        console.log('📝 Création d\'un document de test...');
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Test de connexion Firebase réussi!'
        };

        const docRef = await addDoc(collection(db, 'test_connection'), testData);
        console.log('✅ Document de test créé avec ID:', docRef.id);

        // Lire le document
        console.log('📖 Lecture des documents de test...');
        const querySnapshot = await getDocs(collection(db, 'test_connection'));
        console.log('✅ Nombre de documents trouvés:', querySnapshot.size);

        // Afficher les documents
        querySnapshot.forEach((doc) => {
            console.log('   - Document ID:', doc.id);
            console.log('   - Données:', doc.data());
        });

        // Supprimer le document de test
        console.log('🗑️  Suppression du document de test...');
        await deleteDoc(doc(db, 'test_connection', docRef.id));
        console.log('✅ Document de test supprimé');

        console.log('\n🎉 SUCCÈS ! Firebase est correctement configuré et fonctionnel !');
        console.log('\n📊 Vous pouvez maintenant :');
        console.log('   1. Vérifier dans Firebase Console que la collection "test_connection" a été créée');
        console.log('   2. Commencer à utiliser Firebase dans votre application');
        console.log('   3. Intégrer les services Firebase dans App.tsx');

        return true;
    } catch (error: any) {
        console.error('\n❌ ERREUR lors du test de connexion Firebase:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);

        console.log('\n🔧 Solutions possibles :');

        if (error.code === 'permission-denied') {
            console.log('   ❌ Erreur de permissions Firestore');
            console.log('   → Vérifiez les règles de sécurité dans Firebase Console');
            console.log('   → Allez dans Firestore Database > Règles');
            console.log('   → Utilisez ces règles pour le développement :');
            console.log('');
            console.log('   rules_version = \'2\';');
            console.log('   service cloud.firestore {');
            console.log('     match /databases/{database}/documents {');
            console.log('       match /{document=**} {');
            console.log('         allow read, write: if true;');
            console.log('       }');
            console.log('     }');
            console.log('   }');
        } else if (error.code === 'invalid-api-key' || error.message.includes('API key')) {
            console.log('   ❌ Clé API invalide');
            console.log('   → Vérifiez VITE_FIREBASE_API_KEY dans .env.local');
            console.log('   → Récupérez la bonne clé depuis Firebase Console');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            console.log('   ❌ Problème de connexion réseau');
            console.log('   → Vérifiez votre connexion Internet');
            console.log('   → Vérifiez que Firebase n\'est pas bloqué par un firewall');
        } else {
            console.log('   ❌ Erreur inconnue');
            console.log('   → Vérifiez toutes vos variables d\'environnement dans .env.local');
            console.log('   → Redémarrez le serveur de développement (npm run dev)');
            console.log('   → Consultez la documentation Firebase');
        }

        console.log('\n📖 Pour plus d\'aide, consultez FIREBASE_SETUP.md');

        return false;
    }
}

// Exécuter le test
testFirestoreConnection();

export { testFirestoreConnection };
