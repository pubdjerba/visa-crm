
import React, { useState } from 'react';
import { TodoTask } from '../types';
import { ClipboardListIcon, PlusIcon, TrashIcon, CheckCircleIcon, CalendarIcon } from '../components/Icons';

interface TasksViewProps {
    tasks: TodoTask[];
    onAddTask: (text: string, dueDate?: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask(newTaskText, newTaskDate || undefined);
            setNewTaskText('');
            setNewTaskDate('');
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    }).sort((a, b) => {
        // Sort by completion status first
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        // Then by due date (tasks with due dates first, sorted by date)
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        // Finally by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <ClipboardListIcon className="w-8 h-8 text-blue-600" />
                Gestion des Tâches
            </h1>

            <div className="max-w-3xl w-full mx-auto flex flex-col flex-grow overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">

                {/* Input Area */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Nouvelle tâche à faire (ex: Acheter toner, Rappeler TLS)..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-slate-400" />
                                <input
                                    type="date"
                                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                    value={newTaskDate}
                                    onChange={(e) => setNewTaskDate(e.target.value)}
                                />
                                {newTaskDate && (
                                    <button
                                        type="button"
                                        onClick={() => setNewTaskDate('')}
                                        className="text-xs text-slate-500 hover:text-red-500 transition"
                                    >
                                        Effacer
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold shadow-sm transition active:scale-95 flex items-center justify-center">
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filters */}
                <div className="flex border-b border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-3 text-sm font-medium transition ${filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Toutes ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`flex-1 py-3 text-sm font-medium transition ${filter === 'active' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        À faire ({tasks.filter(t => !t.completed).length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`flex-1 py-3 text-sm font-medium transition ${filter === 'completed' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Terminées ({tasks.filter(t => t.completed).length})
                    </button>
                </div>

                {/* Task List */}
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {filteredTasks.map(task => (
                        <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition ${task.completed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-sm'}`}>
                            <button
                                onClick={() => onToggleTask(task.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-blue-500'}`}
                            >
                                {task.completed && <CheckCircleIcon className="w-4 h-4" />}
                            </button>

                            <div className="flex-grow min-w-0">
                                <span className={`font-medium block ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                    {task.text}
                                </span>
                                {task.dueDate && (
                                    <div className={`flex items-center gap-1 text-xs mt-1 ${task.completed
                                            ? 'text-slate-400'
                                            : isOverdue(task.dueDate)
                                                ? 'text-red-600 dark:text-red-400 font-medium'
                                                : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>
                                            {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                            {!task.completed && isOverdue(task.dueDate) && ' (En retard)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <span className="text-xs text-slate-400 flex-shrink-0">
                                {new Date(task.createdAt).toLocaleDateString()}
                            </span>

                            <button
                                onClick={() => onDeleteTask(task.id)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Aucune tâche trouvée.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TasksView;
