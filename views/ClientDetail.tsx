
import React, { useState, useEffect } from 'react';
import { Client, ApplicationStatus, DocumentItem, Application, PriorityMode, LetterTemplate, FamilyMember } from '../types';
import { FileTextIcon, MessageCircleIcon, PhoneIcon, CalendarIcon, SparklesIcon, DownloadIcon, PlusIcon, ArchiveIcon, EditIcon, SaveIcon, TrashIcon, BotIcon, FileSignatureIcon, PrinterIcon, CopyIcon, CheckCircleIcon, UsersIcon, ClockIcon, AlertTriangleIcon, GlobeIcon } from '../components/Icons';


interface ClientDetailProps {
    client: Client;
    onBack: () => void;
    onUpdateStatus: (clientId: string, appId: string, status: ApplicationStatus) => void;
    onAddDocument: (clientId: string, appId: string, doc: DocumentItem) => void;
    onToggleArchive: (clientId: string) => void;
    onToggleArchiveApp: (clientId: string, appId: string) => void;
    onUpdateClient: (clientId: string, data: Partial<Client>) => void;
    onUpdateApplication: (clientId: string, appId: string, data: Partial<Application>) => void;
    onAddApplication: (clientId: string, application: Application) => void;
    onDeleteClient: (clientId: string) => void;
    onDeleteApplication: (clientId: string, appId: string) => void;
    visaTypes?: string[];
    destinations?: string[];
    templates?: LetterTemplate[];
}

