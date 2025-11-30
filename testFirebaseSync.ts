/**
 * 🧪 Script de Test Firebase - Synchronisation Complète
 * 
 * Ce script teste toutes les opérations CRUD sur Firebase pour vérifier
 * que la synchronisation fonctionne correctement.
 * 
 * Pour exécuter ce test:
 * 1. Assurez-vous que .env.local est configuré avec vos clés Firebase
 * 2. Lancez l'application: npm run dev
 * 3. Ouvrez la console du navigateur (F12)
 * 4. Copiez-collez ce script dans la console
 */

import {
    saveClient,
    getAllClients,
    getClient,
    updateClient,
    deleteClient,
    loadAllData,
    subscribeToClients
} from './services/firebaseService';
import { ApplicationStatus, Client } from './types';

// 🎨 Couleurs pour la console
const colors = {
    success: 'color: #22c55e; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
    info: 'color: #3b82f6; font-weight: bold',
    warning: 'color: #f59e0b; font-weight: bold',
    test: 'color: #8b5cf6; font-weight: bold; font-size: 14px'
};

// 📊 Résultats des tests
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// ✅ Helper pour logger les succès
const logSuccess = (message: string) => {
    console.log(`%c✅ ${message}`, colors.success);
    testResults.passed++;
    testResults.total++;
};

// ❌ Helper pour logger les erreurs
const logError = (message: string, error?: any) => {
    console.log(`%c❌ ${message}`, colors.error);
    if (error) console.error(error);
    testResults.failed++;
    testResults.total++;
};

// ℹ️ Helper pour logger les infos
const logInfo = (message: string) => {
    console.log(`%cℹ️  ${message}`, colors.info);
};

// 🧪 Helper pour logger les tests
const logTest = (message: string) => {
    console.log(`%c🧪 ${message}`, colors.test);
};

// 📝 Données de test
const createTestClient = (): Client => ({
    id: `test-client-${Date.now()}`,
    fullName: "Test Client Firebase",
    email: "test@firebase.com",
    phone: "+216 12 345 678",
    passportNumber: "TEST123456",
    nationality: "Tunisie",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    applications: [
        {
            id: `test-app-${Date.now()}`,
            destination: "France",
            visaType: "Schengen Tourisme",
            status: ApplicationStatus.DRAFT,
            submissionDate: new Date().toISOString().split('T')[0],
            center: "TLS Contact Tunis",
            price: 350,
            archived: false,
            documents: []
        }
    ]
});

// 🧪 TEST 1: Connexion Firebase
async function testFirebaseConnection() {
    logTest("TEST 1: Vérification de la connexion Firebase");
    try {
        const data = await loadAllData();
        logSuccess("Connexion Firebase réussie");
        logInfo(`Clients existants: ${data.clients.length}`);
        logInfo(`Requirements: ${data.requirements.length}`);
        logInfo(`Resources: ${data.resources.length}`);
        logInfo(`Tasks: ${data.tasks.length}`);
        logInfo(`Templates: ${data.templates.length}`);
        return true;
    } catch (error) {
        logError("Échec de connexion Firebase", error);
        return false;
    }
}

// 🧪 TEST 2: Créer un client
async function testCreateClient() {
    logTest("TEST 2: Création d'un client");
    try {
        const testClient = createTestClient();
        await saveClient(testClient);
        logSuccess(`Client créé avec ID: ${testClient.id}`);
        return testClient.id;
    } catch (error) {
        logError("Échec de création du client", error);
        return null;
    }
}

// 🧪 TEST 3: Lire un client
async function testReadClient(clientId: string) {
    logTest("TEST 3: Lecture d'un client");
    try {
        const client = await getClient(clientId);
        if (client) {
            logSuccess(`Client lu avec succès: ${client.fullName}`);
            logInfo(`Email: ${client.email}`);
            logInfo(`Applications: ${client.applications.length}`);
            return true;
        } else {
            logError("Client non trouvé");
            return false;
        }
    } catch (error) {
        logError("Échec de lecture du client", error);
        return false;
    }
}

// 🧪 TEST 4: Mettre à jour un client
async function testUpdateClient(clientId: string) {
    logTest("TEST 4: Mise à jour d'un client");
    try {
        const updates = {
            phone: "+216 98 765 432",
            email: "updated@firebase.com"
        };
        await updateClient(clientId, updates);

        // Vérifier la mise à jour
        const updatedClient = await getClient(clientId);
        if (updatedClient?.phone === updates.phone && updatedClient?.email === updates.email) {
            logSuccess("Client mis à jour avec succès");
            logInfo(`Nouveau téléphone: ${updatedClient.phone}`);
            logInfo(`Nouvel email: ${updatedClient.email}`);
            return true;
        } else {
            logError("Les données mises à jour ne correspondent pas");
            return false;
        }
    } catch (error) {
        logError("Échec de mise à jour du client", error);
        return false;
    }
}

// 🧪 TEST 5: Lister tous les clients
async function testListAllClients() {
    logTest("TEST 5: Liste de tous les clients");
    try {
        const clients = await getAllClients();
        logSuccess(`${clients.length} clients récupérés`);

        // Afficher les 3 premiers
        clients.slice(0, 3).forEach((client, index) => {
            logInfo(`${index + 1}. ${client.fullName} - ${client.email}`);
        });

        return clients.length > 0;
    } catch (error) {
        logError("Échec de récupération des clients", error);
        return false;
    }
}

