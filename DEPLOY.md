# 🚀 Déploiement Rapide sur Vercel

## Commandes Rapides

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
cd c:\Users\fzrou\Desktop\CRM-VISA\src
vercel

# 4. Déployer en production
vercel --prod
```

## Variables d'Environnement à Configurer

Dans le dashboard Vercel, ajoutez :

```
VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

## Fichiers Créés

✅ `vercel.json` - Configuration Vercel pour SPA routing  
✅ Guide de déploiement complet disponible

**Votre app est prête pour Vercel !** 🎉
