/**
 * 🔥 Composant de Vérification Firebase
 * 
 * Ce composant affiche l'état de la configuration Firebase
 * et permet de tester la connexion en un clic.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { loadAllData } from '../services/firebaseService';
import { db } from '../firebase';

interface FirebaseStatus {
    configured: boolean;
    connected: boolean;
    error: string | null;
    collections: {
        clients: number;
        requirements: number;
        resources: number;
        tasks: number;
        templates: number;
        openingLogs: number;
    };
}

export const FirebaseVerification: React.FC = () => {
    const [status, setStatus] = useState<FirebaseStatus>({
        configured: false,
        connected: false,
        error: null,
        collections: {
            clients: 0,
            requirements: 0,
            resources: 0,
            tasks: 0,
            templates: 0,
            openingLogs: 0
        }
    });
    const [testing, setTesting] = useState(false);

    // Vérifier la configuration au chargement
    useEffect(() => {
        checkConfiguration();
    }, []);

    const checkConfiguration = () => {
        const configured = !!(
            import.meta.env.VITE_FIREBASE_API_KEY &&
            import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
            import.meta.env.VITE_FIREBASE_PROJECT_ID &&
            import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
            import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
            import.meta.env.VITE_FIREBASE_APP_ID
        );

        setStatus(prev => ({ ...prev, configured }));
    };

    const testConnection = async () => {
        setTesting(true);
        setStatus(prev => ({ ...prev, error: null }));

        try {
            // Tester la connexion en chargeant les données
            const data = await loadAllData();

            setStatus({
                configured: true,
                connected: true,
                error: null,
                collections: {
                    clients: data.clients.length,
                    requirements: data.requirements.length,
                    resources: data.resources.length,
                    tasks: data.tasks.length,
                    templates: data.templates.length,
                    openingLogs: data.openingLogs.length
                }
            });
        } catch (error: any) {
            setStatus(prev => ({
                ...prev,
                connected: false,
                error: error.message || 'Erreur de connexion'
            }));
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="card p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            🔥
                        </div>
                        Vérification Firebase
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        État de la configuration et connexion
                    </p>
                </div>
                <button
                    onClick={testConnection}
                    disabled={!status.configured || testing}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Test...' : 'Tester'}
                </button>
            </div>

            {/* Configuration Status */}
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                        Variables d'Environnement
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'API_KEY', value: import.meta.env.VITE_FIREBASE_API_KEY },
                            { key: 'AUTH_DOMAIN', value: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN },
                            { key: 'PROJECT_ID', value: import.meta.env.VITE_FIREBASE_PROJECT_ID },
                            { key: 'STORAGE_BUCKET', value: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET },
                            { key: 'MESSAGING_SENDER_ID', value: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID },
                            { key: 'APP_ID', value: import.meta.env.VITE_FIREBASE_APP_ID }
                        ].map(({ key, value }) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                                {value ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircleIcon className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                                    {key}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Connection Status */}
                {status.connected && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                        <h3 className="font-bold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            Connexion Réussie
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(status.collections).map(([name, count]) => (
                                <div key={name} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {count}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                                        {name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Status */}
                {status.error && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-4 rounded-xl border-2 border-red-200 dark:border-red-800">
                        <h3 className="font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                            <AlertCircleIcon className="w-5 h-5" />
                            Erreur de Connexion
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-white dark:bg-slate-800 p-3 rounded-lg">
                            {status.error}
                        </p>
                        <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                            <p className="font-bold mb-1">Solutions possibles :</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Vérifier les règles Firestore (Console Firebase)</li>
                                <li>Vérifier que Firestore est activé</li>
                                <li>Vérifier la connexion internet</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {!status.connected && !status.error && status.configured && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <AlertCircleIcon className="w-5 h-5" />
                            Prêt à Tester
                        </h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Cliquez sur "Tester" pour vérifier la connexion à Firebase.
                        </p>
                    </div>
                )}

                {!status.configured && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                        <h3 className="font-bold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                            <XCircleIcon className="w-5 h-5" />
                            Configuration Incomplète
                        </h3>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                            Certaines variables d'environnement sont manquantes.
                        </p>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Créez un fichier .env.local avec :
                            </p>
                            <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono overflow-x-auto">
                                {`VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine
VITE_FIREBASE_PROJECT_ID=votre_projet
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender
VITE_FIREBASE_APP_ID=votre_app_id`}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
