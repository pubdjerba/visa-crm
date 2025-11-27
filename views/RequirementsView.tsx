
import React, { useState, useEffect } from 'react';
import { VisaRequirement } from '../types';
import { ListIcon, PlusIcon, TrashIcon, CopyIcon, PrinterIcon, CheckCircleIcon, FileTextIcon } from '../components/Icons';

interface RequirementsViewProps {
    requirements: VisaRequirement[];
    onUpdateRequirements: (req: VisaRequirement) => void;
    visaTypes: string[]; // Dynamique depuis les paramètres
}

const COMMON_SUGGESTIONS = [
    "Passeport original valide 6 mois",
    "2 Photos d'identité fond blanc",
    "Assurance voyage (30.000€)",
    "Réservation d'hôtel confirmée",
    "Réservation billet d'avion A/R",
    "Relevés bancaires (3 derniers mois)",
    "Attestation de travail",
    "Fiche de paie (3 derniers mois)",
    "Registre de commerce (Patente)",
    "Invitation officielle"
];

const RequirementsView: React.FC<RequirementsViewProps> = ({ requirements, onUpdateRequirements, visaTypes }) => {
    // Initialiser avec le premier type disponible dans les paramètres ou 'Tourisme' par défaut
    const [selectedVisa, setSelectedVisa] = useState<string>(visaTypes[0] || 'Tourisme');
    const [newPoint, setNewPoint] = useState('');
    const [copied, setCopied] = useState(false);

    // Mettre à jour la sélection si la liste des types change (ex: suppression du type sélectionné)
    useEffect(() => {
        if (!visaTypes.includes(selectedVisa) && visaTypes.length > 0) {
            setSelectedVisa(visaTypes[0]);
        }
    }, [visaTypes, selectedVisa]);

    const currentReq = requirements.find(r => r.visaType === selectedVisa) || {
        id: `temp_${Date.now()}`,
        visaType: selectedVisa,
        content: []
    };

    const handleAddPoint = (e: React.FormEvent | null, text: string = newPoint) => {
        if (e) e.preventDefault();
        if (!text.trim()) return;
        
        // Avoid duplicates
        if (currentReq.content.includes(text)) {
            alert("Ce document est déjà dans la liste.");
            return;
        }

        const updated = {
            ...currentReq,
            content: [...currentReq.content, text]
        };
        onUpdateRequirements(updated);
        setNewPoint('');
    };

    const handleDeletePoint = (index: number) => {
        if(window.confirm('Retirer ce document de la liste ?')) {
            const updated = {
                ...currentReq,
                content: currentReq.content.filter((_, i) => i !== index)
            };
            onUpdateRequirements(updated);
        }
    };

    const handleCopy = () => {
        const text = `*Documents Requis - Visa ${selectedVisa}*\n\n` + currentReq.content.map(c => `- ${c}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Styles pour l'impression (PDF) */}
            <style>
                {`
                    @media print {
                        @page { margin: 2cm; }
                        body { background: white !important; -webkit-print-color-adjust: exact; }
                        aside, nav, .no-print { display: none !important; }
                        .requirements-container {
                            border: none !important;
                            box-shadow: none !important;
                            display: block !important;
                        }
                        .requirements-sidebar { display: none !important; }
                        .requirements-main { 
                            padding: 0 !important; 
                            background: white !important; 
                        }
                        .print-only { display: block !important; }
                        .print-item {
                            border-bottom: 1px solid #eee;
                            padding: 10px 0;
                            color: black !important;
                        }
                    }
                    .print-only { display: none; }
                `}
            </style>

            {/* Header Screen */}
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ListIcon className="w-7 h-7 text-blue-600" />
                        Checklists Documents
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gérez les listes de pièces à fournir pour chaque type de visa.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-grow flex flex-col md:flex-row overflow-hidden requirements-container">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 border-r border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 requirements-sidebar flex-shrink-0 overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-2">Types de Visa</h3>
                    <div className="space-y-1">
                        {visaTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedVisa(type)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                                    selectedVisa === type 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {type}
                                {selectedVisa === type && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col requirements-main relative">
                    
                    {/* Print Header (Hidden on Screen) */}
                    <div className="print-only mb-8">
                         <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">VisaFlow Agency</h1>
                                <p className="text-slate-500">Service Visas & Immigration</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Date d'impression</p>
                                <p className="font-medium">{new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg mb-6">
                            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                                Liste des documents requis
                            </h2>
                            <p className="text-lg text-blue-700 font-semibold mt-1">Visa {selectedVisa}</p>
                        </div>
                    </div>

                    {/* Toolbar Screen */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 no-print">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm">Visa {selectedVisa}</span>
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopy}
                                className="text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-2 shadow-sm active:scale-95"
                                title="Copier pour WhatsApp/Email"
                            >
                                {copied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                {copied ? 'Copié !' : 'Copier'}
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="text-sm bg-slate-800 dark:bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-blue-700 transition flex items-center gap-2 shadow-sm active:scale-95"
                                title="Générer PDF via impression"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                PDF / Imprimer
                            </button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900">
                        {currentReq.content.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <FileTextIcon className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                                <p>Aucun document configuré pour ce visa.</p>
                                <p className="text-sm">Utilisez le formulaire ci-dessous pour commencer.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2 max-w-3xl mx-auto">
                                {currentReq.content.map((point, idx) => (
                                    <li key={idx} className="group bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-500 transition-all print-item">
                                        <div className="flex items-center gap-4">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                                {idx + 1}
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium">{point}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeletePoint(idx)}
                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition opacity-0 group-hover:opacity-100 no-print focus:opacity-100"
                                            title="Supprimer ce document"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                        {/* Print Footer */}
                         <div className="print-only mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
                            <p>Merci de préparer les originaux et une copie de chaque document.</p>
                        </div>
                    </div>

                    {/* Input Area (Screen Only) */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 no-print z-10">
                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={(e) => handleAddPoint(e)} className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Nouveau document requis (ex: Extrait de naissance)..."
                                    value={newPoint}
                                    onChange={(e) => setNewPoint(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition active:scale-95">
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </form>
                            
                            {/* Quick Suggestions */}
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-slate-400 font-medium py-1">Suggestions :</span>
                                {COMMON_SUGGESTIONS.filter(s => !currentReq.content.includes(s)).slice(0, 5).map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleAddPoint(null, suggestion)}
                                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 transition"
                                    >
                                        + {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequirementsView;
