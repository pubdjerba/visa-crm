import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
    Unsubscribe
} from "firebase/firestore";
import { db } from "../firebase";
import { Client, VisaRequirement, ExternalResource, TodoTask, LetterTemplate, OpeningLog, AppSettings } from "../types";

// Helper to sanitize data for Firestore (removes undefined values)
const sanitizeData = (data: any): any => {
    if (data === null || typeof data !== 'object') return data;

    // For arrays, sanitize each element
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    const clean: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                clean[key] = sanitizeData(value);
            }
        }
    }
    return clean;
};

// Collection names
const COLLECTIONS = {
    CLIENTS: "clients",
    REQUIREMENTS: "requirements",
    RESOURCES: "resources",
    TASKS: "tasks",
    TEMPLATES: "templates",
    OPENING_LOGS: "openingLogs",
    SETTINGS: "settings"
};

// ============= CLIENTS =============

export const saveClient = async (client: Client): Promise<void> => {
    try {
        const sanitized = sanitizeData(client);
        await setDoc(doc(db, COLLECTIONS.CLIENTS, client.id), sanitized);
        console.log("✅ Client saved to Firebase:", client.id);
    } catch (error) {
        console.error("Error saving client:", error);
        throw error;
    }
};

export const getAllClients = async (): Promise<Client[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.CLIENTS));
        return querySnapshot.docs.map(doc => doc.data() as Client);
    } catch (error) {
        console.error("Error getting clients:", error);
        throw error;
    }
};

export const getClient = async (clientId: string): Promise<Client | null> => {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.CLIENTS, clientId));
        return docSnap.exists() ? docSnap.data() as Client : null;
    } catch (error) {
        console.error("Error getting client:", error);
        throw error;
    }
};

export const updateClient = async (clientId: string, data: Partial<Client>): Promise<void> => {
    try {
        const sanitized = sanitizeData(data);
        console.log('🔥 [firebaseService] updateClient called:', {
            clientId,
            dataKeys: Object.keys(sanitized),
            hasApplications: !!sanitized.applications,
            applicationsCount: sanitized.applications?.length
        });

        await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientId), sanitized as any);

        console.log('✅ [firebaseService] updateDoc completed successfully');
    } catch (error) {
        console.error("❌ [firebaseService] Error updating client:", error);
        throw error;
    }
};

export const deleteClient = async (clientId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.CLIENTS, clientId));
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
};

// ============= REQUIREMENTS =============

export const saveRequirement = async (requirement: VisaRequirement): Promise<void> => {
    try {
        const sanitized = sanitizeData(requirement);
        await setDoc(doc(db, COLLECTIONS.REQUIREMENTS, requirement.id), sanitized);
        console.log("✅ Requirement saved to Firebase:", requirement.id);
    } catch (error) {
        console.error("Error saving requirement:", error);
        throw error;
    }
};

export const getAllRequirements = async (): Promise<VisaRequirement[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.REQUIREMENTS));
        return querySnapshot.docs.map(doc => doc.data() as VisaRequirement);
    } catch (error) {
        console.error("Error getting requirements:", error);
        throw error;
    }
};

// ============= RESOURCES =============

export const saveResource = async (resource: ExternalResource): Promise<void> => {
    try {
        const sanitized = sanitizeData(resource);
        await setDoc(doc(db, COLLECTIONS.RESOURCES, resource.id), sanitized);
        console.log("✅ Resource saved to Firebase:", resource.id);
    } catch (error) {
        console.error("Error saving resource:", error);
        throw error;
    }
};

export const getAllResources = async (): Promise<ExternalResource[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.RESOURCES));
        return querySnapshot.docs.map(doc => doc.data() as ExternalResource);
    } catch (error) {
        console.error("Error getting resources:", error);
        throw error;
    }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.RESOURCES, resourceId));
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
};

// ============= TASKS =============

