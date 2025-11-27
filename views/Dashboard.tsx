
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
                return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
            case ApplicationStatus.WAITING_APPOINTMENT:
                return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
            case ApplicationStatus.PROCESSING:
            case ApplicationStatus.SUBMITTED:
                return 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200';
            case ApplicationStatus.READY_PICKUP:
            case ApplicationStatus.COMPLETED:
                return 'bg-green-50 hover:bg-green-100 border-green-200';
            case ApplicationStatus.REFUSED:
                return 'bg-red-50 hover:bg-red-100 border-red-200';
            case ApplicationStatus.DRAFT:
            case ApplicationStatus.DOCS_PENDING:
            default:
                return 'bg-slate-50 hover:bg-slate-100 border-slate-200';
        }
    };

    const getStatusBadgeColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPOINTMENT_SET: return 'bg-blue-200 text-blue-800';
            case ApplicationStatus.WAITING_APPOINTMENT: return 'bg-yellow-200 text-yellow-800';
            case ApplicationStatus.PROCESSING: return 'bg-indigo-200 text-indigo-800';
            case ApplicationStatus.SUBMITTED: return 'bg-purple-200 text-purple-800';
            case ApplicationStatus.READY_PICKUP: return 'bg-green-200 text-green-800';
            case ApplicationStatus.COMPLETED: return 'bg-emerald-200 text-emerald-800';
            case ApplicationStatus.REFUSED: return 'bg-red-200 text-red-800';
            default: return 'bg-slate-200 text-slate-700';
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Dossiers en cours de traitement</h1>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {activeApplications.length} dossiers actifs
                </span>
            </div>

            {/* Alert Banner for Ready to Pickup */}
            {activeApplications.filter(a => a.status === ApplicationStatus.READY_PICKUP).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircleIcon className="text-green-600 w-6 h-6" />
                    <div>
                        <h3 className="font-bold text-green-800">Passeports prêts au retrait !</h3>
                        <p className="text-sm text-green-700">
                            Vous avez {activeApplications.filter(a => a.status === ApplicationStatus.READY_PICKUP).length} dossier(s) prêts.
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {activeApplications.map(app => (
                    <div
                        key={`${app.clientId}-${app.id}`}
                        onClick={() => onSelectClient(app.clientId)}
                        className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${getStatusColorClass(app.status)}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <img src={app.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                <div>
                                    <p className="font-bold text-slate-800">{app.clientName}</p>
                                    <p className="text-xs text-slate-500">{app.clientPhone}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeColor(app.status)}`}>
                                {app.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                            <div>
                                <p className="font-bold text-slate-700">{app.destination}</p>
                                <p className="text-xs text-slate-500">{app.visaType}</p>
                            </div>
                            {app.appointmentDate && (
                                <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded text-xs">
                                    <CalendarIcon className="w-3 h-3" />
                                    {app.appointmentDate}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {activeApplications.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                        Aucun dossier actif.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dossier</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Infos Clés</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activeApplications.map(app => (
                            <tr
                                key={`${app.clientId}-${app.id}`}
                                className={`transition cursor-pointer border-l-4 ${getStatusColorClass(app.status)}`}
                                onClick={() => onSelectClient(app.clientId)}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={app.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                        <div>
                                            <p className="font-medium text-slate-800">{app.clientName}</p>
                                            <p className="text-xs text-slate-500 font-mono">{app.clientPhone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg text-slate-700">{app.destination}</span>
                                        <span className="text-xs text-slate-500">{app.visaType} - {app.center || 'Ambassade'}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusBadgeColor(app.status)}`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">
                                    {app.appointmentDate ? (
                                        <div className="flex items-center gap-2 text-blue-700 font-bold bg-white/50 px-2 py-1 rounded">
                                            <CalendarIcon className="w-4 h-4" />
                                            {app.appointmentDate}
                                        </div>
                                    ) : app.submissionDate ? (
                                        <div className="flex items-center gap-2 text-purple-700 font-bold bg-white/50 px-2 py-1 rounded">
                                            <FileTextIcon className="w-4 h-4" />
                                            Dépôt: {app.submissionDate}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">-</span>
                                    )}
                                    {app.members && app.members.length > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            + {app.members.length} pers.
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {activeApplications.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">
                                    Aucun dossier actif pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