interface TimelineEventProps {
    date: string;
    title: string;
    subtitle?: string;
    isLast?: boolean;
    daysSinceLast?: number;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ date, title, subtitle, isLast, daysSinceLast }) => (
    <div className="flex gap-4 relative">
        {!isLast && <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-slate-200 dark:bg-slate-700"></div>}
        <div className="relative z-10 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
            <ClockIcon className="w-5 h-5" />
        </div>
        <div className="pb-8 flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h4>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className="text-right">
                    <span className="text-xs font-mono font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">{date}</span>
                </div>
            </div>
            {daysSinceLast !== undefined && daysSinceLast > 0 && (
                <div className="mt-1">
                    <span className="text-[10px] text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                        +{daysSinceLast} jours après
                    </span>
                </div>
            )}
        </div>
    </div>
);

const REFUSAL_REASONS = [
    "Objet et conditions du séjour non justifiés",
    "Moyens de subsistance insuffisants",
    "Volonté de quitter le territoire non établie",
    "Document de voyage faux ou falsifié",
    "Signalement aux fins de non-admission (SIS)",
    "Menace pour l'ordre public ou la sécurité",
    "Assurance voyage non valable",
    "Preuve d'hébergement non fiable"
];

const ClientDetail: React.FC<ClientDetailProps> = ({
    client,
    onBack,
    onUpdateStatus,
    onAddDocument,
    onToggleArchive,
    onToggleArchiveApp,
    onUpdateClient,
    onUpdateApplication,
    onAddApplication,
    onDeleteClient,
    onDeleteApplication,
    visaTypes = ['Tourisme'],
    destinations = ['France'],
    templates = []
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'apps' | 'history'>('apps');
    const [draftMessage, setDraftMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [analyzingFile, setAnalyzingFile] = useState(false);

    const [selectedAppId, setSelectedAppId] = useState<string | null>(client.applications[0]?.id || null);

    useEffect(() => {
        if (client.applications.length > 0) {
            if (!selectedAppId || !client.applications.find(a => a.id === selectedAppId)) {
                setSelectedAppId(client.applications[0].id);
            }
        } else {
            setSelectedAppId(null);
        }
    }, [client.applications, selectedAppId]);

    const currentApp = client.applications.find(a => a.id === selectedAppId);

    // Edit Mode State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        passportNumber: '',
        passportExpiry: '',
        phone: '',
        email: '',
        address: ''
    });

    const [showFinanceModal, setShowFinanceModal] = useState(false);
    const [financeFormData, setFinanceFormData] = useState({ price: '', deposit: '' });

    const [showEditAppModal, setShowEditAppModal] = useState(false);
    const [editAppFormData, setEditAppFormData] = useState<any>({});



    const [showNewAppModal, setShowNewAppModal] = useState(false);
    const [newAppFormData, setNewAppFormData] = useState<any>({});

    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersFormData, setMembersFormData] = useState<any>({});

    const [showDocGenModal, setShowDocGenModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
    const [generatedContent, setGeneratedContent] = useState('');
    const [newNote, setNewNote] = useState('');

    // Refusal Modal
    const [showRefusalModal, setShowRefusalModal] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');
    const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);

    // Appointment Modal
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentFormData, setAppointmentFormData] = useState({
        appId: '',
        date: '',
        hour: '09',
        minute: '00'
    });

    const [notes, setNotes] = useState(client.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        setNotes(client.notes || '');
    }, [client.id, client.notes]);

    const handleGenerateMessage = async () => {
        if (!currentApp) return;
        setIsGenerating(true);
        // Static template replacement for Gemini
        const msg = `Bonjour ${client.fullName},\n\nVoici les détails de votre rendez-vous pour ${currentApp.destination}:\nCentre: ${currentApp.center}\nDate: ${currentApp.appointmentDate || 'Non fixée'}\n\nCordialement.`;
        setDraftMessage(msg);
        setIsGenerating(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && currentApp) {
            setAnalyzingFile(true);
            const file = e.target.files[0];
            await new Promise(resolve => setTimeout(resolve, 800));
            // Static type assignment replacement for Gemini
            const type = "Document";

            const newDoc: DocumentItem = {
                id: Date.now().toString(),
                name: file.name,
                type: type,
                uploadDate: new Date().toISOString().split('T')[0],
                status: 'valid'
            };

            onAddDocument(client.id, currentApp.id, newDoc);
            setAnalyzingFile(false);
            setActiveTab('docs');
        }
    }

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ApplicationStatus;
        if (!currentApp) return;

        if (newStatus === ApplicationStatus.REFUSED) {
            setRefusalReason(currentApp.refusalReason || '');
            setShowRefusalModal(true);
        } else {
            onUpdateStatus(client.id, currentApp.id, newStatus);
        }
    };

    const confirmRefusal = () => {
        if (currentApp) {
            onUpdateApplication(client.id, currentApp.id, {
                status: ApplicationStatus.REFUSED,
                refusalReason: refusalReason
            });
            setShowRefusalModal(false);
        }
    };

    const handleGenerateAppeal = async () => {
        if (!currentApp || !currentApp.refusalReason) return;
        setIsGeneratingAppeal(true);
        // Static template replacement for Gemini
        const appealText = `Objet: Recours gracieux concernant le refus de visa\n\nMadame, Monsieur,\n\nJe me permets de solliciter votre bienveillance pour réexaminer ma demande de visa refusée pour le motif suivant : ${currentApp.refusalReason}.\n\n[VOTRE ARGUMENTATION ICI]\n\nDans l'attente de votre réponse, je vous prie d'agréer l'expression de mes salutations distinguées.\n\n${client.fullName}`;
        setGeneratedContent(appealText);
        setSelectedTemplate(null);
        setShowDocGenModal(true);
        setIsGeneratingAppeal(false);
    };

    const openEditModal = () => {
        setEditFormData({
            fullName: client.fullName,
            passportNumber: client.passportNumber || '',
            passportExpiry: client.passportExpiry || '',
            phone: client.phone,
            email: client.email,
            address: client.address || ''
        });
        setShowEditModal(true);
    };

    const handleSaveClient = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateClient(client.id, editFormData);
        setShowEditModal(false);
    };

    const handleSaveNotes = () => {
        setIsSavingNotes(true);
        onUpdateClient(client.id, { notes });
        setTimeout(() => setIsSavingNotes(false), 500);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        const updatedHistory = [
            {
                id: `note_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'system' as const,
                notes: newNote.trim()
            },
            ...client.history
        ];

        onUpdateClient(client.id, { history: updatedHistory });
        setNewNote('');
    };

    const openFinanceModal = () => {
        if (!currentApp) return;
        setFinanceFormData({
            price: currentApp.price ? currentApp.price.toString() : '',
            deposit: currentApp.deposit ? currentApp.deposit.toString() : ''
        });
        setShowFinanceModal(true);
    };

    const handleSaveFinance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentApp) return;

        onUpdateApplication(client.id, currentApp.id, {
            price: parseFloat(financeFormData.price) || 0,
            deposit: parseFloat(financeFormData.deposit) || 0
        });
        setShowFinanceModal(false);
    };



    const handleCreateApplication = (e: React.FormEvent) => {
        e.preventDefault();
        const newApp: Application = {
            id: `app_${Date.now()}`,
            destination: newAppFormData.destination,
            center: newAppFormData.center,
            visaType: newAppFormData.visaType,
            status: ApplicationStatus.DRAFT,
            price: newAppFormData.price ? parseFloat(newAppFormData.price) : 0,
            deposit: newAppFormData.deposit ? parseFloat(newAppFormData.deposit) : 0,
            documents: [],
            appointmentConfig: {
                portalLogin: client.email
            },
            members: []
        };

        onAddApplication(client.id, newApp);
        setSelectedAppId(newApp.id);
        setShowNewAppModal(false);
    }

    const handleDelete = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce client ?")) {
            onDeleteClient(client.id);
        }
    }

    const openEditAppModal = (app: Application) => {
        setEditAppFormData({
            id: app.id,
            destination: app.destination,
            center: app.center || 'TLSContact Tunis',
            visaType: app.visaType,
            price: app.price ? app.price.toString() : '',
            deposit: app.deposit ? app.deposit.toString() : ''
        });
        setShowEditAppModal(true);
    };

    const handleSaveEditedApp = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateApplication(client.id, editAppFormData.id, {
            destination: editAppFormData.destination,
            center: editAppFormData.center,
            visaType: editAppFormData.visaType,
            price: parseFloat(editAppFormData.price) || 0,
            deposit: parseFloat(editAppFormData.deposit) || 0
        });
        setShowEditAppModal(false);
    };

    const handleDeleteApplicationRequest = (appId: string) => {
        if (window.confirm("Supprimer ce dossier définitivement ? Cette action est irréversible.")) {
            onDeleteApplication(client.id, appId);
        }
    };

    const openMembersModal = (app: Application) => {
        setMembersFormData({
            appId: app.id,
            members: app.members || [],
            newMemberName: '',
            newMemberRelation: 'Conjoint(e)'
        });
        setShowMembersModal(true);
    };

    const handleAddMember = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!membersFormData.newMemberName.trim()) return;
        const newMember: FamilyMember = {
            id: `mem_${Date.now()}`,
            fullName: membersFormData.newMemberName,
            relation: membersFormData.newMemberRelation as any
        };
        setMembersFormData((prev: any) => ({
            ...prev,
            members: [...prev.members, newMember],
            newMemberName: ''
        }));
    };

    const handleRemoveMember = (e: React.MouseEvent, memberId: string) => {
        e.preventDefault();
        setMembersFormData((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.id !== memberId)
        }));
    };

    const handleSaveMembers = () => {
        onUpdateApplication(client.id, membersFormData.appId, {
            members: membersFormData.members
        });
        setShowMembersModal(false);
    };

    const handleOpenGenerator = () => {
        setSelectedTemplate(templates[0] || null);
        if (templates[0]) {
            generateContent(templates[0]);
        }
        setShowDocGenModal(true);
    };

    const generateContent = (tpl: LetterTemplate) => {
        let content = tpl.content;
        content = content.replace(/{{nom}}/g, client.fullName);
        content = content.replace(/{{passeport}}/g, client.passportNumber || '[PASSEPORT]');
        content = content.replace(/{{telephone}}/g, client.phone);
        content = content.replace(/{{email}}/g, client.email || '');
        content = content.replace(/{{adresse}}/g, client.address || '');

        if (currentApp) {
            content = content.replace(/{{destination}}/g, currentApp.destination);
            content = content.replace(/{{type_visa}}/g, currentApp.visaType);

            if (currentApp.members && currentApp.members.length > 0) {
                const familyList = currentApp.members.map(m => `- ${m.fullName} (${m.relation})`).join('\n');
                content = content.replace(/{{famille}}/g, familyList);
            } else {
                content = content.replace(/{{famille}}/g, '');
            }
        }
        setGeneratedContent(content);
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tpl = templates.find(t => t.id === e.target.value);
        if (tpl) {
            setSelectedTemplate(tpl);
            generateContent(tpl);
        }
    };

    const openAppointmentModal = (appId: string) => {
        const now = new Date();
        setAppointmentFormData({
            appId,
            date: now.toISOString().split('T')[0],
            hour: '09',
            minute: '00'
        });
        setShowAppointmentModal(true);
    };

    const handleConfirmAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        const { appId, date, hour, minute } = appointmentFormData;
        const fullDate = `${date} ${hour}:${minute}`;

        // Update appointment date and status
        onUpdateApplication(client.id, appId, {
            appointmentDate: fullDate,
            status: ApplicationStatus.APPOINTMENT_SET
        });

        // Also trigger status update for opening log
        onUpdateStatus(client.id, appId, ApplicationStatus.APPOINTMENT_SET);

        setShowAppointmentModal(false);
    };

    const getTimelineEvents = () => {
        if (!currentApp) return [];
        const events: { date: string; title: string; subtitle: string; timestamp: number }[] = [];
        const creationLog = client.history.find(h => h.notes.includes('dossier créé') || h.notes.includes('Contact créé'));
        events.push({
            date: creationLog?.date || new Date().toISOString().split('T')[0],
            title: "Ouverture du dossier",
            subtitle: `Destination: ${currentApp.destination}`,
            timestamp: new Date(creationLog?.date || Date.now()).getTime()
        });
        if (currentApp.appointmentDate) {
            events.push({
                date: currentApp.appointmentDate,
                title: "Rendez-vous Fixé",
                subtitle: `Centre: ${currentApp.center}`,
                timestamp: new Date(currentApp.appointmentDate).getTime()
            });
        }
        if (currentApp.submissionDate) {
            events.push({
                date: currentApp.submissionDate,
                title: "Dépôt de la demande",
                subtitle: "Dossier soumis au consulat",
                timestamp: new Date(currentApp.submissionDate).getTime()
            });
        }
        if (currentApp.status === ApplicationStatus.COMPLETED || currentApp.status === ApplicationStatus.READY_PICKUP || currentApp.status === ApplicationStatus.REFUSED) {
            const lastLog = client.history[0];
            events.push({
                date: lastLog?.date || new Date().toISOString().split('T')[0],
                title: currentApp.status === ApplicationStatus.REFUSED ? "Dossier Refusé" : currentApp.status === ApplicationStatus.READY_PICKUP ? "Passeport Prêt" : "Clôture du dossier",
                subtitle: currentApp.status === ApplicationStatus.REFUSED ? "Visa non accordé" : "Fin de procédure",
                timestamp: new Date(lastLog?.date || Date.now()).getTime()
            });
        }
        return events.sort((a, b) => a.timestamp - b.timestamp);
    };

    const getTagColor = (tag: string) => {
        // Generate consistent color based on tag text
        const colors = [
            'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
            'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
            'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
            'bg-gradient-to-r from-teal-500 to-emerald-500 text-white',
            'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
            'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white',
            'bg-gradient-to-r from-sky-500 to-cyan-500 text-white',
            'bg-gradient-to-r from-lime-500 to-green-500 text-white',
        ];
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const [newTagInput, setNewTagInput] = useState<{ [appId: string]: string }>({});

    const handleAddTag = (appId: string) => {
        const tagText = newTagInput[appId]?.trim();
        if (!tagText) return;

        const app = client.applications.find(a => a.id === appId);
        if (!app) return;

        const currentTags = app.tags || [];
        if (currentTags.includes(tagText)) {
            // Tag already exists
            setNewTagInput({ ...newTagInput, [appId]: '' });
            return;
        }

        onUpdateApplication(client.id, appId, {
            tags: [...currentTags, tagText]
        });
        setNewTagInput({ ...newTagInput, [appId]: '' });
    };

    const handleRemoveTag = (appId: string, tagToRemove: string) => {
        const app = client.applications.find(a => a.id === appId);
        if (!app) return;

        const currentTags = app.tags || [];
        onUpdateApplication(client.id, appId, {
            tags: currentTags.filter(t => t !== tagToRemove)
        });
    };

    const timelineEvents = getTimelineEvents();

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-500 dark:text-slate-300 hover:text-slate-800 bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                        &larr; Retour
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Détail Client
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleDelete} className="text-xs font-medium px-3 py-1.5 rounded border bg-white dark:bg-slate-800 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <TrashIcon className="w-4 h-4" /> Supprimer Client
                    </button>
                    <button onClick={handleOpenGenerator} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 shadow-sm transition">
                        <FileSignatureIcon className="w-4 h-4" /> Générer Document
                    </button>
                    {currentApp && (
                        <div className={`flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${currentApp.status === ApplicationStatus.REFUSED ? 'ring-2 ring-red-500 border-red-500' : ''}`}>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Statut Actuel:</span>
                            <select value={currentApp.status} onChange={handleStatusChange} className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded px-2 py-1 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.values(ApplicationStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-1">
                    {/* Profil Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center relative group">
                        <button onClick={openEditModal} className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-full transition"><EditIcon className="w-4 h-4" /></button>
                        <img src={client.avatarUrl} alt={client.fullName} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-slate-50 dark:border-slate-700" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{client.fullName}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{client.email || 'Pas d\'email renseigné'}</p>
                        <div className="mt-6 space-y-3 text-left">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold">ID</span></div>
                                <div><p className="text-xs text-slate-400">ID Client</p><p className="font-mono text-base">{client.id.substring(0, 8)}...</p></div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0"><PhoneIcon className="w-4 h-4" /></div>
                                <div><p className="text-xs text-slate-400">Téléphone</p><p className="font-semibold text-base">{client.phone}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><EditIcon className="w-4 h-4 text-yellow-500" /> Notes Internes</h3>
                            <button onClick={handleSaveNotes} className={`text-xs px-2 py-1 rounded transition ${isSavingNotes ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                                {isSavingNotes ? 'Enregistré!' : 'Sauvegarder'}
                            </button>
                        </div>
                        <textarea className="w-full p-2 text-sm text-slate-700 dark:text-slate-200 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none h-24" placeholder="Ajouter une note..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                    </div>




                </div>

                {/* Right Column - Main Content */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* ... Tabs and other content remains similar, just showing BotConfigModal part ... */}
                    {/* (Shortened for brevity - imagine the tabs content here) */}
                    <div className="flex border-b border-slate-100 dark:border-slate-700">
                        <button onClick={() => setActiveTab('apps')} className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'apps' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Dossiers ({client.applications.length})</button>
                        <button onClick={() => setActiveTab('docs')} className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'docs' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Documents</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Communication</button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6">
                        {/* Content same as before, just passing down cleaned props if needed */}
                        {activeTab === 'apps' && (
                            <div className="flex flex-col gap-6">
                                {/* ... App list ... */}
                                {client.applications.slice().sort((a, b) => b.id.localeCompare(a.id)).map(app => {
                                    const remainingBalance = (app.price || 0) - (app.deposit || 0);
                                    const depositPercentage = app.price ? ((app.deposit || 0) / app.price) * 100 : 0;

                                    return (
                                        <div
                                            key={app.id}
                                            className="border bg-white dark:bg-slate-800 rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-shadow border-slate-200 dark:border-slate-700"
                                        >
                                            <div
                                                onClick={() => setSelectedAppId(app.id)}
                                                className={`p-5 cursor-pointer relative transition-colors ${selectedAppId === app.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                            >
                                                {/* Header Section */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GlobeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            <span className="font-bold text-2xl text-slate-800 dark:text-white">{app.destination}</span>
                                                            <span className="text-sm px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white font-bold shadow-md">{app.visaType}</span>
                                                            {selectedAppId === app.id && (
                                                                <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-sm">
                                                                    ACTIF
                                                                </span>
                                                            )}
                                                            {app.archived && (
                                                                <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full shadow-sm">
                                                                    ARCHIVÉ
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                            {app.center || 'Ambassade'}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${app.status === ApplicationStatus.APPOINTMENT_SET ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                                            app.status === ApplicationStatus.WAITING_APPOINTMENT ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                                                                app.status === ApplicationStatus.PROCESSING ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' :
                                                                    app.status === ApplicationStatus.SUBMITTED ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                                                        app.status === ApplicationStatus.READY_PICKUP ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                                                            app.status === ApplicationStatus.COMPLETED ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                                                                                app.status === ApplicationStatus.REFUSED ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                                                                                    'bg-gradient-to-r from-slate-500 to-gray-500 text-white'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                                    <div className={`h-full transition-all duration-500 ${app.status === ApplicationStatus.REFUSED ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} style={{ width: app.status === ApplicationStatus.COMPLETED ? '100%' : app.status === ApplicationStatus.SUBMITTED ? '60%' : app.status === ApplicationStatus.APPOINTMENT_SET ? '45%' : '20%' }}></div>
                                                </div>

                                                {/* Information Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {/* Dates Section */}
                                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">Dates Importantes</h4>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-slate-600 dark:text-slate-400">Création:</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(app.id.split('_')[1] ? parseInt(app.id.split('_')[1]) : Date.now()).toLocaleDateString('fr-FR')}</span>
                                                            </div>
                                                            {app.appointmentDate ? (
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-400">Rendez-vous:</span>
                                                                    <span className="font-bold text-blue-700 dark:text-blue-300">{app.appointmentDate}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-400">Rendez-vous:</span>
                                                                    <span className="text-slate-400 italic">Non fixé</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Financial Section */}
                                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FileTextIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">Finances</h4>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-slate-600 dark:text-slate-400">Prix total:</span>
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">{app.price || 0} TND</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-slate-600 dark:text-slate-400">Acompte:</span>
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-300">{app.deposit || 0} TND</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200 dark:border-emerald-900/30">
                                                                <span className="text-slate-600 dark:text-slate-400">Reste:</span>
                                                                <span className={`font-bold ${remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                    {remainingBalance} TND
                                                                </span>
                                                            </div>
                                                            {app.price > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${depositPercentage}%` }}></div>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">{depositPercentage.toFixed(0)}% payé</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Members & Documents */}
                                                {(app.members && app.members.length > 0) || (app.documents && app.documents.length > 0) ? (
                                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg mb-3 border border-slate-200 dark:border-slate-700">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {app.members && app.members.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <UsersIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Accompagnateurs ({app.members.length})</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-5">
                                                                        {app.members.map(m => m.fullName).join(', ')}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {app.documents && app.documents.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <FileTextIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Documents ({app.documents.length})</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-5">
                                                                        {app.documents.length} fichier{app.documents.length > 1 ? 's' : ''} ajouté{app.documents.length > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Tags Section */}
                                                <div className="space-y-2">
                                                    {app.tags && app.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {app.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`text-xs px-2.5 py-1 rounded-md font-medium shadow-sm ${getTagColor(tag)} flex items-center gap-1.5`}
                                                                >
                                                                    {tag}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveTag(app.id, tag);
                                                                        }}
                                                                        className="hover:bg-white/20 rounded-full p-0.5 transition"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Ajouter un tag..."
                                                            className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={newTagInput[app.id] || ''}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                setNewTagInput({ ...newTagInput, [app.id]: e.target.value });
                                                            }}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleAddTag(app.id);
                                                                }
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddTag(app.id);
                                                            }}
                                                            className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-end gap-2"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); onToggleArchiveApp(client.id, app.id); }}
                                                    className={`px-4 py-2 text-xs font-bold border rounded-md transition flex items-center gap-2 shadow-sm ${app.archived ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                                                >
                                                    <ArchiveIcon className="w-3 h-3" /> {app.archived ? 'Désarchiver' : 'Archiver'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); openAppointmentModal(app.id); }}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition flex items-center gap-2 shadow-sm"
                                                >
                                                    <CalendarIcon className="w-3 h-3" /> Fixer RDV
                                                </button>
                                                {app.appointmentDate && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();

                                                            console.log('🔴 [DEBUG] Button clicked!', { clientId: client.id, appId: app.id });

                                                            const confirmed = window.confirm('Supprimer ce rendez-vous ?');
                                                            console.log('🔴 [DEBUG] Confirmed:', confirmed);

                                                            if (confirmed) {
                                                                try {
                                                                    console.log('🗑️ [ClientDetail] Deleting appointment:', {
                                                                        clientId: client.id,
                                                                        appId: app.id,
                                                                        oldStatus: app.status,
                                                                        oldAppointmentDate: app.appointmentDate
                                                                    });

                                                                    // Single combined update: remove date and reset status
                                                                    onUpdateApplication(client.id, app.id, {
                                                                        appointmentDate: null as any,
                                                                        status: ApplicationStatus.WAITING_APPOINTMENT
                                                                    });

                                                                    // Add history entry
                                                                    const newHistoryEntry = {
                                                                        id: `hist_${Date.now()}`,
                                                                        date: new Date().toISOString().split('T')[0],
                                                                        type: 'system' as const,
                                                                        notes: `Rendez-vous supprimé - Retour au statut: ${ApplicationStatus.WAITING_APPOINTMENT}`
                                                                    };

                                                                    onUpdateClient(client.id, {
                                                                        history: [newHistoryEntry, ...client.history]
                                                                    });

                                                                    console.log('✅ [ClientDetail] Appointment deletion completed');
                                                                } catch (error) {
                                                                    console.error('❌ [ClientDetail] Error deleting appointment:', error);
                                                                    alert('Erreur lors de la suppression du rendez-vous: ' + error);
                                                                }
                                                            }
                                                        }}
                                                        className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition flex items-center gap-2 shadow-sm"
                                                    >
                                                        <TrashIcon className="w-3 h-3" /> Supprimer RDV
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); openEditAppModal(app); }}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-2 shadow-sm"
                                                >
                                                    <EditIcon className="w-3 h-3" /> Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); openMembersModal(app); }}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition flex items-center gap-2 shadow-sm"
                                                >
                                                    <UsersIcon className="w-3 h-3" /> Membres
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteApplicationRequest(app.id); }}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition flex items-center gap-2 shadow-sm"
                                                >
                                                    <TrashIcon className="w-3 h-3" /> Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'docs' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        Documents
                                    </h3>
                                </div>

                                {client.applications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileTextIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">Aucun dossier créé</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {client.applications.map(app => (
                                            <div key={app.id} className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                            <GlobeIcon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white">{app.destination}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{app.visaType}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                                        {app.documents?.length || 0} document(s)
                                                    </span>
                                                </div>

                                                {app.documents && app.documents.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {app.documents.map(doc => (
                                                            <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                                                        <FileTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm text-slate-800 dark:text-white truncate">{doc.name}</p>
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{doc.type} • {doc.uploadDate}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {doc.status === 'valid' && (
                                                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                                                                            ✓ Valide
                                                                        </span>
                                                                    )}
                                                                    <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition">
                                                                        <DownloadIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
                                                        Aucun document pour ce dossier
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Communication Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <MessageCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        Historique de Communication
                                    </h3>
                                </div>

                                {/* Add Note Form */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Ajouter une note
                                    </label>
                                    <div className="flex gap-2">
                                        <textarea
                                            className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            rows={3}
                                            placeholder="Écrivez une note sur cette interaction..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!newNote.trim()}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition flex items-center gap-2"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Ajouter
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-4 mt-6">
                                    {client.history.length === 0 ? (
                                        <div className="text-center py-12">
                                            <MessageCircleIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400">Aucun historique de communication</p>
                                        </div>
                                    ) : (
                                        client.history.map((interaction, index) => {
                                            const getIcon = () => {
                                                switch (interaction.type) {
                                                    case 'email': return '✉️';
                                                    case 'call': return '📞';
                                                    case 'whatsapp': return '💬';
                                                    case 'meeting': return '🤝';
                                                    case 'system': return '📝';
                                                    default: return '📋';
                                                }
                                            };

                                            const getColor = () => {
                                                switch (interaction.type) {
                                                    case 'email': return 'from-blue-500 to-cyan-500';
                                                    case 'call': return 'from-green-500 to-emerald-500';
                                                    case 'whatsapp': return 'from-green-600 to-teal-600';
                                                    case 'meeting': return 'from-purple-500 to-pink-500';
                                                    case 'system': return 'from-slate-500 to-slate-600';
                                                    default: return 'from-slate-400 to-slate-500';
                                                }
                                            };

                                            return (
                                                <div key={interaction.id} className="flex gap-4 relative">
                                                    {index < client.history.length - 1 && (
                                                        <div className="absolute left-[19px] top-10 bottom-[-16px] w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                                    )}
                                                    <div className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                        <span className="text-lg">{getIcon()}</span>
                                                    </div>
                                                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">
                                                                    {interaction.type}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                                                {interaction.date}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                                            {interaction.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                        {/* ... Other tabs ... */}
                    </div>
                </div>
            </div>

            {/* MODALS */}

            {/* Edit Client Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
                        <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Modifier Client</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Complet</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    value={editFormData.fullName} onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passeport</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={editFormData.passportNumber} onChange={e => setEditFormData({ ...editFormData, passportNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiration</label>
                                    <input type="date" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={editFormData.passportExpiry} onChange={e => setEditFormData({ ...editFormData, passportExpiry: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input type="email" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                                <textarea className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none h-20"
                                    value={editFormData.address} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Annuler</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Application Modal */}
            {showEditAppModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
                        <form onSubmit={handleSaveEditedApp} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Modifier Dossier</h2>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    value={editAppFormData.destination} onChange={e => setEditAppFormData({ ...editAppFormData, destination: e.target.value })}>
                                    {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de Visa</label>
                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    value={editAppFormData.visaType} onChange={e => setEditAppFormData({ ...editAppFormData, visaType: e.target.value })}>
                                    {visaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prix Total</label>
                                    <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={editAppFormData.price} onChange={e => setEditAppFormData({ ...editAppFormData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Acompte</label>
                                    <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={editAppFormData.deposit} onChange={e => setEditAppFormData({ ...editAppFormData, deposit: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowEditAppModal(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Annuler</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members Modal */}
            {showMembersModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Gérer les Membres</h2>

                            <div className="space-y-2 mb-4">
                                {membersFormData.members && membersFormData.members.map((m: FamilyMember) => (
                                    <div key={m.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{m.fullName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{m.relation}</p>
                                        </div>
                                        <button onClick={(e) => handleRemoveMember(e, m.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {(!membersFormData.members || membersFormData.members.length === 0) && <p className="text-sm text-slate-500 italic">Aucun membre ajouté.</p>}
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ajouter un membre</h3>
                                <div className="space-y-2">
                                    <input type="text" placeholder="Nom complet" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={membersFormData.newMemberName} onChange={e => setMembersFormData({ ...membersFormData, newMemberName: e.target.value })} />
                                    <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        value={membersFormData.newMemberRelation} onChange={e => setMembersFormData({ ...membersFormData, newMemberRelation: e.target.value })}>
                                        <option value="Conjoint(e)">Conjoint(e)</option>
                                        <option value="Enfant">Enfant</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                    <button onClick={handleAddMember} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded font-medium flex items-center justify-center gap-2">
                                        <PlusIcon className="w-4 h-4" /> Ajouter
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                                <button onClick={() => setShowMembersModal(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Fermer</button>
                                <button onClick={handleSaveMembers} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refusal Modal */}
            {showRefusalModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-6 h-6" /> Confirmer le Refus</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">Veuillez indiquer le motif du refus pour générer automatiquement le recours si nécessaire.</p>

                        <div className="space-y-2 mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motif du refus</label>
                            <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white mb-2"
                                onChange={(e) => setRefusalReason(e.target.value)} value={REFUSAL_REASONS.includes(refusalReason) ? refusalReason : 'Autre'}>
                                <option value="">Sélectionner un motif...</option>
                                {REFUSAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                <option value="Autre">Autre (Préciser)</option>
                            </select>
                            {(refusalReason === 'Autre' || !REFUSAL_REASONS.includes(refusalReason)) && (
                                <textarea
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-24 resize-none"
                                    placeholder="Précisez le motif..."
                                    value={refusalReason}
                                    onChange={(e) => setRefusalReason(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowRefusalModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Annuler</button>
                            <button onClick={confirmRefusal} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold">Confirmer Refus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Doc Gen Modal */}
            {showDocGenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-indigo-500" /> Générateur de Documents
                            </h2>
                            <button onClick={() => setShowDocGenModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modèle</label>
                            <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                onChange={handleTemplateChange} value={selectedTemplate?.id || ''}>
                                <option value="">Sélectionner un modèle...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow p-4 overflow-hidden flex flex-col">
                            <textarea
                                className="flex-grow w-full p-4 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                            <button onClick={() => { navigator.clipboard.writeText(generatedContent); alert('Copié !'); }} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 flex items-center gap-2">
                                <CopyIcon className="w-4 h-4" /> Copier
                            </button>
                            <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center gap-2">
                                <PrinterIcon className="w-4 h-4" /> Imprimer / PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Modal */}
            {showAppointmentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-6 h-6 text-green-600" />
                                Fixer un Rendez-vous
                            </h2>
                        </div>
                        <form onSubmit={handleConfirmAppointment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Date du rendez-vous
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={appointmentFormData.date}
                                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Heure
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={appointmentFormData.hour}
                                        onChange={(e) => setAppointmentFormData({ ...appointmentFormData, hour: e.target.value })}
                                    >
                                        {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                                            <option key={h} value={h.toString().padStart(2, '0')}>
                                                {h.toString().padStart(2, '0')}h
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Minutes
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={appointmentFormData.minute}
                                        onChange={(e) => setAppointmentFormData({ ...appointmentFormData, minute: e.target.value })}
                                    >
                                        {['00', '15', '30', '45'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAppointmentModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-sm"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
