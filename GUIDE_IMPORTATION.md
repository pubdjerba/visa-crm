# Guide d'importation des données dans Firebase

## Étape 1 : Obtenir la clé de service Firebase

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres) > **Paramètres du projet**
4. Allez dans l'onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Un fichier JSON sera téléchargé
7. **Renommez ce fichier en `serviceAccountKey.json`**
8. **Placez-le dans le dossier `src/`** (à côté de importDataToFirebase.js)

## Étape 2 : Installer Firebase Admin SDK

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install firebase-admin
```

## Étape 3 : Exécuter le script d'importation

```bash
node src/importDataToFirebase.js
```

## Ce qui sera importé :

- ✅ 14 clients avec tous leurs dossiers
- ✅ Exigences visa
- ✅ Ressources externes
- ✅ Tâches
- ✅ Modèles de lettres
- ✅ Paramètres de l'application

## Après l'importation :

1. Lancez l'application : `npm run dev`
2. Vos 14 clients devraient apparaître automatiquement
3. Vous pouvez supprimer `VisaFlow.json` (tout est dans le cloud)
4. Vous pouvez supprimer `serviceAccountKey.json` (pour la sécurité)

## En cas d'erreur :

- Vérifiez que `serviceAccountKey.json` est bien dans le dossier `src/`
- Vérifiez que vous avez les droits d'accès à Firebase
- Vérifiez votre connexion Internet
