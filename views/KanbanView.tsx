
import React, { useState } from 'react';
import { ApplicationStatus, Client } from '../types';
import { LayoutIcon } from '../components/Icons';

interface KanbanViewProps {
    clients: Client[];
    onUpdateStatus: (clientId: string, appId: string, status: ApplicationStatus) => void;
    onSelectClient: (id: string) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ clients, onUpdateStatus, onSelectClient }) => {
    const [draggedItem, setDraggedItem] = useState<{ clientId: string, appId: string } | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Columns Configuration with modern gradients
    const columns = [
        {
            id: 'preparation',
            title: 'Brouillon',
            statuses: [ApplicationStatus.DRAFT, ApplicationStatus.DOCS_PENDING],
            gradient: 'from-slate-400 to-slate-500',
            bgGradient: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900',
            icon: '📝'
        },
        {
            id: 'waiting',
            title: 'En Attente RDV',
            statuses: [ApplicationStatus.WAITING_APPOINTMENT],
            gradient: 'from-yellow-400 to-amber-500',
            bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
            icon: '⏳'
        },
        {
            id: 'scheduled',
            title: 'RDV Fixé',
            statuses: [ApplicationStatus.APPOINTMENT_SET],
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
            icon: '📅'
        },
        {
            id: 'processing',
            title: 'En Traitement',
            statuses: [ApplicationStatus.SUBMITTED, ApplicationStatus.PROCESSING],
            gradient: 'from-purple-500 to-pink-600',
            bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
            icon: '⚙️'
        },
        {
            id: 'completed',
            title: 'Terminé / Prêt',
            statuses: [ApplicationStatus.READY_PICKUP, ApplicationStatus.COMPLETED],
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
            icon: '✅'
        }
    ];

    const getColumnClients = (statuses: ApplicationStatus[]) => {
        return clients.flatMap(client =>
            client.applications
                .filter(app => statuses.includes(app.status) && !app.archived)
                .map(app => ({ client, app }))
        );
    };

    const handleDragStart = (e: React.DragEvent, clientId: string, appId: string) => {
        setDraggedItem({ clientId, appId });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetStatuses: ApplicationStatus[]) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (draggedItem && targetStatuses.length > 0) {
            const client = clients.find(c => c.id === draggedItem.clientId);
            const app = client?.applications.find(a => a.id === draggedItem.appId);

            if (!app) {
                setDraggedItem(null);
                return;
            }

            const newStatus = targetStatuses[0];

            // Validation: Cannot move to RDV Fixé or later stages without an appointment
            const requiresAppointment = [
                ApplicationStatus.APPOINTMENT_SET,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.PROCESSING,
                ApplicationStatus.READY_PICKUP,
                ApplicationStatus.COMPLETED
            ];

            if (requiresAppointment.includes(newStatus) && !app.appointmentDate) {
                alert(`❌ Action refusée !\n\nVous ne pouvez pas déplacer ce dossier vers "${newStatus}" sans avoir fixé un rendez-vous.\n\n✅ Veuillez d'abord fixer un rendez-vous pour ce client.`);
                setDraggedItem(null);
                return;
            }

            onUpdateStatus(draggedItem.clientId, draggedItem.appId, newStatus);
            setDraggedItem(null);
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        return (amount || 0).toLocaleString('fr-TN', { style: 'currency', currency: 'TND' });
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
            {/* Header */}
            <div className="mb-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <LayoutIcon className="w-7 h-7 text-white" />
                            </div>
                            Pipeline des Dossiers
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm ml-15">
                            Glissez-déposez les cartes pour faire avancer les dossiers
                        </p>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-grow flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                {columns.map((col, colIndex) => {
                    const items = getColumnClients(col.statuses);
                    const totalValue = items.reduce((sum, item) => sum + (item.app.price || 0), 0);
                    const isDragOver = dragOverColumn === col.id;

                    return (
                        <div
                            key={col.id}
                            className={`
                                flex-shrink-0 w-[85vw] md:w-80 flex flex-col rounded-2xl overflow-hidden
                                transition-all duration-300 snap-center
                                ${isDragOver ? 'ring-4 ring-blue-500 scale-[1.02]' : ''}
                                animate-slide-up
                            `}
                            style={{ animationDelay: `${colIndex * 100}ms` }}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.statuses)}
                        >
                            {/* Column Header */}
                            <div className={`bg-gradient-to-r ${col.gradient} p-4 relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{col.icon}</span>
                                            <h3 className="font-bold text-white text-lg">{col.title}</h3>
                                        </div>
                                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white font-bold shadow-lg">
                                            {items.length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className={`flex-grow bg-gradient-to-br ${col.bgGradient} p-3 overflow-y-auto space-y-3 scrollbar-thin`}>
                                {items.length === 0 && (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <span className="text-3xl opacity-50">{col.icon}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Aucun dossier</p>
                                        </div>
                                    </div>
                                )}

                                {items.map(({ client, app }, index) => (
                                    <div
                                        key={`${client.id}-${app.id}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, client.id, app.id)}
                                        onClick={() => onSelectClient(client.id)}
                                        className="card-hover p-4 rounded-xl cursor-grab active:cursor-grabbing group animate-scale-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="avatar-gradient flex-shrink-0">
                                                <img src={client.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {client.fullName}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
                                                    {app.destination}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                                    {app.visaType}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg font-medium">
                                                {app.center || 'Ambassade'}
                                            </div>
                                            {app.appointmentDate && (
                                                <div className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg flex items-center gap-1">
                                                    📅 {app.appointmentDate}
                                                </div>
                                            )}
                                        </div>

                                        {/* Family Badge */}
                                        {app.members && app.members.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    👥 + {app.members.length} personne(s)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanView;
