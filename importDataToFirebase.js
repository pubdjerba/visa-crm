// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Lire les données depuis VisaFlow.json
const visaFlowPath = path.join(__dirname, 'VisaFlow.json');
const rawData = fs.readFileSync(visaFlowPath, 'utf8');
const visaFlowData = JSON.parse(rawData);

// Parse les données JSON
const clients = JSON.parse(visaFlowData.clients);
const settings = JSON.parse(visaFlowData.settings);
const requirements = JSON.parse(visaFlowData.requirements);
const resources = JSON.parse(visaFlowData.resources);
const tasks = JSON.parse(visaFlowData.tasks);
const templates = JSON.parse(visaFlowData.templates);

console.log('📦 Données chargées depuis VisaFlow.json');
console.log(`  - ${clients.length} clients`);
console.log(`  - ${requirements.length} exigences`);
console.log(`  - ${resources.length} ressources`);
console.log(`  - ${tasks.length} tâches`);
console.log(`  - ${templates.length} modèles`);

// Initialiser Firebase Admin avec les credentials
// NOTE: Vous devez avoir un fichier serviceAccountKey.json dans le même dossier
try {
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('\n✅ Firebase Admin initialisé');
} catch (error) {
    console.error('\n❌ ERREUR: Fichier serviceAccountKey.json non trouvé!');
    console.error('📝 Pour obtenir ce fichier:');
    console.error('   1. Allez sur https://console.firebase.google.com');
    console.error('   2. Sélectionnez votre projet');
    console.error('   3. Paramètres du projet > Comptes de service');
    console.error('   4. Générer une nouvelle clé privée');
    console.error('   5. Téléchargez le fichier et renommez-le "serviceAccountKey.json"');
    console.error('   6. Placez-le dans le dossier src/');
    process.exit(1);
}

const db = admin.firestore();

// Fonction pour importer toutes les données
async function importAllData() {
    try {
        console.log('\n🚀 Début de l\'importation vers Firebase...\n');

        // Importer les clients
        console.log('📤 Importation des clients...');
        const clientPromises = clients.map(client =>
            db.collection('clients').doc(client.id).set(client)
        );
        await Promise.all(clientPromises);
        console.log(`✅ ${clients.length} clients importés`);

        // Importer les requirements
        console.log('📤 Importation des exigences...');
        const reqPromises = requirements.map(req =>
            db.collection('requirements').doc(req.id).set(req)
        );
        await Promise.all(reqPromises);
        console.log(`✅ ${requirements.length} exigences importées`);

        // Importer les resources
        console.log('📤 Importation des ressources...');
        const resPromises = resources.map(res =>
            db.collection('resources').doc(res.id).set(res)
        );
        await Promise.all(resPromises);
        console.log(`✅ ${resources.length} ressources importées`);

        // Importer les tasks
        console.log('📤 Importation des tâches...');
        const taskPromises = tasks.map(task =>
            db.collection('tasks').doc(task.id).set(task)
        );
        await Promise.all(taskPromises);
        console.log(`✅ ${tasks.length} tâches importées`);

        // Importer les templates
        console.log('📤 Importation des modèles...');
        const tplPromises = templates.map(tpl =>
            db.collection('templates').doc(tpl.id).set(tpl)
        );
        await Promise.all(tplPromises);
        console.log(`✅ ${templates.length} modèles importés`);

        // Importer les settings
        console.log('📤 Importation des paramètres...');
        await db.collection('settings').doc('app_settings').set(settings);
        console.log('✅ Paramètres importés');

        console.log('\n🎉 IMPORTATION TERMINÉE AVEC SUCCÈS !');
        console.log('✨ Toutes vos données sont maintenant dans Firebase Cloud.');
        console.log('💡 Vous pouvez maintenant lancer l\'application et vérifier.');

    } catch (error) {
        console.error('\n❌ ERREUR lors de l\'importation:', error);
        throw error;
    }
}

// Exécuter l'importation
importAllData()
    .then(() => {
        console.log('\n✅ Migration terminée !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Échec de la migration:', error);
        process.exit(1);
    });
