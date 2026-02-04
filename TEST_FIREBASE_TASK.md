# Test Firebase Task - Instructions de débogage

## Étapes à suivre :

1. **Arrêtez complètement le serveur** (Ctrl+C dans le terminal)

2. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Dans le navigateur** :
   - Appuyez sur F12 pour ouvrir la console
   - Allez dans l'onglet "Console"
   - Effacez tous les messages (icône poubelle)
   - Dans l'onglet "Network", cochez "Disable cache"

4. **Rechargez la page** avec Ctrl+Shift+R

5. **Créez une tâche** (sans date ni client)

6. **Regardez la console** - Vous DEVRIEZ voir ces lignes :
   ```
   ➕ [App.tsx] handleAddTask called: {text: "...", clientId: undefined, dueDate: undefined}
   📦 [App.tsx] Task object to save: {id: "...", text: "...", ...}
   💾 [firebaseService] Attempting to save task: task_...
   📋 [firebaseService] Original task: {...}
   🧹 [firebaseService] Cleaned task: {...}
   ✨ [firebaseService] Sanitized task: {...}
   ```

## Si vous NE voyez PAS ces logs :

Le navigateur utilise encore du code en cache. Essayez :

1. Fermez complètement le navigateur
2. Rouvrez-le
3. Allez sur http://localhost:5173
4. F12 → Console
5. Essayez de créer une tâche

## Si vous VOYEZ les logs :

Copiez-moi TOUT le contenu de la console ici, en particulier :
- La ligne "📋 [firebaseService] Original task:"
- La ligne "🧹 [firebaseService] Cleaned task:"
- La ligne "✨ [firebaseService] Sanitized task:"
- Le message d'erreur complet
