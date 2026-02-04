import React, { useState } from 'react';
import { TodoTask, Client } from '../types';
import { ClipboardListIcon, PlusIcon, TrashIcon, CheckCircleIcon, CalendarIcon, UsersIcon, TagIcon, FlagIcon, ViewGridIcon, ViewListIcon } from '../components/Icons';

interface TasksViewProps {
    tasks: TodoTask[];
    onAddTask: (text: string, dueDate?: string, priority?: 'high' | 'medium' | 'low', category?: 'call' | 'email' | 'paperwork' | 'meeting' | 'other', clientId?: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    clients: Client[];
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, clients }) => {
    // Input State
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [newTaskCategory, setNewTaskCategory] = useState<'call' | 'email' | 'paperwork' | 'meeting' | 'other'>('other');
    const [newTaskClient, setNewTaskClient] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            // Only pass optional fields if they have valid values
            const clientIdValue = newTaskClient && newTaskClient.trim() !== '' ? newTaskClient : undefined;
            const dueDateValue = newTaskDate && newTaskDate.trim() !== '' ? newTaskDate : undefined;

            onAddTask(
                newTaskText,
                dueDateValue,
                newTaskPriority,
                newTaskCategory,
                clientIdValue
            );
            // Reset safe defaults
            setNewTaskText('');
            setNewTaskDate('');
            setNewTaskPriority('medium');
            setNewTaskCategory('other');
            setNewTaskClient('');
            setIsModalOpen(false); // Close modal on success
        }
    };


    const getPriorityCardColor = (p?: string, completed?: boolean) => {
        if (completed) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 grayscale';
        switch (p) {
            case 'high': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
            case 'medium': return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50';
            case 'low': return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50';
            default: return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    const getCategoryIcon = (c?: string) => {
        switch (c) {
            case 'call': return '📞';
            case 'email': return '📧';
            case 'paperwork': return '📄';
            case 'meeting': return '📅';
            default: return '📌';
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    }).filter(t => {
        if (clientFilter === 'all') return true;
        return t.clientId === clientFilter;
    }).sort((a, b) => {
        // High priority first
        const pScore = { high: 3, medium: 2, low: 1 };
        const scoreA = pScore[a.priority || 'medium'] || 0;
        const scoreB = pScore[b.priority || 'medium'] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return new Date(dueDate) < startOfToday;
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardListIcon className="w-8 h-8 text-blue-600" />
                    Gestion des Tâches
                </h1>

                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition active:scale-95 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouvelle Tâche
                    </button>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded flex items-center gap-2 text-sm font-medium transition ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ViewListIcon className="w-5 h-5" /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded flex items-center gap-2 text-sm font-medium transition ${viewMode === 'board' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ViewGridIcon className="w-5 h-5" /> Tableau
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA - Full Width */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">

                {/* Filters */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                        {['all', 'active', 'completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap capitalize ${filter === f ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {f === 'all' ? 'Toutes' : f === 'active' ? 'À faire' : 'Terminées'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4 h-8">
                        <UsersIcon className="w-4 h-4 text-slate-400" />
                        <select
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 font-medium outline-none"
                        >
                            <option value="all">Tous les clients</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.fullName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-grow overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    {viewMode === 'list' ? (
                        <div className="space-y-3">
                            {filteredTasks.map(task => {
                                const linkedClient = clients.find(c => c.id === task.clientId);
                                return (
                                    <div key={task.id} className={`group flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border shadow-sm hover:shadow-md transition ${getPriorityCardColor(task.priority, task.completed)}`}>
                                        <div className="flex items-start gap-3 flex-1">
                                            <button
                                                onClick={() => onToggleTask(task.id)}
                                                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
                                            >
                                                {task.completed && <CheckCircleIcon className="w-4 h-4" />}
                                            </button>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`text-base font-semibold ${task.completed ? 'line-through decoration-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                        {task.text}
                                                    </span>
                                                    <span className="text-xs bg-slate-100/50 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                        {getCategoryIcon(task.category)} {task.category || 'Autre'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                                    {task.dueDate && (
                                                        <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) && !task.completed ? 'text-red-600 font-bold' : ''}`}>
                                                            <CalendarIcon className="w-3 h-3" />
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                            {isOverdue(task.dueDate) && !task.completed && ' (Retard)'}
                                                        </span>
                                                    )}
                                                    {linkedClient && (
                                                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                            <UsersIcon className="w-3 h-3" />
                                                            {linkedClient.fullName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onDeleteTask(task.id)}
                                            className="text-slate-300 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* BOARD VIEW (Simple 2 Columns) */
                        <div className="flex flex-col md:flex-row gap-4 h-full">
                            {/* TO DO COLUMN */}
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    À Faire ({tasks.filter(t => !t.completed).length})
                                </h3>
                                <div className="flex-grow overflow-y-auto space-y-3">
                                    {tasks.filter(t => !t.completed).map(task => (
                                        <div key={task.id} className={`p-3 rounded-lg shadow-sm border transition ${getPriorityCardColor(task.priority, false)}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{task.text}</p>
                                                </div>
                                                <button onClick={() => onToggleTask(task.id)} className="text-slate-400 hover:text-green-500 ml-2">
                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white dark:bg-slate-800"></div>
                                                </button>
                                            </div>
                                            {task.clientId && (
                                                <div className="text-[10px] text-blue-600 mb-1">
                                                    👤 {clients.find(c => c.id === task.clientId)?.fullName}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-xs text-slate-400">
                                                <span>{getCategoryIcon(task.category)}</span>
                                                {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DONE COLUMN */}
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Terminées ({tasks.filter(t => t.completed).length})
                                </h3>
                                <div className="flex-grow overflow-y-auto space-y-3">
                                    {tasks.filter(t => t.completed).map(task => (
                                        <div key={task.id} className="bg-slate-200 dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700 opacity-60 grayscale transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <button onClick={() => onToggleTask(task.id)} className="text-green-500">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-white line-through decoration-slate-400">{task.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tasks.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <ClipboardListIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium">Aucune tâche pour le moment</p>
                            <p className="text-sm">Cliquez sur "Nouvelle Tâche" pour commencer.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL OVERLAY */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <PlusIcon className="w-6 h-6 text-blue-600" />
                                Nouvelle Tâche
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Titre</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="Ex: Appeler le client pour confirmation..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date limite</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                                            value={newTaskDate}
                                            onChange={(e) => setNewTaskDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priorité</label>
                                        <select
                                            value={newTaskPriority}
                                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                                        >
                                            <option value="high">🔴 Haute</option>
                                            <option value="medium">🟠 Moyenne</option>
                                            <option value="low">🔵 Basse</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'call', label: 'Appel', icon: '📞' },
                                            { id: 'email', label: 'Email', icon: '📧' },
                                            { id: 'paperwork', label: 'Admin', icon: '📄' },
                                            { id: 'meeting', label: 'RDV', icon: '📅' },
                                            { id: 'other', label: 'Autre', icon: '📌' },
                                        ].map(cat => (
                                            <button
                                                type="button"
                                                key={cat.id}
                                                onClick={() => setNewTaskCategory(cat.id as any)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition ${newTaskCategory === cat.id ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{cat.icon}</span> {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lier à un client (Optionnel)</label>
                                    <select
                                        value={newTaskClient}
                                        onChange={(e) => setNewTaskClient(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                                    >
                                        <option value="">-- Aucun client lié --</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.fullName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 rounded-lg font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        Valider
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TasksView;
