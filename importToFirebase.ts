import { saveAllData } from './services/firebaseService';
import visaFlowData from './VisaFlow.json';

/**
 * Script pour importer les données depuis VisaFlow.json vers Firebase
 * Exécutez ce script une seule fois pour migrer vos données
 */
async function importDataToFirebase() {
    try {
        console.log('🚀 Début de l\'importation des données vers Firebase...');

        // Parse les données JSON
        const clients = JSON.parse(visaFlowData.clients);
        const settings = JSON.parse(visaFlowData.settings);
        const requirements = JSON.parse(visaFlowData.requirements);
        const resources = JSON.parse(visaFlowData.resources);
        const tasks = JSON.parse(visaFlowData.tasks);
        const templates = JSON.parse(visaFlowData.templates);

        console.log(`📊 Données à importer:`);
        console.log(`  - ${clients.length} clients`);
        console.log(`  - ${requirements.length} exigences visa`);
        console.log(`  - ${resources.length} ressources`);
        console.log(`  - ${tasks.length} tâches`);
        console.log(`  - ${templates.length} modèles`);

        // Importer toutes les données vers Firebase
        await saveAllData({
            clients,
            requirements,
            resources,
            tasks,
            templates,
            openingLogs: [], // Pas de logs dans le fichier
            settings
        });

        console.log('✅ Importation terminée avec succès !');
        console.log('🎉 Toutes vos données sont maintenant dans Firebase Cloud.');
        console.log('💡 Vous pouvez maintenant supprimer le fichier VisaFlow.json');

    } catch (error) {
        console.error('❌ Erreur lors de l\'importation:', error);
        throw error;
    }
}

// Exécuter l'importation
importDataToFirebase()
    .then(() => {
        console.log('\n✨ Migration terminée !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Échec de la migration:', error);
        process.exit(1);
    });
