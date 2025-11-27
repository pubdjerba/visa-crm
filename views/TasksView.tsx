
import React, { useState } from 'react';
import { TodoTask } from '../types';
import { ClipboardListIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '../components/Icons';

interface TasksViewProps {
    tasks: TodoTask[];
    onAddTask: (text: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    }).sort((a, b) => {
        if (a.completed === b.completed) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.completed ? 1 : -1;
    });

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <ClipboardListIcon className="w-8 h-8 text-blue-600" />
                Gestion des Tâches
            </h1>

            <div className="max-w-3xl w-full mx-auto flex flex-col flex-grow overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                
                {/* Input Area */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Nouvelle tâche à faire (ex: Acheter toner, Rappeler TLS)..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold shadow-sm transition active:scale-95 flex items-center justify-center">
                            <PlusIcon className="w-6 h-6" />
                        </button>
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
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-blue-500'}`}
                            >
                                {task.completed && <CheckCircleIcon className="w-4 h-4" />}
                            </button>
                            
                            <span className={`flex-grow font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                {task.text}
                            </span>
                            
                            <span className="text-xs text-slate-400">
                                {new Date(task.createdAt).toLocaleDateString()}
                            </span>

                            <button 
                                onClick={() => onDeleteTask(task.id)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition opacity-0 group-hover:opacity-100"
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
