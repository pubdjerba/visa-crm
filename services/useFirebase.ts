import { useState, useEffect } from 'react';
import {
    saveClient,
    updateClient as updateClientFirebase,
    deleteClient as deleteClientFirebase,
    saveRequirement,
    saveResource,
    deleteResource as deleteResourceFirebase,
    saveTask,
    deleteTask as deleteTaskFirebase,
    saveTemplate,
    deleteTemplate as deleteTemplateFirebase,
    saveOpeningLog,
    saveSettings,
    loadAllData,
    subscribeToClients,
    subscribeToRequirements,
    subscribeToResources,
    subscribeToTasks,
    subscribeToTemplates,
    subscribeToOpeningLogs,
    subscribeToSettings
} from './firebaseService';
import {
    Client,
    VisaRequirement,
    ExternalResource,
    TodoTask,
    LetterTemplate,
    OpeningLog,
    AppSettings
} from '../types';

/**
 * Hook personnalisé pour gérer la synchronisation avec Firebase
 * 
 * Ce hook charge automatiquement les données depuis Firebase au démarrage
 * et fournit des fonctions pour synchroniser les modifications.
 */
export const useFirebaseSync = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    /**
     * Charge toutes les données depuis Firebase
     */
    const loadFromFirebase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await loadAllData();
            setIsLoading(false);
            return data;
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            return null;
        }
    };

    /**
     * Synchronise un client avec Firebase
     */
    const syncClient = async (client: Client) => {
        setIsSyncing(true);
        try {
            await saveClient(client);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Met à jour un client dans Firebase
     */
    const updateClient = async (clientId: string, data: Partial<Client>) => {
        setIsSyncing(true);
        try {
            await updateClientFirebase(clientId, data);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Supprime un client de Firebase
     */
    const deleteClient = async (clientId: string) => {
        setIsSyncing(true);
        try {
            await deleteClientFirebase(clientId);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise une exigence avec Firebase
     */
    const syncRequirement = async (requirement: VisaRequirement) => {
        setIsSyncing(true);
        try {
            await saveRequirement(requirement);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise une ressource avec Firebase
     */
    const syncResource = async (resource: ExternalResource) => {
        setIsSyncing(true);
        try {
            await saveResource(resource);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Supprime une ressource de Firebase
     */
    const deleteResource = async (resourceId: string) => {
        setIsSyncing(true);
        try {
            await deleteResourceFirebase(resourceId);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise une tâche avec Firebase
     */
    const syncTask = async (task: TodoTask) => {
        setIsSyncing(true);
        try {
            await saveTask(task);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Supprime une tâche de Firebase
     */
    const deleteTask = async (taskId: string) => {
        setIsSyncing(true);
        try {
            await deleteTaskFirebase(taskId);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise un modèle avec Firebase
     */
    const syncTemplate = async (template: LetterTemplate) => {
        setIsSyncing(true);
        try {
            await saveTemplate(template);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Supprime un modèle de Firebase
     */
    const deleteTemplate = async (templateId: string) => {
        setIsSyncing(true);
        try {
            await deleteTemplateFirebase(templateId);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise un log d'ouverture avec Firebase
     */
    const syncOpeningLog = async (log: OpeningLog) => {
        setIsSyncing(true);
        try {
            await saveOpeningLog(log);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    /**
     * Synchronise les paramètres avec Firebase
     */
    const syncSettings = async (settings: AppSettings) => {
        setIsSyncing(true);
        try {
            await saveSettings(settings);
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError(err as Error);
            setIsSyncing(false);
            return false;
        }
    };

    return {
        isLoading,
        isSyncing,
        error,
        loadFromFirebase,
        syncClient,
        updateClient,
        deleteClient,
        syncRequirement,
        syncResource,
        deleteResource,
        syncTask,
        deleteTask,
        syncTemplate,
        deleteTemplate,
        syncOpeningLog,
        syncSettings
    };
};

/**
 * Hook pour charger les données au démarrage de l'application
 */
export const useFirebaseData = () => {
    const [data, setData] = useState<{
        clients: Client[];
        requirements: VisaRequirement[];
        resources: ExternalResource[];
        tasks: TodoTask[];
        templates: LetterTemplate[];
        openingLogs: OpeningLog[];
        settings: AppSettings | null;
    } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const firebaseData = await loadAllData();
                setData(firebaseData);
                setIsLoading(false);
            } catch (err) {
                console.error("Erreur lors du chargement depuis Firebase:", err);
                setError(err as Error);
                setIsLoading(false);
                // En cas d'erreur, retourner null pour utiliser localStorage
            }
        };

        loadData();
    }, []);

    return { data, isLoading, error };
};

/**
 * Hook pour la synchronisation en temps réel avec Firebase
 * Écoute automatiquement tous les changements dans Firebase et met à jour l'état local
 */
export const useFirebaseRealtime = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [requirements, setRequirements] = useState<VisaRequirement[]>([]);
    const [resources, setResources] = useState<ExternalResource[]>([]);
    const [tasks, setTasks] = useState<TodoTask[]>([]);
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [openingLogs, setOpeningLogs] = useState<OpeningLog[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        const handleError = (err: Error) => {
            if (mounted) {
                setError(err);
                console.error("Firebase realtime error:", err);
            }
        };

        // Subscribe to all collections
        const unsubscribeClients = subscribeToClients(
            (data) => {
                if (mounted) {
                    setClients(data);
                    // Cache in localStorage
                    localStorage.setItem('visaflow_clients', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeRequirements = subscribeToRequirements(
            (data) => {
                if (mounted) {
                    setRequirements(data);
                    localStorage.setItem('visaflow_requirements', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeResources = subscribeToResources(
            (data) => {
                if (mounted) {
                    setResources(data);
                    localStorage.setItem('visaflow_resources', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeTasks = subscribeToTasks(
            (data) => {
                if (mounted) {
                    setTasks(data);
                    localStorage.setItem('visaflow_tasks', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeTemplates = subscribeToTemplates(
            (data) => {
                if (mounted) {
                    setTemplates(data);
                    localStorage.setItem('visaflow_templates', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeOpeningLogs = subscribeToOpeningLogs(
            (data) => {
                if (mounted) {
                    setOpeningLogs(data);
                    localStorage.setItem('visaflow_opening_logs', JSON.stringify(data));
                }
            },
            handleError
        );

        const unsubscribeSettings = subscribeToSettings(
            (data) => {
                if (mounted && data) {
                    setSettings(data);
                    localStorage.setItem('visaflow_settings', JSON.stringify(data));
                }
            },
            handleError
        );

        // Mark as loaded after a short delay to ensure first snapshot is received
        setTimeout(() => {
            if (mounted) {
                setIsLoading(false);
            }
        }, 1000);

        // Cleanup on unmount
        return () => {
            mounted = false;
            unsubscribeClients();
            unsubscribeRequirements();
            unsubscribeResources();
            unsubscribeTasks();
            unsubscribeTemplates();
            unsubscribeOpeningLogs();
            unsubscribeSettings();
        };
    }, []);

    return {
        clients,
        requirements,
        resources,
        tasks,
        templates,
        openingLogs,
        settings,
        isLoading,
        error
    };
};
