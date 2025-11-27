
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

    // Columns Configuration
    const columns = [
        {
            id: 'preparation',
            title: 'Brouillon',
            statuses: [ApplicationStatus.DRAFT, ApplicationStatus.DOCS_PENDING],
            color: 'border-slate-300 bg-slate-50'
        },
        {
            id: 'waiting',
            title: 'En Attente RDV',
            statuses: [ApplicationStatus.WAITING_APPOINTMENT],
            color: 'border-blue-300 bg-blue-50'
        },
        {
            id: 'scheduled',
            title: 'RDV Fixé',
            statuses: [ApplicationStatus.APPOINTMENT_SET],
            color: 'border-indigo-300 bg-indigo-50'
        },
        {
            id: 'processing',
            title: 'En Traitement',
            statuses: [ApplicationStatus.SUBMITTED, ApplicationStatus.PROCESSING],
            color: 'border-orange-300 bg-orange-50'
        },
        {
            id: 'completed',
            title: 'Terminé / Prêt',
            statuses: [ApplicationStatus.READY_PICKUP, ApplicationStatus.COMPLETED],
            color: 'border-green-300 bg-green-50'
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetStatuses: ApplicationStatus[]) => {
        e.preventDefault();
        if (draggedItem && targetStatuses.length > 0) {
            // Validation: Cannot move to Processing or Completed without an appointment
            const restrictedStatuses = [
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.PROCESSING,
                ApplicationStatus.READY_PICKUP,
                ApplicationStatus.COMPLETED
            ];

            const isRestrictedTarget = targetStatuses.some(s => restrictedStatuses.includes(s));

            if (isRestrictedTarget) {
                const client = clients.find(c => c.id === draggedItem.clientId);
                const app = client?.applications.find(a => a.id === draggedItem.appId);

                if (app && !app.appointmentDate) {
                    alert("Action refusée : Le client doit avoir un rendez-vous fixé avant de passer à cette étape.");
                    setDraggedItem(null);
                    return;
                }
            }

            // Default to the first status of the target column (usually the main one)
            // Ideally we logic this better, but for Kanban move, taking the primary status is standard
            const newStatus = targetStatuses[0];
            onUpdateStatus(draggedItem.clientId, draggedItem.appId, newStatus);
            setDraggedItem(null);
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        return (amount || 0).toLocaleString('fr-TN', { style: 'currency', currency: 'TND' });
    };

    // Unique Color Generation
    const CLIENT_COLORS = [
        'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600', // Default (White/Slate)
        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800',
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
        'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
        'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
        'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
        'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800',
        'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
        'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    ];

    const getClientColor = (clientId: string) => {
        let hash = 0;
        for (let i = 0; i < clientId.length; i++) {
            hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % CLIENT_COLORS.length;
        return CLIENT_COLORS[index];
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <LayoutIcon className="w-8 h-8 text-blue-600" />
                        Pipeline des Dossiers
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Glissez-déposez les cartes pour faire avancer les dossiers.</p>
                </div>
            </div>

            <div className="flex-grow flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {columns.map(col => {
                    const items = getColumnClients(col.statuses);
                    const totalValue = items.reduce((sum, item) => sum + (item.app.price || 0), 0);

                    return (
                        <div
                            key={col.id}
                            className={`flex-shrink-0 w-[85vw] md:w-80 flex flex-col rounded-xl bg-slate-200 dark:bg-slate-800 border-t-4 ${col.color.split(' ')[0]} snap-center`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.statuses)}
                        >
                            {/* Column Header */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-t-lg border-b border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{col.title}</h3>
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-bold">
                                        {items.length}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                    Total: {formatCurrency(totalValue)}
                                </p>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-grow p-2 overflow-y-auto space-y-3">
                                {items.map(({ client, app }) => (
                                    <div
                                        key={`${client.id}-${app.id}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, client.id, app.id)}
                                        onClick={() => onSelectClient(client.id)}
                                        className={`${getClientColor(client.id)} p-3 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition group`}
                                    >
                                        <div className="flex items-start gap-3 mb-2">
                                            <img src={client.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-100" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{client.fullName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.destination} ({app.visaType})</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-2">
                                            <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">
                                                {app.center || 'Ambassade'}
                                            </div>
                                            {app.appointmentDate && (
                                                <div className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                                    {app.appointmentDate}
                                                </div>
                                            )}
                                        </div>

                                        {/* Family Badge */}
                                        {app.members && app.members.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-600 text-[10px] text-slate-500 flex gap-1">
                                                <span>+ {app.members.length} personne(s)</span>
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
