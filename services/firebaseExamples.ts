import {
    saveClient,
    updateClient,
    deleteClient,
    getAllClients,
    saveAllData,
    loadAllData
} from './firebaseService';
import { Client } from '../types';

/**
 * EXEMPLES D'UTILISATION DU SERVICE FIREBASE
 * 
 * Ce fichier contient des exemples de code pour utiliser le service Firebase
 * dans votre application VisaFlow CRM.
 */

// ============= EXEMPLE 1: Sauvegarder un client =============

async function exempleAjouterClient() {
    const nouveauClient: Client = {
        id: `client_${Date.now()}`,
        fullName: "Jean Dupont",
        phone: "+33612345678",
        email: "jean.dupont@example.com",
        address: "123 Rue de Paris, 75001 Paris",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
        applications: [],
        history: []
    };

    try {
        await saveClient(nouveauClient);
        console.log("Client sauvegardé avec succès!");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
    }
}

// ============= EXEMPLE 2: Récupérer tous les clients =============

async function exempleChargerClients() {
    try {
        const clients = await getAllClients();
        console.log(`${clients.length} clients chargés:`, clients);
        return clients;
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        return [];
    }
}

// ============= EXEMPLE 3: Mettre à jour un client =============

async function exempleModifierClient(clientId: string) {
    try {
        await updateClient(clientId, {
            phone: "+33698765432",
            notes: "Client VIP - Prioritaire"
        });
        console.log("Client mis à jour!");
    } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
    }
}

// ============= EXEMPLE 4: Supprimer un client =============

async function exempleSupprimerClient(clientId: string) {
    try {
        await deleteClient(clientId);
        console.log("Client supprimé!");
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
    }
}

// ============= EXEMPLE 5: Migrer les données de localStorage vers Firebase =============

async function migrerDonneesVersFirebase() {
    try {
        // Récupérer les données du localStorage
        const clientsLocal = JSON.parse(localStorage.getItem('visaflow_clients') || '[]');
        const requirementsLocal = JSON.parse(localStorage.getItem('visaflow_requirements') || '[]');
        const resourcesLocal = JSON.parse(localStorage.getItem('visaflow_resources') || '[]');
        const tasksLocal = JSON.parse(localStorage.getItem('visaflow_tasks') || '[]');
        const templatesLocal = JSON.parse(localStorage.getItem('visaflow_templates') || '[]');
        const openingLogsLocal = JSON.parse(localStorage.getItem('visaflow_opening_logs') || '[]');
        const settingsLocal = JSON.parse(localStorage.getItem('visaflow_settings') || '{}');

        // Sauvegarder tout dans Firebase
        await saveAllData({
            clients: clientsLocal,
            requirements: requirementsLocal,
            resources: resourcesLocal,
            tasks: tasksLocal,
            templates: templatesLocal,
            openingLogs: openingLogsLocal,
            settings: settingsLocal
        });

        console.log("✅ Migration réussie! Toutes les données sont maintenant dans Firebase.");
    } catch (error) {
        console.error("❌ Erreur lors de la migration:", error);
    }
}

// ============= EXEMPLE 6: Charger toutes les données depuis Firebase =============

async function chargerToutesDonneesFirebase() {
    try {
        const data = await loadAllData();

        console.log("Données chargées depuis Firebase:");
        console.log(`- ${data.clients.length} clients`);
        console.log(`- ${data.requirements.length} exigences`);
        console.log(`- ${data.resources.length} ressources`);
        console.log(`- ${data.tasks.length} tâches`);
        console.log(`- ${data.templates.length} modèles`);
        console.log(`- ${data.openingLogs.length} logs d'ouverture`);

        return data;
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        return null;
    }
}

// ============= EXEMPLE 7: Synchronisation automatique =============

/**
 * Cette fonction peut être appelée à chaque modification pour synchroniser
 * automatiquement avec Firebase
 */
async function synchroniserClient(client: Client) {
    try {
        // Sauvegarder dans Firebase
        await saveClient(client);

        // Optionnel: aussi sauvegarder dans localStorage comme backup
        const clients = await getAllClients();
        localStorage.setItem('visaflow_clients', JSON.stringify(clients));

        console.log("✅ Client synchronisé avec Firebase");
    } catch (error) {
        console.error("❌ Erreur de synchronisation:", error);
        // En cas d'erreur, les données restent dans localStorage
    }
}

/**
 * INTÉGRATION DANS App.tsx
 * 
 * Pour intégrer Firebase dans votre App.tsx, vous devez:
 * 
 * 1. Importer les fonctions nécessaires:
 *    import { saveClient, getAllClients, loadAllData } from './services/firebaseService';
 * 
 * 2. Charger les données au démarrage:
 *    useEffect(() => {
 *      const loadData = async () => {
 *        const data = await loadAllData();
 *        if (data.clients.length > 0) {
 *          setClients(data.clients);
 *        }
 *        // Faire de même pour les autres données...
 *      };
 *      loadData();
 *    }, []);
 * 
 * 3. Sauvegarder à chaque modification:
 *    const handleCreateClient = async (newClient: Client) => {
 *      await saveClient(newClient);
 *      setClients(prev => [newClient, ...prev]);
 *    };
 * 
 * 4. Utiliser un useEffect pour synchroniser:
 *    useEffect(() => {
 *      // Sauvegarder tous les clients quand ils changent
 *      clients.forEach(client => saveClient(client));
 *    }, [clients]);
 */

export {
    exempleAjouterClient,
    exempleChargerClients,
    exempleModifierClient,
    exempleSupprimerClient,
    migrerDonneesVersFirebase,
    chargerToutesDonneesFirebase,
    synchroniserClient
};
