
import React, { useState } from 'react';
import { LetterTemplate } from '../types';
import { FileSignatureIcon, PlusIcon, EditIcon, TrashIcon, SaveIcon, CopyIcon } from '../components/Icons';

interface TemplatesViewProps {
    templates: LetterTemplate[];
    onAddTemplate: (tpl: LetterTemplate) => void;
    onUpdateTemplate: (id: string, tpl: Partial<LetterTemplate>) => void;
    onDeleteTemplate: (id: string) => void;
}

const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(templates[0] || null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ name: '', content: '' });

    const handleNew = () => {
        setSelectedTemplate(null);
        setFormData({ name: '', content: '' });
        setIsEditing(true);
    };

    const handleEdit = (tpl: LetterTemplate) => {
        setSelectedTemplate(tpl);
        setFormData({ name: tpl.name, content: tpl.content });
        setIsEditing(true);
    };

    const handleSelect = (tpl: LetterTemplate) => {
        setSelectedTemplate(tpl);
        setIsEditing(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedTemplate && selectedTemplate.id) {
            // Update existing
            onUpdateTemplate(selectedTemplate.id, formData);
            setSelectedTemplate({ ...selectedTemplate, ...formData });
        } else {
            // Create new
            const newTpl = {
                id: `tpl_${Date.now()}`,
                name: formData.name,
                content: formData.content
            };
            onAddTemplate(newTpl);
            setSelectedTemplate(newTpl);
        }
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Supprimer ce modèle ?')) {
            onDeleteTemplate(id);
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setIsEditing(false);
            }
        }
    };

    const insertVariable = (variable: string) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + variable
        }));
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileSignatureIcon className="w-8 h-8 text-blue-600" />
                    Modèles de Lettres
                </h1>
                {!isEditing && (
                    <button 
                        onClick={handleNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Nouveau Modèle
                    </button>
                )}
            </div>

            <div className="flex-grow flex overflow-hidden gap-6">
                
                {/* Sidebar List */}
                <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vos modèles</h3>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {templates.map(tpl => (
                            <button
                                key={tpl.id}
                                onClick={() => handleSelect(tpl)}
                                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition flex justify-between items-center group ${
                                    selectedTemplate?.id === tpl.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="truncate">{tpl.name}</span>
                                <div className={`flex gap-1 ${selectedTemplate?.id === tpl.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <span onClick={(e) => { e.stopPropagation(); handleEdit(tpl); }} className="p-1 hover:text-blue-600 cursor-pointer"><EditIcon className="w-3 h-3" /></span>
                                    <span onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }} className="p-1 hover:text-red-500 cursor-pointer"><TrashIcon className="w-3 h-3" /></span>
                                </div>
                            </button>
                        ))}
                         {templates.length === 0 && (
                            <p className="p-4 text-center text-xs text-slate-400 italic">Aucun modèle.</p>
                        )}
                    </div>
                </div>

                {/* Editor / Preview Area */}
                <div className="flex-grow bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col relative">
                    {isEditing ? (
                        <form onSubmit={handleSave} className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                <input 
                                    type="text" 
                                    required
                                    className="text-lg font-bold bg-transparent border-none focus:ring-0 outline-none text-slate-800 dark:text-white w-full placeholder-slate-400"
                                    placeholder="Nom du modèle..."
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 px-3 py-1">Annuler</button>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded flex items-center gap-2 text-sm font-medium">
                                        <SaveIcon className="w-4 h-4" />
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>
                            
                            {/* Toolbar Variables */}
                            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-2">
                                <span className="text-xs text-slate-400 py-1 px-2">Variables :</span>
                                {['{{nom}}', '{{passeport}}', '{{telephone}}', '{{email}}', '{{adresse}}', '{{destination}}', '{{type_visa}}'].map(v => (
                                    <button 
                                        key={v}
                                        type="button"
                                        onClick={() => insertVariable(v)}
                                        className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-blue-600 dark:text-blue-400 hover:border-blue-400 transition"
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                className="flex-grow p-6 resize-none focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-sm leading-relaxed"
                                placeholder="Rédigez votre modèle ici..."
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                            ></textarea>
                        </form>
                    ) : selectedTemplate ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedTemplate.name}</h2>
                                <button onClick={() => handleEdit(selectedTemplate)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded text-sm font-medium transition">
                                    Modifier
                                </button>
                            </div>
                            <div className="flex-grow p-8 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800">
                                {selectedTemplate.content}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-slate-400">
                            <p>Sélectionnez un modèle pour le visualiser.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatesView;