export const saveTask = async (task: TodoTask): Promise<void> => {
    try {
        // ULTRA AGGRESSIVE CLEANING - Build a completely new object
        // Never trust the incoming task object
        const firebaseTask: any = {
            id: task.id,
            text: task.text,
            completed: task.completed || false,
            createdAt: task.createdAt,
            priority: task.priority || 'medium',
            category: task.category || 'other'
        };

        // Only add dueDate if it exists and is not undefined
        if (task.dueDate !== undefined && task.dueDate !== null && task.dueDate !== '' && task.dueDate !== 'undefined') {
            firebaseTask.dueDate = task.dueDate;
        }

        // Only add clientId if it exists and is not undefined
        if (task.clientId !== undefined && task.clientId !== null && task.clientId !== '' && task.clientId !== 'undefined') {
            firebaseTask.clientId = task.clientId;
        }

        console.log("🔥🔥🔥 FINAL OBJECT TO FIREBASE:", JSON.stringify(firebaseTask, null, 2));

        // Send to Firebase - this object is guaranteed to have NO undefined values
        await setDoc(doc(db, COLLECTIONS.TASKS, task.id), firebaseTask);
        console.log("✅ [firebaseService] Task saved successfully:", task.id);
    } catch (error) {
        console.error("❌ [firebaseService] Error saving task:", error);
        throw error;
    }
};

export const getAllTasks = async (): Promise<TodoTask[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.TASKS));
        return querySnapshot.docs.map(doc => doc.data() as TodoTask);
    } catch (error) {
        console.error("Error getting tasks:", error);
        throw error;
    }
};

export const updateTask = async (taskId: string, data: Partial<TodoTask>): Promise<void> => {
    try {
        const sanitized = sanitizeData(data);
        await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), sanitized as any);
        console.log("✅ Task updated in Firebase:", taskId);
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
    } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
    }
};

// ============= TEMPLATES =============

export const saveTemplate = async (template: LetterTemplate): Promise<void> => {
    try {
        const sanitized = sanitizeData(template);
        await setDoc(doc(db, COLLECTIONS.TEMPLATES, template.id), sanitized);
        console.log("✅ Template saved to Firebase:", template.id);
    } catch (error) {
        console.error("Error saving template:", error);
        throw error;
    }
};

export const getAllTemplates = async (): Promise<LetterTemplate[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
        return querySnapshot.docs.map(doc => doc.data() as LetterTemplate);
    } catch (error) {
        console.error("Error getting templates:", error);
        throw error;
    }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, templateId));
    } catch (error) {
        console.error("Error deleting template:", error);
        throw error;
    }
};

// ============= OPENING LOGS =============

export const saveOpeningLog = async (log: OpeningLog): Promise<void> => {
    try {
        const sanitized = sanitizeData(log);
        await setDoc(doc(db, COLLECTIONS.OPENING_LOGS, log.id), sanitized);
        console.log("✅ Opening log saved to Firebase:", log.id);
    } catch (error) {
        console.error("Error saving opening log:", error);
        throw error;
    }
};

export const getAllOpeningLogs = async (): Promise<OpeningLog[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.OPENING_LOGS));
        return querySnapshot.docs.map(doc => doc.data() as OpeningLog);
    } catch (error) {
        console.error("Error getting opening logs:", error);
        throw error;
    }
};

// ============= SETTINGS =============

export const saveSettings = async (settings: AppSettings): Promise<void> => {
    try {
        const sanitized = sanitizeData(settings);
        // We use a fixed ID for settings since there's only one settings document
        await setDoc(doc(db, COLLECTIONS.SETTINGS, "app_settings"), sanitized);
        console.log("✅ Settings saved to Firebase");
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};

export const getSettings = async (): Promise<AppSettings | null> => {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "app_settings"));
        return docSnap.exists() ? docSnap.data() as AppSettings : null;
    } catch (error) {
        console.error("Error getting settings:", error);
        throw error;
    }
};

// ============= BATCH OPERATIONS =============

/**
 * Save all data to Firebase (useful for migration or backup)
 */
