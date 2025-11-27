
import React, { useState, useEffect } from 'react';
import { Client, ApplicationStatus, FamilyMember } from '../types';
import { SearchIcon, PlusIcon, MessageCircleIcon, TrashIcon, EditIcon, ListIcon, GridIcon, PhoneIcon, UsersIcon, CameraIcon, SparklesIcon, BoltIcon, BotIcon } from '../components/Icons';


interface ClientListProps {
    clients: Client[];
    onSelectClient: (id: string) => void;
    onCreateClient: (client: Client) => void;
    onDeleteClient: (id: string) => void;
    onUpdateClient: (id: string, data: Partial<Client>) => void;
    isArchiveView?: boolean;
    visaTypes: string[]; // Received from settings
    destinations: string[]; // Received from settings
    centers: { name: string; url: string }[]; // Received from settings
    onDeleteApplication?: (clientId: string, appId: string) => void;
    onToggleArchive?: (clientId: string, appId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, onCreateClient, onDeleteClient, onUpdateClient, isArchiveView = false, visaTypes = ['Tourisme'], destinations = ['France'], centers = [], onDeleteApplication, onToggleArchive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [addVisaImmediately, setAddVisaImmediately] = useState(true);


    // Handle responsive default view
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('grid');
            } else {
                setViewMode('list');
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        passportNumber: '',
        passportExpiry: '',
        phone: '',
        email: '',
        notes: '',
        // Visa Fields
        destination: destinations[0] || 'France',
        center: centers[0]?.name || 'TLSContact Tunis', // Use first center from props or default
        visaType: visaTypes[0] || 'Tourisme',
        price: '',
        deposit: '',
        // Group fields
        groupType: 'solo' as 'solo' | 'couple' | 'family',

    });

    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRelation, setNewMemberRelation] = useState('Conjoint(e)');

    // Filter by search and Archive status and Sort Alphabetically
    const filteredClients = clients
        .filter(c => {
            const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                c.phone.includes(searchTerm);

            // Archive Logic changed: Check if client has ANY archived application
            const hasArchivedApps = c.applications.some(app => app.archived === true);

            // If isArchiveView, show clients who have at least one archived app.
            // If not isArchiveView (Annuaire), show all clients (or those with active apps, depending on preference).
            // Standard CRM behavior: Directory lists everyone.

            const matchesArchiveStatus = isArchiveView
                ? hasArchivedApps
                : true; // Show everyone in main directory

            return matchesSearch && matchesArchiveStatus;
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Group by First Letter for Annuaire View (Grid Mode)
    const groupedClients = filteredClients.reduce((acc, client) => {
        const firstLetter = client.fullName.charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(client);
        return acc;
    }, {} as Record<string, Client[]>);

    const sortedLetters = Object.keys(groupedClients).sort();

    const openCreateModal = () => {
        setEditingClient(null);
        setAddVisaImmediately(true);
        setFormData({
            fullName: '',
            passportNumber: '',
            passportExpiry: '',
            phone: '',
            email: '',
            notes: '',
            destination: destinations[0] || 'France',
            center: centers[0]?.name || 'TLSContact Tunis', // Use first center from props or default
            visaType: visaTypes[0] || 'Tourisme',
            price: '',
            deposit: '',
            groupType: 'solo'
        });
        setFamilyMembers([]);
        setShowModal(true);
    }

    const openEditModal = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation();
        setEditingClient(client);
        setFormData({
            fullName: client.fullName,
            passportNumber: client.passportNumber || '',
            passportExpiry: client.passportExpiry || '',
            phone: client.phone,
            email: client.email,
            notes: client.notes || '',
            // Preserve existing or default
            destination: destinations[0] || 'France',
            center: centers[0]?.name || 'TLSContact Tunis', // Use first center from props or default
            visaType: 'Tourisme',
            price: '',
            deposit: '',
            groupType: 'solo'
        });
        setAddVisaImmediately(false);
        setFamilyMembers([]);
        setShowModal(true);
    }

    const handleAddMember = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        const newMember: FamilyMember = {
            id: `mem_${Date.now()}`,
            fullName: newMemberName,
            relation: newMemberRelation as any
        };

        setFamilyMembers([...familyMembers, newMember]);
        setNewMemberName('');
    };

    const handleRemoveMember = (id: string) => {
        setFamilyMembers(familyMembers.filter(m => m.id !== id));
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Voulez-vous vraiment supprimer ce contact ?')) {
            onDeleteClient(id);
        }
    }

    const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation();
        const url = `https://wa.me/${phone.replace(/\s+/g, '')}`;
        window.open(url, '_blank');
    }



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingClient) {
            // Edit Mode (Only Contact Info + Optional New App)
            const updates: Partial<Client> = {
                fullName: formData.fullName,
                passportNumber: formData.passportNumber,
                passportExpiry: formData.passportExpiry,
                phone: formData.phone,
                email: formData.email,
                notes: formData.notes
            };

            if (addVisaImmediately) {
                const newApp = {
                    id: `app_${Date.now()}`,
                    destination: formData.destination,
                    center: formData.center,
                    visaType: formData.visaType,
                    status: ApplicationStatus.DRAFT,
                    archived: false,
                    price: formData.price ? parseFloat(formData.price) : 0,
                    deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
                    documents: [],
                    appointmentConfig: {
                        // Managed via Settings/Center
                    },
                    members: formData.groupType !== 'solo' ? familyMembers : []
                };
                updates.applications = [...editingClient.applications, newApp];
            }

            onUpdateClient(editingClient.id, updates);
        } else {
            // Create Mode
            const newClient: Client = {
                id: Date.now().toString(),
                fullName: formData.fullName,
                passportNumber: formData.passportNumber,
                passportExpiry: formData.passportExpiry,
                phone: formData.phone,
                email: formData.email,
                address: '',
                // archived: false, // Removed
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`,
                notes: formData.notes,
                history: [{
                    id: 'init',
                    date: new Date().toISOString().split('T')[0],
                    type: 'meeting',
                    notes: 'Contact créé'
                }],
                applications: []
            };

            // If checkbox is checked, add the initial application
            if (addVisaImmediately) {
                newClient.applications.push({
                    id: `app_${Date.now()}`,
                    destination: formData.destination,
                    center: formData.center,
                    visaType: formData.visaType,
                    status: ApplicationStatus.DRAFT,
                    archived: false,
                    price: formData.price ? parseFloat(formData.price) : 0,
                    deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
                    documents: [],
                    // Pre-fill login for the bot immediately with the client email
                    appointmentConfig: {
                        // Managed via Settings/Center
                    },
                    members: formData.groupType !== 'solo' ? familyMembers : []
                });
            }

            onCreateClient(newClient);
        }
        setShowModal(false);
    };

    return (
        <div className="p-6 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isArchiveView ? 'Archives (Clients ayant des dossiers archivés)' : 'Annuaire Clients'}
                </h1>
                <div className="flex gap-2">
                    {!isArchiveView && (
                        <button
                            onClick={openCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Nouveau Client</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col flex-grow">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900">
                    {/* Search */}
                    <div className="relative w-full sm:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* View Toggles */}
                    <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                            title="Vue Cartes"
                        >
                            <GridIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                            title="Vue Liste"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-grow p-4">

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="space-y-8">
                            {sortedLetters.map(letter => (
                                <div key={letter}>
                                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 mb-4 pb-1 pl-1 sticky top-0 bg-white dark:bg-slate-800 z-10 opacity-95">
                                        {letter}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {groupedClients[letter].map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => onSelectClient(client.id)}
                                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group relative hover:border-blue-400 dark:hover:border-blue-500"
                                            >
                                                {/* Quick Actions Top Right */}
                                                <button
                                                    onClick={(e) => openEditModal(e, client)}
                                                    className="absolute top-3 right-3 text-slate-300 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>

                                                <div className="flex items-center gap-4 mb-4">
                                                    <img src={client.avatarUrl} alt={client.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600" />
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-slate-800 dark:text-white truncate" title={client.fullName}>{client.fullName}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                            {client.passportNumber || 'Pas de passeport'}
                                                        </p>
                                                        {/* Alert Passport Expiry */}
                                                        {client.passportExpiry && (
                                                            (() => {
                                                                const expiry = new Date(client.passportExpiry);
                                                                const now = new Date();
                                                                const diffTime = expiry.getTime() - now.getTime();
                                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                if (diffDays < 180) { // Less than 6 months
                                                                    return (
                                                                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                                                                            ⚠️ Expire bientôt
                                                                        </span>
                                                                    )
                                                                }
                                                                return null;
                                                            })()
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <PhoneIcon className="w-4 h-4 text-slate-400" />
                                                        <a href={`tel:${client.phone}`} onClick={e => e.stopPropagation()} className="hover:text-blue-600 transition">{client.phone}</a>
                                                    </div>
                                                    {client.email && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-slate-400">@</span>
                                                            <a href={`mailto:${client.email}`} onClick={e => e.stopPropagation()} className="truncate hover:text-blue-600 transition">{client.email}</a>
                                                        </div>
                                                    )}
                                                    {client.notes && (
                                                        <p className="text-xs text-slate-400 italic mt-2 truncate border-t border-slate-100 pt-2 dark:border-slate-600">
                                                            "{client.notes}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-600">
                                                    <button
                                                        onClick={(e) => handleWhatsApp(e, client.phone)}
                                                        className="flex-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                                                    >
                                                        <MessageCircleIcon className="w-3.5 h-3.5" />
                                                        WhatsApp
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, client.id)}
                                                        className="w-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <>
                            {/* Mobile Card View (Visible on small screens) */}
                            <div className="md:hidden space-y-4">
                                {isArchiveView ? (
                                    // ARCHIVE MOBILE VIEW
                                    filteredClients.flatMap(client =>
                                        client.applications
                                            .filter(app => app.archived)
                                            .map(app => (
                                                <div key={`${client.id}-${app.id}`} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <img src={client.avatarUrl} alt={client.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                            <div>
                                                                <p className="font-bold text-slate-800 dark:text-white">{client.fullName}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</p>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-600">
                                                            {app.destination}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-600 pt-3 mt-2">
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {client.email || 'Pas d\'email'}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => onToggleArchive && onToggleArchive(client.id, app.id)}
                                                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition border border-green-200 flex items-center justify-center"
                                                                title="Restaurer"
                                                            >
                                                                <BoltIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm('Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ce dossier ? Cette action est irréversible.')) {
                                                                        onDeleteApplication && onDeleteApplication(client.id, app.id);
                                                                    }
                                                                }}
                                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition border border-red-200 flex items-center justify-center"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )
                                ) : (
                                    // NORMAL MOBILE VIEW
                                    filteredClients.map(client => (
                                        <div
                                            key={client.id}
                                            onClick={() => onSelectClient(client.id)}
                                            className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={client.avatarUrl} alt={client.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white">{client.fullName}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleWhatsApp(e, client.phone)}
                                                        className="p-2 text-green-600 bg-green-50 dark:bg-green-900/30 rounded-full"
                                                    >
                                                        <MessageCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {client.applications.filter(a => !a.archived).map(app => (
                                                    <span key={app.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-100">
                                                        {app.destination}
                                                    </span>
                                                ))}
                                                {client.applications.length === 0 && (
                                                    <span className="text-[10px] text-slate-400 italic">Aucun dossier actif</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-600 pt-3">
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {client.email || 'Pas d\'email'}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => openEditModal(e, client)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, client.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-full"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View (Hidden on small screens) */}
                            <div className="hidden md:block">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom & Prénom</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Téléphone</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                            {isArchiveView ? (
                                                <>
                                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossiers</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {isArchiveView ? (
                                            // ARCHIVE VIEW: List individual archived applications
                                            filteredClients.flatMap(client =>
                                                client.applications
                                                    .filter(app => app.archived)
                                                    .map(app => (
                                                        <tr key={`${client.id}-${app.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={client.avatarUrl} alt={client.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                                    <div>
                                                                        <p className="font-medium text-slate-800 dark:text-slate-200">{client.fullName}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{client.phone}</td>
                                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{client.email || '-'}</td>
                                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-600">
                                                                    {app.destination}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => onToggleArchive && onToggleArchive(client.id, app.id)}
                                                                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition border border-green-200 flex items-center justify-center"
                                                                        title="Restaurer le dossier"
                                                                    >
                                                                        <BoltIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (window.confirm('Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ce dossier ? Cette action est irréversible.')) {
                                                                                onDeleteApplication && onDeleteApplication(client.id, app.id);
                                                                            }
                                                                        }}
                                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition border border-red-200 flex items-center justify-center"
                                                                        title="Supprimer définitivement"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )
                                        ) : (
                                            // NORMAL VIEW
                                            filteredClients.map(client => (
                                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer" onClick={() => onSelectClient(client.id)}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={client.avatarUrl} alt={client.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                            <div>
                                                                <p className="font-medium text-slate-800 dark:text-slate-200">{client.fullName}</p>
                                                                {client.passportNumber && <p className="text-xs text-slate-500 dark:text-slate-400">{client.passportNumber}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{client.phone}</td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{client.email || '-'}</td>
                                                    <td className="p-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {client.applications.filter(a => !a.archived).map(app => (
                                                                <span key={app.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-100">
                                                                    {app.destination}
                                                                </span>
                                                            ))}
                                                            {client.applications.filter(a => a.archived).length > 0 && (
                                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] rounded border border-orange-100">
                                                                    +{client.applications.filter(a => a.archived).length} arch.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => handleWhatsApp(e, client.phone)}
                                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-full transition"
                                                                title="Envoyer WhatsApp"
                                                            >
                                                                <MessageCircleIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => openEditModal(e, client)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition"
                                                                title="Modifier infos"
                                                            >
                                                                <EditIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(e, client.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {filteredClients.length === 0 && (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-500">
                                <SearchIcon className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-medium">Aucun client trouvé.</p>
                            {!isArchiveView && <p className="text-sm">Ajoutez votre premier client.</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Creation/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h2 className="font-bold text-slate-800 dark:text-white">{editingClient ? 'Modifier Client' : 'Nouveau Client'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">



                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nom & Prénom (Demandeur Principal)
                                </label>
                                <input required type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="ex: Ahmed Salah" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                    <input required type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+216..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input type="email" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="client@email.com" />
                                </div>
                            </div>

                            {/* Passport Fields REMOVED as per request */}
                            {/* <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">N° Passeport (Optionnel)</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.passportNumber} onChange={e => setFormData({ ...formData, passportNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Exp. Passeport</label>
                                    <input type="date" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.passportExpiry} onChange={e => setFormData({ ...formData, passportExpiry: e.target.value })} />
                                </div>
                            </div> */}

                            {/* Creation de Dossier (Available for both New and Edit) */}
                            <div className="border border-blue-100 dark:border-blue-900 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="addVisa"
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                        checked={addVisaImmediately}
                                        onChange={e => setAddVisaImmediately(e.target.checked)}
                                    />
                                    <label htmlFor="addVisa" className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                                        {editingClient ? 'Ajouter un nouveau dossier visa' : 'Créer un dossier visa immédiatement'}
                                    </label>
                                </div>

                                {addVisaImmediately && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Type de Dossier</label>
                                            <div className="flex gap-2">
                                                {['solo', 'couple', 'family'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, groupType: type as any })}
                                                        className={`flex-1 py-1.5 text-xs font-medium rounded border transition ${formData.groupType === type
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {type === 'solo' ? 'Individuel' : type === 'couple' ? 'Couple' : 'Famille'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Family Members Section */}
                                        {formData.groupType !== 'solo' && (
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Accompagnateurs</h4>

                                                {/* List */}
                                                {familyMembers.length > 0 && (
                                                    <ul className="mb-3 space-y-1">
                                                        {familyMembers.map((m, idx) => (
                                                            <li key={m.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-700 p-1.5 rounded">
                                                                <span>{m.fullName} <span className="text-slate-400">({m.relation})</span></span>
                                                                <button type="button" onClick={() => handleRemoveMember(m.id)} className="text-red-500">×</button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Add Form */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-grow p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                                        placeholder="Nom complet"
                                                        value={newMemberName}
                                                        onChange={e => setNewMemberName(e.target.value)}
                                                    />
                                                    <select
                                                        className="p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                                        value={newMemberRelation}
                                                        onChange={e => setNewMemberRelation(e.target.value)}
                                                    >
                                                        <option>Conjoint(e)</option>
                                                        <option>Enfant</option>
                                                        <option>Parent</option>
                                                        <option>Autre</option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddMember}
                                                        className="bg-green-600 text-white px-2 rounded text-xs"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none"
                                                    value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}>
                                                    {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Centre / Ville</label>
                                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none"
                                                    value={formData.center} onChange={e => setFormData({ ...formData, center: e.target.value })}>
                                                    <option value="">Sélectionner un centre</option>
                                                    {(centers || []).map((center, idx) => (
                                                        <option key={`${center.name}-${idx}`} value={center.name}>{center.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type de Visa</label>
                                            <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none"
                                                value={formData.visaType} onChange={e => setFormData({ ...formData, visaType: e.target.value })}>
                                                {visaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Prix Total (TND)</label>
                                                <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none"
                                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Acompte (TND)</label>
                                                <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none"
                                                    value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} placeholder="0" />
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note Rapide</label>
                                <textarea className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Information importante..." />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg mt-4 transition">
                                {editingClient ? 'Enregistrer' : 'Créer le client'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;
