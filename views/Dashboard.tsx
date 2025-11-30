
import React from 'react';
import { ApplicationStatus, Client } from '../types';
import { FileTextIcon, CalendarIcon, CheckCircleIcon, SparklesIcon } from '../components/Icons';

interface DashboardProps {
    clients: Client[];
    onSelectClient: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, onSelectClient }) => {
    // Flatten all active applications from all clients
    const activeApplications = clients.flatMap(client =>
        client.applications
            .filter(app => !app.archived) // Only non-archived apps
            .map(app => ({
                ...app,
                clientName: client.fullName,
                clientAvatar: client.avatarUrl,
                clientId: client.id,
                clientPhone: client.phone
            }))
    ).sort((a, b) => {
        // Sort by urgency/status approximately
        const statusPriority = {
            [ApplicationStatus.DRAFT]: 10,
            [ApplicationStatus.DOCS_PENDING]: 11,
            [ApplicationStatus.WAITING_APPOINTMENT]: 20,
            [ApplicationStatus.APPOINTMENT_SET]: 30,
            [ApplicationStatus.SUBMITTED]: 40,
            [ApplicationStatus.PROCESSING]: 41,
            [ApplicationStatus.READY_PICKUP]: 50,
            [ApplicationStatus.COMPLETED]: 60,
            [ApplicationStatus.REFUSED]: 70,
        };
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
    });

    const getStatusColorClass = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPOINTMENT_SET:
                return 'bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border-blue-300 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800';
            case ApplicationStatus.WAITING_APPOINTMENT:
                return 'bg-gradient-to-br from-yellow-50 to-amber-100/50 hover:from-yellow-100 hover:to-amber-200/50 border-yellow-300 dark:from-yellow-950/30 dark:to-yellow-900/20 dark:border-yellow-800';
            case ApplicationStatus.PROCESSING:
            case ApplicationStatus.SUBMITTED:
                return 'bg-gradient-to-br from-indigo-50 to-purple-100/50 hover:from-indigo-100 hover:to-purple-200/50 border-indigo-300 dark:from-indigo-950/30 dark:to-purple-900/20 dark:border-indigo-800';
            case ApplicationStatus.READY_PICKUP:
            case ApplicationStatus.COMPLETED:
                return 'bg-gradient-to-br from-green-50 to-emerald-100/50 hover:from-green-100 hover:to-emerald-200/50 border-green-300 dark:from-green-950/30 dark:to-emerald-900/20 dark:border-green-800';
            case ApplicationStatus.REFUSED:
                return 'bg-gradient-to-br from-red-50 to-rose-100/50 hover:from-red-100 hover:to-rose-200/50 border-red-300 dark:from-red-950/30 dark:to-rose-900/20 dark:border-red-800';
            case ApplicationStatus.DRAFT:
            case ApplicationStatus.DOCS_PENDING:
            default:
                return 'bg-gradient-to-br from-slate-50 to-gray-100/50 hover:from-slate-100 hover:to-gray-200/50 border-slate-300 dark:from-slate-900/30 dark:to-slate-800/20 dark:border-slate-700';
        }
    };

    const getStatusBadgeColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPOINTMENT_SET: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30';
            case ApplicationStatus.WAITING_APPOINTMENT: return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/30';
            case ApplicationStatus.PROCESSING: return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30';
            case ApplicationStatus.SUBMITTED: return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30';
            case ApplicationStatus.READY_PICKUP: return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30';
            case ApplicationStatus.COMPLETED: return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30';
            case ApplicationStatus.REFUSED: return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30';
            default: return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg shadow-slate-500/30';
        }
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

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        Dossiers en cours
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Gérez et suivez tous vos dossiers actifs
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 animate-scale-in">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="font-bold text-lg">{activeApplications.length}</span>
                        <span className="text-sm font-medium opacity-90">dossiers actifs</span>
                    </div>
                </div>
            </div>

            {/* Alert Banner for Ready to Pickup */}
            {activeApplications.filter(a => a.status === ApplicationStatus.READY_PICKUP).length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-green-500/10 animate-slide-up">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce-subtle">
                        <CheckCircleIcon className="text-white w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">Passeports prêts au retrait !</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                            Vous avez <span className="font-bold">{activeApplications.filter(a => a.status === ApplicationStatus.READY_PICKUP).length}</span> dossier(s) prêts à être récupérés.
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {activeApplications.map((app, index) => (
                    <div
                        key={`${app.clientId}-${app.id}`}
                        onClick={() => onSelectClient(app.clientId)}
                        className={`card-hover p-5 rounded-2xl border-l-4 ${getStatusColorClass(app.status)} animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="avatar-gradient flex-shrink-0">
                                    <img src={app.clientAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">{app.clientName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{app.clientPhone}</p>
                                </div>
                            </div>
                            <span className={`badge ${getStatusBadgeColor(app.status)} flex-shrink-0 ml-2`}>
                                {app.status}
                            </span>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{app.destination}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{app.visaType}</p>
                                </div>
                                {app.appointmentDate && (
                                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-xs">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        {app.appointmentDate}
                                    </div>
                                )}
                            </div>
                            {app.tags && app.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {app.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className={`text-xs px-2 py-1 rounded-md font-medium shadow-sm ${getTagColor(tag)}`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {activeApplications.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SparklesIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun dossier actif</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Créez un nouveau dossier pour commencer</p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Client</th>
                                <th className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dossier</th>
                                <th className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Statut</th>
                                <th className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tags</th>
                                <th className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Infos Clés</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {activeApplications.map((app, index) => (
                                <tr
                                    key={`${app.clientId}-${app.id}`}
                                    className={`transition-all duration-300 cursor-pointer border-l-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${getStatusColorClass(app.status)} animate-slide-up`}
                                    onClick={() => onSelectClient(app.clientId)}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar-gradient flex-shrink-0">
                                                <img src={app.clientAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{app.clientName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{app.clientPhone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{app.destination}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.visaType} • {app.center || 'Ambassade'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`badge ${getStatusBadgeColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {app.tags && app.tags.length > 0 ? (
                                                app.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-xs px-2.5 py-1 rounded-md font-medium shadow-sm ${getTagColor(tag)}`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {app.appointmentDate ? (
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg w-fit">
                                                <CalendarIcon className="w-4 h-4" />
                                                {app.appointmentDate}
                                            </div>
                                        ) : app.submissionDate ? (
                                            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-lg w-fit">
                                                <FileTextIcon className="w-4 h-4" />
                                                Dépôt: {app.submissionDate}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                                        )}
                                        {app.members && app.members.length > 0 && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                + {app.members.length} pers.
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {activeApplications.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SparklesIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun dossier actif pour le moment</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Créez un nouveau dossier pour commencer</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
