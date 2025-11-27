
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import ClientList from './views/ClientList';
import ClientDetail from './views/ClientDetail';
import CalendarView from './views/CalendarView';
import RequirementsView from './views/RequirementsView';
import AppointmentTracker from './views/AppointmentTracker';
import SettingsView from './views/SettingsView';
import ResourcesView from './views/ResourcesView';
import TasksView from './views/TasksView';
import TemplatesView from './views/TemplatesView';
import KanbanView from './views/KanbanView';
import AnalyticsView from './views/AnalyticsView';
import LockScreen from './components/LockScreen';
import { ViewState, Client, Application, DocumentItem, ApplicationStatus, Interaction, VisaRequirement, AppSettings, ExternalResource, TodoTask, LetterTemplate, OpeningLog } from './types';
import { MOCK_CLIENTS, INITIAL_REQUIREMENTS, DEFAULT_SETTINGS, INITIAL_RESOURCES, INITIAL_TEMPLATES, ALERT_SOUND_B64, INITIAL_OPENING_LOGS } from './constants';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    // Settings State
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('visaflow_settings');
            if (!savedSettings) return DEFAULT_SETTINGS;
            const parsed = JSON.parse(savedSettings);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                visaTypes: Array.isArray(parsed.visaTypes) ? parsed.visaTypes : DEFAULT_SETTINGS.visaTypes,
                destinations: Array.isArray(parsed.destinations) ? parsed.destinations : DEFAULT_SETTINGS.destinations,
                menuOrder: Array.isArray(parsed.menuOrder) ? parsed.menuOrder : DEFAULT_SETTINGS.menuOrder,
                appPassword: parsed.appPassword || DEFAULT_SETTINGS.appPassword
            };
        } catch (e) {
            console.error("Settings load error", e);
            return DEFAULT_SETTINGS;
        }
    });

    // Auth State - Default to locked on load
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('visaflow_settings', JSON.stringify(settings));
    }, [settings]);

    const [clients, setClients] = useState<Client[]>(() => {
        try {
            const savedClients = localStorage.getItem('visaflow_clients');
            return savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        } catch (e) {
            return MOCK_CLIENTS;
        }
    });

    const [requirements, setRequirements] = useState<VisaRequirement[]>(() => {
        try {
            const savedReqs = localStorage.getItem('visaflow_requirements');
            return savedReqs ? JSON.parse(savedReqs) : INITIAL_REQUIREMENTS;
        } catch (e) {
            return INITIAL_REQUIREMENTS;
        }
    });

    const [resources, setResources] = useState<ExternalResource[]>(() => {
        try {
            const savedRes = localStorage.getItem('visaflow_resources');
            return savedRes ? JSON.parse(savedRes) : INITIAL_RESOURCES;
        } catch (e) {
            return INITIAL_RESOURCES;
        }
    });

    const [tasks, setTasks] = useState<TodoTask[]>(() => {
        try {
            const saved = localStorage.getItem('visaflow_tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [templates, setTemplates] = useState<LetterTemplate[]>(() => {
        try {
            const saved = localStorage.getItem('visaflow_templates');
            return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
        } catch (e) {
            return INITIAL_TEMPLATES;
        }
    });

    const [openingLogs, setOpeningLogs] = useState<OpeningLog[]>(() => {
        try {
            const saved = localStorage.getItem('visaflow_opening_logs');
            return saved ? JSON.parse(saved) : INITIAL_OPENING_LOGS;
        } catch (e) {
            return INITIAL_OPENING_LOGS;
        }
    });

    const [isRadarActive, setIsRadarActive] = useState(false);
    const [radarAlertQueue, setRadarAlertQueue] = useState<{ clientName: string, destination: string, id: string }[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const titleIntervalRef = useRef<any>(null);

    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND_B64);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.8;
    }, []);

    useEffect(() => {
        if (isRadarActive && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [isRadarActive]);

    useEffect(() => { localStorage.setItem('visaflow_clients', JSON.stringify(clients)); }, [clients]);
    useEffect(() => { localStorage.setItem('visaflow_requirements', JSON.stringify(requirements)); }, [requirements]);
    useEffect(() => { localStorage.setItem('visaflow_resources', JSON.stringify(resources)); }, [resources]);
    useEffect(() => { localStorage.setItem('visaflow_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('visaflow_templates', JSON.stringify(templates)); }, [templates]);
    useEffect(() => { localStorage.setItem('visaflow_opening_logs', JSON.stringify(openingLogs)); }, [openingLogs]);

    // Web Worker for Background Timing
    useEffect(() => {
        if (isRadarActive) {
            const workerCode = `
              self.onmessage = function(e) {
                  if (e.data === 'start') {
                      setInterval(function() {
                          self.postMessage('tick');
                      }, 10000); 
                  }
              };
          `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerRef.current = new Worker(URL.createObjectURL(blob));

            workerRef.current.onmessage = (e) => {
                if (e.data === 'tick') {
                    checkClientsForRadar();
                }
            };

            workerRef.current.postMessage('start');
        } else {
            workerRef.current?.terminate();
            workerRef.current = null;
            stopAlerts();
        }

        return () => {
            workerRef.current?.terminate();
            stopAlerts();
        };
    }, [isRadarActive, clients]);

    const stopAlerts = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (titleIntervalRef.current) {
            clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = null;
            document.title = "VisaFlow CRM";
        }
    };

    const triggerAlertEffects = (count: number) => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked - User interaction needed first", e));
        }
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚠️ VisaFlow : ACTION REQUISE', {
                body: `${count} client(s) à vérifier maintenant !`,
                icon: '/icon.png',
                requireInteraction: true
            });
        }
        if (!titleIntervalRef.current) {
            let isAlert = false;
            titleIntervalRef.current = setInterval(() => {
                document.title = isAlert ? `🔴 (${count}) ALERTE !` : "VisaFlow CRM";
                isAlert = !isAlert;
            }, 1000);
        }
    };

    const checkClientsForRadar = () => {
        const waitingClients = clients.filter(c =>
            c.applications.some(app => app.status === ApplicationStatus.WAITING_APPOINTMENT && !app.archived)
        );

        const dueClients: any[] = [];
        const now = new Date();

        waitingClients.forEach(c => {
            const app = c.applications.find(a => a.status === ApplicationStatus.WAITING_APPOINTMENT && !a.archived)!;
            const config = app.appointmentConfig || {};

            let score = 0;
            if (config.targetDateStart) {
                const start = new Date(config.targetDateStart);
                const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 15) score += 50;
            }

            let frequency = 1440;
            const mode = config.priorityMode || 'auto';
            if (mode === 'urgent') frequency = 30;
            else if (mode === 'normal') frequency = 120;
            else if (mode === 'dormant') frequency = 1440;
            else {
                if (score >= 50) frequency = 30;
                else if (score >= 20) frequency = 120;
            }

            let lastCheckedDate = new Date(0);
            if (config.lastChecked) {
                const parts = config.lastChecked.split(' ');
                if (parts.length === 2) {
                    const [d, m] = parts[0].split('/').map(Number);
                    const [h, min] = parts[1].split(':').map(Number);
                    lastCheckedDate = new Date(now.getFullYear(), m - 1, d, h, min);
                }
            }

            const nextCheckDate = new Date(lastCheckedDate.getTime() + frequency * 60000);

            if (now >= nextCheckDate) {
                dueClients.push({
                    id: c.id,
                    clientName: c.fullName,
                    destination: app.destination
                });
            }
        });

        if (dueClients.length > 0) {
            setRadarAlertQueue(prev => {
                const newAlerts = dueClients.filter(d => !prev.some(p => p.id === d.id));

                if (newAlerts.length > 0) {
                    const totalCount = prev.length + newAlerts.length;
                    triggerAlertEffects(totalCount);
                    return [...prev, ...newAlerts];
                }

                if (prev.length > 0) {
                    triggerAlertEffects(prev.length);
                }

                return prev;
            });
        }
    };

    const handleSelectClient = (id: string) => {
        setSelectedClientId(id);
        setCurrentView('client-detail');
    };

    const handleBackToClients = () => {
        setSelectedClientId(null);
        setCurrentView('clients');
    };

    const handleCreateClient = (newClient: Client) => {
        setClients(prev => [newClient, ...prev]);
        setCurrentView('clients');
    };

    const handleDeleteClient = (clientId: string) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        if (selectedClientId === clientId) {
            setSelectedClientId(null);
            setCurrentView('clients');
        }
    };

    const handleUpdateClient = (clientId: string, data: Partial<Client>) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            return { ...client, ...data };
        }));
    };

    const handleAddApplication = (clientId: string, application: Application) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            return {
                ...client,
                applications: [application, ...client.applications],
                history: [{
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'system',
                    notes: `Nouveau dossier créé: ${application.visaType} pour ${application.destination}`
                }, ...client.history]
            };
        }));
    };

    const handleUpdateApplication = (clientId: string, appId: string, data: Partial<Application>) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;

            if (data.appointmentConfig && data.appointmentConfig.lastChecked) {
                setRadarAlertQueue(q => {
                    const newQ = q.filter(alert => alert.id !== clientId);
                    if (newQ.length === 0) stopAlerts();
                    return newQ;
                });
            }

            return {
                ...client,
                applications: client.applications.map(app => {
                    if (app.id !== appId) return app;
                    return { ...app, ...data };
                })
            };
        }));
    };

    const handleDeleteApplication = (clientId: string, appId: string) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            const updatedApps = client.applications.filter(app => app.id !== appId);
            return {
                ...client,
                applications: updatedApps,
                history: [{
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'system',
                    notes: 'Dossier supprimé'
                }, ...client.history]
            };
        }));
    };

    const handleToggleArchive = (clientId: string, appId?: string) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            if (appId) {
                return {
                    ...client,
                    applications: client.applications.map(app =>
                        app.id === appId ? { ...app, archived: !app.archived } : app
                    )
                };
            }
            return client;
        }));
    };

    const handleUpdateStatus = (clientId: string, appId: string, newStatus: ApplicationStatus) => {
        let updatedApp: Application | null = null;

        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            return {
                ...client,
                applications: client.applications.map(app => {
                    if (app.id !== appId) return app;
                    updatedApp = app;
                    const isCompletedStatus = newStatus === ApplicationStatus.READY_PICKUP || newStatus === ApplicationStatus.COMPLETED;
                    return { ...app, status: newStatus, archived: isCompletedStatus ? true : app.archived };
                }),
                history: [
                    {
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0],
                        type: 'system',
                        notes: `Statut mis à jour vers : ${newStatus}`
                    },
                    ...client.history
                ]
            };
        }));

        // Automatic Opening Log
        if (newStatus === ApplicationStatus.APPOINTMENT_SET && updatedApp) {
            const now = new Date();
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const newLog: OpeningLog = {
                id: Date.now().toString(),
                destination: (updatedApp as Application).destination,
                center: (updatedApp as Application).center || 'N/A',
                visaType: (updatedApp as Application).visaType,
                foundAt: now.toISOString(),
                dayOfWeek: days[now.getDay()],
                timeOfDay: time
            };
            setOpeningLogs(prev => [newLog, ...prev]);
        }
    };

    const handleAddDocument = (clientId: string, appId: string, doc: DocumentItem) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            return {
                ...client,
                applications: client.applications.map(app => {
                    if (app.id !== appId) return app;
                    return { ...app, documents: [...app.documents, doc] };
                }),
                history: [{
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'system',
                    notes: `Document ajouté: ${doc.name} (${doc.type})`
                }, ...client.history]
            };
        }));
    };

    const handleUpdateRequirements = (req: VisaRequirement) => {
        setRequirements(prev => {
            const exists = prev.find(r => r.visaType === req.visaType);
            if (exists) {
                return prev.map(r => r.visaType === req.visaType ? req : r);
            } else {
                return [...prev, req];
            }
        });
    };

    const handleAddResource = (res: ExternalResource) => {
        setResources(prev => [...prev, res]);
    };

    const handleUpdateResource = (id: string, updatedRes: Partial<ExternalResource>) => {
        setResources(prev => prev.map(r => r.id === id ? { ...r, ...updatedRes } : r));
    };

    const handleDeleteResource = (id: string) => {
        setResources(prev => prev.filter(r => r.id !== id));
    };

    const handleAddTask = (text: string) => {
        const newTask: TodoTask = {
            id: `task_${Date.now()}`,
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        setTasks(prev => [newTask, ...prev]);
    };

    const handleToggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleDeleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleAddTemplate = (tpl: LetterTemplate) => {
        setTemplates(prev => [...prev, tpl]);
    };

    const handleUpdateTemplate = (id: string, updated: Partial<LetterTemplate>) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    };

    const handleDeleteTemplate = (id: string) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    const handleResetAllData = () => {
        // Clear localStorage immediately
        localStorage.clear();

        // Reset all state to empty or default to trigger useEffects to write clean state (or just to clear UI)
        setClients([]);
        setRequirements(INITIAL_REQUIREMENTS);
        setResources(INITIAL_RESOURCES);
        setTasks([]);
        setTemplates(INITIAL_TEMPLATES);
        setOpeningLogs(INITIAL_OPENING_LOGS);
        setSettings(DEFAULT_SETTINGS);

        // Force reload to ensure a clean slate
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard clients={clients} onSelectClient={handleSelectClient} />;
            case 'analytics':
                return <AnalyticsView clients={clients} />;
            case 'clients':
                return (
                    <ClientList
                        clients={clients}
                        onSelectClient={handleSelectClient}
                        onCreateClient={handleCreateClient}
                        onDeleteClient={handleDeleteClient}
                        onUpdateClient={handleUpdateClient}
                        isArchiveView={false}
                        visaTypes={settings.visaTypes}
                        destinations={settings.destinations}
                        centers={settings.centers}
                    />
                );
            case 'kanban':
                return <KanbanView clients={clients} onUpdateStatus={handleUpdateStatus} onSelectClient={handleSelectClient} />;
            case 'archives':
                return (
                    <ClientList
                        clients={clients}
                        onSelectClient={handleSelectClient}
                        onCreateClient={handleCreateClient}
                        onDeleteClient={handleDeleteClient}
                        onUpdateClient={handleUpdateClient}
                        onDeleteApplication={handleDeleteApplication}
                        onToggleArchive={handleToggleArchive}
                        isArchiveView={true}
                        visaTypes={settings.visaTypes}
                        destinations={settings.destinations}
                        centers={settings.centers}
                    />
                );
            case 'appointment-tracker':
                return (
                    <AppointmentTracker
                        clients={clients}
                        onUpdateApplication={handleUpdateApplication}
                        onUpdateStatus={handleUpdateStatus}
                        openingLogs={openingLogs}
                        centers={settings.centers}
                    />
                );
            case 'requirements':
                return <RequirementsView requirements={requirements} onUpdateRequirements={handleUpdateRequirements} visaTypes={settings.visaTypes} />;
            case 'resources':
                return <ResourcesView resources={resources} onAddResource={handleAddResource} onUpdateResource={handleUpdateResource} onDeleteResource={handleDeleteResource} />;
            case 'tasks':
                return <TasksView tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />;
            case 'templates':
                return <TemplatesView templates={templates} onAddTemplate={handleAddTemplate} onUpdateTemplate={handleUpdateTemplate} onDeleteTemplate={handleDeleteTemplate} />;
            case 'settings':
                return <SettingsView settings={settings} onUpdateSettings={setSettings} onResetAll={handleResetAllData} />;
            case 'client-detail':
                const client = clients.find(c => c.id === selectedClientId);
                if (!client) return <ClientList clients={clients} onSelectClient={handleSelectClient} onCreateClient={handleCreateClient} onDeleteClient={handleDeleteClient} onUpdateClient={handleUpdateClient} visaTypes={settings.visaTypes} destinations={settings.destinations} centers={settings.centers} />;
                return (
                    <ClientDetail
                        client={client}
                        onBack={handleBackToClients}
                        onUpdateStatus={handleUpdateStatus}
                        onAddDocument={handleAddDocument}
                        onToggleArchive={(clientId) => { }}
                        onToggleArchiveApp={handleToggleArchive}
                        onUpdateClient={handleUpdateClient}
                        onUpdateApplication={handleUpdateApplication}
                        onAddApplication={handleAddApplication}
                        onDeleteClient={handleDeleteClient}
                        onDeleteApplication={handleDeleteApplication}
                        visaTypes={settings.visaTypes}
                        destinations={settings.destinations}
                        templates={templates}
                    />
                );
            case 'calendar':
                return <CalendarView clients={clients} />;
            default:
                return <Dashboard clients={clients} onSelectClient={handleSelectClient} />;
        }
    };

    if (isLocked) {
        return <LockScreen onUnlock={() => setIsLocked(false)} settings={settings} />;
    }

    return (
        <Layout currentView={currentView} onChangeView={setCurrentView} settings={settings} onLock={() => setIsLocked(true)}>
            {isRadarActive && radarAlertQueue.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border-4 border-red-500 transform scale-100 animate-bounce-short">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto mb-4 animate-ping-slow">
                            <span className="text-2xl">🔔</span>
                        </div>
                        <h2 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-2">
                            ACTION REQUISE !
                        </h2>
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                            Le radar a détecté {radarAlertQueue.length} dossier(s) à vérifier immédiatement.
                        </p>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                            {radarAlertQueue.map(alert => (
                                <div key={alert.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-red-900 dark:text-red-200 text-lg">{alert.clientName}</p>
                                        <p className="text-sm text-red-700 dark:text-red-300">{alert.destination}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setRadarAlertQueue(q => q.filter(a => a.id !== alert.id));
                                            setCurrentView('appointment-tracker');
                                            if (radarAlertQueue.length === 1) stopAlerts();
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold shadow-md"
                                    >
                                        VÉRIFIER
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => {
                                    setRadarAlertQueue([]);
                                    stopAlerts();
                                }}
                                className="text-slate-400 hover:text-slate-600 underline text-sm"
                            >
                                Arrêter l'alarme (Ignorer)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renderView()}
        </Layout>
    );
};

export default App;