// 🧪 TEST 6: Synchronisation en temps réel
async function testRealtimeSync(clientId: string) {
    logTest("TEST 6: Synchronisation en temps réel");

    return new Promise((resolve) => {
        let updateReceived = false;

        // S'abonner aux changements
        const unsubscribe = subscribeToClients((clients) => {
            const testClient = clients.find(c => c.id === clientId);
            if (testClient && !updateReceived) {
                logSuccess("Mise à jour en temps réel reçue");
                logInfo(`Client: ${testClient.fullName}`);
                updateReceived = true;
                unsubscribe();
                resolve(true);
            }
        });

        // Faire une mise à jour après 1 seconde
        setTimeout(async () => {
            try {
                await updateClient(clientId, {
                    fullName: "Test Client Firebase (Updated)"
                });
                logInfo("Mise à jour déclenchée...");
            } catch (error) {
                logError("Échec de déclenchement de la mise à jour", error);
                unsubscribe();
                resolve(false);
            }
        }, 1000);

        // Timeout après 5 secondes
        setTimeout(() => {
            if (!updateReceived) {
                logError("Timeout: Aucune mise à jour reçue en 5 secondes");
                unsubscribe();
                resolve(false);
            }
        }, 5000);
    });
}

// 🧪 TEST 7: Supprimer un client
async function testDeleteClient(clientId: string) {
    logTest("TEST 7: Suppression d'un client");
    try {
        await deleteClient(clientId);

        // Vérifier que le client n'existe plus
        const deletedClient = await getClient(clientId);
        if (!deletedClient) {
            logSuccess("Client supprimé avec succès");
            return true;
        } else {
            logError("Le client existe toujours après suppression");
            return false;
        }
    } catch (error) {
        logError("Échec de suppression du client", error);
        return false;
    }
}

// 🧪 TEST 8: Performance - Opérations multiples
async function testPerformance() {
    logTest("TEST 8: Test de performance (10 opérations)");
    const startTime = performance.now();

    try {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            const client = createTestClient();
            client.id = `perf-test-${i}-${Date.now()}`;
            promises.push(saveClient(client));
        }

        await Promise.all(promises);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        logSuccess(`10 clients créés en ${duration}ms`);
        logInfo(`Moyenne: ${(parseFloat(duration) / 10).toFixed(2)}ms par opération`);

        // Nettoyer
        const allClients = await getAllClients();
        const perfClients = allClients.filter(c => c.id.startsWith('perf-test-'));
        await Promise.all(perfClients.map(c => deleteClient(c.id)));
        logInfo(`${perfClients.length} clients de test nettoyés`);

        return true;
    } catch (error) {
        logError("Échec du test de performance", error);
        return false;
    }
}

// 🚀 Exécuter tous les tests
export async function runAllFirebaseTests() {
    console.clear();
    console.log('%c🔥 TESTS DE SYNCHRONISATION FIREBASE 🔥', 'color: #ff6b35; font-size: 20px; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #888');
    console.log('');

    let testClientId: string | null = null;

    // Test 1: Connexion
    const connected = await testFirebaseConnection();
    if (!connected) {
        console.log('%c⚠️  Tests arrêtés: Impossible de se connecter à Firebase', colors.warning);
        return;
    }
    console.log('');

    // Test 2: Créer
    testClientId = await testCreateClient();
    if (!testClientId) {
        console.log('%c⚠️  Tests arrêtés: Impossible de créer un client', colors.warning);
        return;
    }
    console.log('');

    // Test 3: Lire
    await testReadClient(testClientId);
    console.log('');

    // Test 4: Mettre à jour
    await testUpdateClient(testClientId);
    console.log('');

    // Test 5: Lister
    await testListAllClients();
    console.log('');

    // Test 6: Temps réel
    await testRealtimeSync(testClientId);
    console.log('');

    // Test 7: Supprimer
    await testDeleteClient(testClientId);
    console.log('');

    // Test 8: Performance
    await testPerformance();
    console.log('');

    // Résumé
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #888');
    console.log('%c📊 RÉSUMÉ DES TESTS', 'color: #3b82f6; font-size: 16px; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #888');
    console.log(`%cTotal: ${testResults.total}`, colors.info);
    console.log(`%cRéussis: ${testResults.passed}`, colors.success);
    console.log(`%cÉchoués: ${testResults.failed}`, colors.error);
    console.log(`%cTaux de réussite: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
        testResults.failed === 0 ? colors.success : colors.warning);
    console.log('');

    if (testResults.failed === 0) {
        console.log('%c🎉 TOUS LES TESTS SONT PASSÉS ! 🎉', 'color: #22c55e; font-size: 18px; font-weight: bold');
        console.log('%c✅ La synchronisation Firebase fonctionne parfaitement !', colors.success);
    } else {
        console.log('%c⚠️  CERTAINS TESTS ONT ÉCHOUÉ', 'color: #f59e0b; font-size: 18px; font-weight: bold');
        console.log('%c🔍 Vérifiez la configuration Firebase et les erreurs ci-dessus', colors.warning);
    }
}

// Auto-exécution si appelé directement
if (typeof window !== 'undefined') {
    (window as any).runFirebaseTests = runAllFirebaseTests;
    console.log('%c💡 Pour lancer les tests, tapez: runFirebaseTests()', 'color: #8b5cf6; font-size: 14px');
}
