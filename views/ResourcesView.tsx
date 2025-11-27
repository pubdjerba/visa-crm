
import React, { useState } from 'react';
import { ExternalResource } from '../types';
import { GlobeIcon, LinkIcon, PhoneIcon, SearchIcon, PlusIcon, TrashIcon, EditIcon } from '../components/Icons';

interface ResourcesViewProps {
    resources: ExternalResource[];
    onAddResource: (res: ExternalResource) => void;
    onUpdateResource: (id: string, res: Partial<ExternalResource>) => void;
    onDeleteResource: (id: string) => void;
}

const ResourcesView: React.FC<ResourcesViewProps> = ({ resources, onAddResource, onUpdateResource, onDeleteResource }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tous');
    const [showModal, setShowModal] = useState(false);
    const [editingResource, setEditingResource] = useState<ExternalResource | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        website: '',
        phone: '',
        category: 'Rendez-vous',
        description: ''
    });

    const categories = ['Rendez-vous', 'Formulaire', 'Ambassade', 'Administratif', 'Autre'];
    const filterCategories = ['Tous', ...categories];

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Tous' || r.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const openAddModal = () => {
        setEditingResource(null);
        setFormData({ title: '', website: '', phone: '', category: 'Rendez-vous', description: '' });
        setShowModal(true);
    };

    const openEditModal = (res: ExternalResource) => {
        setEditingResource(res);
        setFormData({
            title: res.title,
            website: res.website || '',
            phone: res.phone || '',
            category: res.category,
            description: res.description || ''
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingResource) {
            onUpdateResource(editingResource.id, formData);
        } else {
            onAddResource({
                id: `res_${Date.now()}`,
                ...formData
            });
        }
        
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Voulez-vous vraiment supprimer cet établissement/lien ?')) {
            onDeleteResource(id);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <GlobeIcon className="w-8 h-8 text-blue-600" />
                        Liens & Contacts Utiles
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Centralisez les numéros de téléphone et sites web importants.
                    </p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Ajouter Établissement</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                 {/* Category Tabs */}
                 <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 flex-grow scrollbar-hide">
                    {filterCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                                activeCategory === cat 
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-72">
                     <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                     <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-6">
                {filteredResources.map(res => {
                    const hasPhone = !!res.phone;
                    const hasWeb = !!res.website;
                    
                    return (
                        <div key={res.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition group relative flex flex-col h-full">
                            
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                        res.category === 'Rendez-vous' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' :
                                        res.category === 'Ambassade' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                    }`}>
                                    {res.category}
                                </span>
                                
                                {/* Edit/Delete Actions */}
                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition">
                                    <button 
                                        onClick={() => openEditModal(res)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                                        title="Modifier"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(res.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                                {res.title}
                            </h3>

                            {/* Description */}
                            <div className="flex-grow mb-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                                    {res.description || 'Aucune description disponible.'}
                                </p>
                            </div>

                            {/* Contact / Action Area */}
                            <div className="mt-auto space-y-3">
                                {hasPhone && (
                                    <div className="flex items-center gap-3">
                                        <a 
                                            href={`tel:${res.phone}`}
                                            className="flex-shrink-0 w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                                            title="Appeler"
                                        >
                                            <PhoneIcon className="w-5 h-5" />
                                        </a>
                                        <div className="flex-grow">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">Téléphone</p>
                                            <a href={`tel:${res.phone}`} className="text-lg font-bold text-slate-800 dark:text-white hover:text-green-600 transition font-mono">
                                                {res.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                {hasWeb && (
                                    <div className="flex items-center gap-3">
                                         <a 
                                            href={res.website}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                            title="Visiter le site"
                                        >
                                            <LinkIcon className="w-5 h-5" />
                                        </a>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">Site Web</p>
                                            <a 
                                                href={res.website} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                                            >
                                                {res.website?.replace('https://', '').replace('www.', '').split('/')[0]}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {!hasPhone && !hasWeb && (
                                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-slate-400 text-sm italic">
                                        Aucun contact renseigné
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredResources.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <GlobeIcon className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p>Aucun établissement trouvé.</p>
                        <button onClick={openAddModal} className="mt-2 text-blue-600 hover:underline">Ajouter un nouveau lien</button>
                    </div>
                )}
            </div>

            {/* Modal (Add/Edit) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                                {editingResource ? 'Modifier Établissement' : 'Ajouter Établissement'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nom de l'établissement</label>
                                <input required type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Ambassade de France" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Catégorie</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({...formData, category: c})}
                                            className={`text-xs py-2 px-1 rounded border transition ${
                                                formData.category === c
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Numéro de Téléphone</label>
                                    <div className="relative">
                                        <input type="text" className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm transition" 
                                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+216 71 000 000" />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                            <PhoneIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Site Web (URL)</label>
                                    <div className="relative">
                                        <input type="text" className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition" 
                                            value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Description / Adresse</label>
                                <textarea className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none transition text-sm" 
                                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Adresse, horaires d'ouverture, remarques..." />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2 shadow-lg shadow-blue-900/20 transition active:scale-95">
                                {editingResource ? 'Enregistrer les modifications' : 'Ajouter l\'établissement'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourcesView;