export const saveAllData = async (data: {
    clients: Client[];
    requirements: VisaRequirement[];
    resources: ExternalResource[];
    tasks: TodoTask[];
    templates: LetterTemplate[];
    openingLogs: OpeningLog[];
    settings: AppSettings;
}): Promise<void> => {
    try {
        // Save all clients
        await Promise.all(data.clients.map(client => saveClient(client)));

        // Save all requirements
        await Promise.all(data.requirements.map(req => saveRequirement(req)));

        // Save all resources
        await Promise.all(data.resources.map(res => saveResource(res)));

        // Save all tasks
        await Promise.all(data.tasks.map(task => saveTask(task)));

        // Save all templates
        await Promise.all(data.templates.map(tpl => saveTemplate(tpl)));

        // Save all opening logs
        await Promise.all(data.openingLogs.map(log => saveOpeningLog(log)));

        // Save settings
        await saveSettings(data.settings);

        console.log("All data saved to Firebase successfully!");
    } catch (error) {
        console.error("Error saving all data:", error);
        throw error;
    }
};

/**
 * Load all data from Firebase
 */
export const loadAllData = async (): Promise<{
    clients: Client[];
    requirements: VisaRequirement[];
    resources: ExternalResource[];
    tasks: TodoTask[];
    templates: LetterTemplate[];
    openingLogs: OpeningLog[];
    settings: AppSettings | null;
}> => {
    try {
        const [clients, requirements, resources, tasks, templates, openingLogs, settings] = await Promise.all([
            getAllClients(),
            getAllRequirements(),
            getAllResources(),
            getAllTasks(),
            getAllTemplates(),
            getAllOpeningLogs(),
            getSettings()
        ]);

        return {
            clients,
            requirements,
            resources,
            tasks,
            templates,
            openingLogs,
            settings
        };
    } catch (error) {
        console.error("Error loading all data:", error);
        throw error;
    }
};

// ============= REAL-TIME LISTENERS =============

/**
 * Subscribe to real-time updates for all clients
 */
export const subscribeToClients = (
    callback: (clients: Client[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.CLIENTS),
        (snapshot) => {
            const clients = snapshot.docs.map(doc => doc.data() as Client);
            callback(clients);
        },
        (error) => {
            console.error("Error listening to clients:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for all requirements
 */
export const subscribeToRequirements = (
    callback: (requirements: VisaRequirement[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.REQUIREMENTS),
        (snapshot) => {
            const requirements = snapshot.docs.map(doc => doc.data() as VisaRequirement);
            callback(requirements);
        },
        (error) => {
            console.error("Error listening to requirements:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for all resources
 */
export const subscribeToResources = (
    callback: (resources: ExternalResource[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.RESOURCES),
        (snapshot) => {
            const resources = snapshot.docs.map(doc => doc.data() as ExternalResource);
            callback(resources);
        },
        (error) => {
            console.error("Error listening to resources:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for all tasks
 */
export const subscribeToTasks = (
    callback: (tasks: TodoTask[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.TASKS),
        (snapshot) => {
            const tasks = snapshot.docs.map(doc => doc.data() as TodoTask);
            callback(tasks);
        },
        (error) => {
            console.error("Error listening to tasks:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for all templates
 */
export const subscribeToTemplates = (
    callback: (templates: LetterTemplate[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.TEMPLATES),
        (snapshot) => {
            const templates = snapshot.docs.map(doc => doc.data() as LetterTemplate);
            callback(templates);
        },
        (error) => {
            console.error("Error listening to templates:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for all opening logs
 */
export const subscribeToOpeningLogs = (
    callback: (logs: OpeningLog[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        collection(db, COLLECTIONS.OPENING_LOGS),
        (snapshot) => {
            const logs = snapshot.docs.map(doc => doc.data() as OpeningLog);
            callback(logs);
        },
        (error) => {
            console.error("Error listening to opening logs:", error);
            onError?.(error);
        }
    );
};

/**
 * Subscribe to real-time updates for settings
 */
export const subscribeToSettings = (
    callback: (settings: AppSettings | null) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        doc(db, COLLECTIONS.SETTINGS, "app_settings"),
        (docSnap) => {
            const settings = docSnap.exists() ? docSnap.data() as AppSettings : null;
            callback(settings);
        },
        (error) => {
            console.error("Error listening to settings:", error);
            onError?.(error);
        }
    );
};
