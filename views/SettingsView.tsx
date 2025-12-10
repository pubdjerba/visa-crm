
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { SettingsIcon, MoonIcon, SunIcon, PlusIcon, TrashIcon, SaveIcon, GlobeIcon, LayoutIcon, LockIcon, EyeIcon } from '../components/Icons';

interface SettingsViewProps {
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    onResetAll?: () => void;
}

const MENU_LABELS: Record<string, string> = {
    'dashboard': 'Dossiers en cours',
    'analytics': 'Statistiques (Analytics)',
    'kanban': 'Pipeline (Kanban)',
    'clients': 'Annuaire Clients',
    'appointment-tracker': 'Suivi RDV (Bot)',
    'tasks': 'Tâches (To-Do)',
    'templates': 'Modèles Lettres',
    'requirements': 'Documents Requis',
    'resources': 'Liens Utiles',
    'calendar': 'Calendrier',
    'archives': 'Archives',
    'settings': 'Paramètres'
};

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onResetAll }) => {
    const [agencyName, setAgencyName] = useState(settings.agencyName);
    const [currency, setCurrency] = useState(settings.currency);
    const [newVisaType, setNewVisaType] = useState('');
    const [newDestination, setNewDestination] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Centers State
    const [newCenterName, setNewCenterName] = useState('');
    const [newCenterUrl, setNewCenterUrl] = useState('');

    const handleSaveGeneral = () => {
        onUpdateSettings({
            ...settings,
            agencyName,
            currency
        });
        alert('Paramètres enregistrés !');
    };

    const toggleDarkMode = () => {
        onUpdateSettings({
            ...settings,
            darkMode: !settings.darkMode
        });
    };

    const handleAddVisaType = (e: React.FormEvent) => {
        e.preventDefault();
        const typeToAdd = newVisaType.trim();
        const currentTypes = settings.visaTypes || [];

        if (typeToAdd && !currentTypes.some(t => t.toLowerCase() === typeToAdd.toLowerCase())) {
            const updatedSettings = {
                ...settings,
                visaTypes: [...currentTypes, typeToAdd]
            };
            console.log("➕ [SettingsView] Adding visa type:", typeToAdd);
            console.log("➕ [SettingsView] Updated visaTypes array:", updatedSettings.visaTypes);
            onUpdateSettings(updatedSettings);
            setNewVisaType('');
        }
    };

    const handleRemoveVisaType = (typeToRemove: string) => {
        if (window.confirm(`Supprimer le type de visa "${typeToRemove}" ?`)) {
            const updatedTypes = (settings.visaTypes || []).filter(t => t !== typeToRemove);
            const updatedSettings = {
                ...settings,
                visaTypes: updatedTypes
            };
            console.log("➖ [SettingsView] Removing visa type:", typeToRemove);
            console.log("➖ [SettingsView] Updated visaTypes array:", updatedSettings.visaTypes);
            onUpdateSettings(updatedSettings);
        }
    };

    const handleAddDestination = (e: React.FormEvent) => {
        e.preventDefault();
        const destToAdd = newDestination.trim();
        const currentDests = settings.destinations || [];

        if (destToAdd && !currentDests.some(d => d.toLowerCase() === destToAdd.toLowerCase())) {
            onUpdateSettings({
                ...settings,
                destinations: [...currentDests, destToAdd]
            });
            setNewDestination('');
        }
    };

    const handleRemoveDestination = (destToRemove: string) => {
        if (window.confirm(`Supprimer la destination "${destToRemove}" ?`)) {
            const updatedDestinations = (settings.destinations || []).filter(d => d !== destToRemove);
            onUpdateSettings({
                ...settings,
                destinations: updatedDestinations
            });
        }
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 4) {
            alert("Le mot de passe doit contenir au moins 4 caractères.");
            return;
        }
        onUpdateSettings({
            ...settings,
            appPassword: newPassword
        });
        setNewPassword('');
        alert("Mot de passe mis à jour avec succès !");
    }

    const handleAddCenter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCenterName.trim() || !newCenterUrl.trim()) return;

        const currentCenters = settings.centers || [];
        onUpdateSettings({
            ...settings,
            centers: [...currentCenters, { name: newCenterName, url: newCenterUrl }]
        });
        setNewCenterName('');
        setNewCenterUrl('');
    };

    const handleRemoveCenter = (nameToRemove: string) => {
        if (window.confirm(`Supprimer le centre "${nameToRemove}" ?`)) {
            const updatedCenters = (settings.centers || []).filter(c => c.name !== nameToRemove);
            onUpdateSettings({
                ...settings,
                centers: updatedCenters
            });
        }
    }

    const moveMenuItem = (index: number, direction: 'up' | 'down') => {
        const currentOrder = [...settings.menuOrder];
        if (direction === 'up') {
            if (index === 0) return;
            [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
        } else {
            if (index === currentOrder.length - 1) return;
            [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
        }
        onUpdateSettings({ ...settings, menuOrder: currentOrder });
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <SettingsIcon className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                Paramètres de l'application
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl pb-10">

                {/* General Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Général</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de l'agence</label>
                            <input
                                type="text"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Devise (Affichage)</label>
                            <input
                                type="text"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSaveGeneral}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                        >
                            <SaveIcon className="w-4 h-4" />
                            Enregistrer
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <LockIcon className="w-5 h-5 text-orange-500" /> Sécurité
                    </h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe (Verrouillage)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••"
                                    className="w-full p-2 pr-10 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                        >
                            <SaveIcon className="w-4 h-4" />
                            Changer le mot de passe
                        </button>
                    </form>
                </div>

                {/* Appearance */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Apparence</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-800 dark:text-white">Mode Sombre</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Réduit la fatigue visuelle la nuit.</p>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 rounded-full transition ${settings.darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
                        >
                            {settings.darkMode ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Menu Customization */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Personnalisation du Menu</h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Organisez l'ordre des rubriques dans la barre latérale selon vos préférences.
                    </p>

                    <div className="space-y-2">
                        {settings.menuOrder.map((itemId, index) => (
                            <div key={itemId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-700 dark:text-slate-200 font-medium">
                                    {MENU_LABELS[itemId] || itemId}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveMenuItem(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                        title="Monter"
                                    >
                                        ⬆️
                                    </button>
                                    <button
                                        onClick={() => moveMenuItem(index, 'down')}
                                        disabled={index === settings.menuOrder.length - 1}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                        title="Descendre"
                                    >
                                        ⬇️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Destinations Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <GlobeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pays de Destination</h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gérez la liste des destinations disponibles pour les dossiers.</p>

                    <form onSubmit={handleAddDestination} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Nouveau pays (ex: Canada)"
                            value={newDestination}
                            onChange={(e) => setNewDestination(e.target.value)}
                            className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
                            <PlusIcon className="w-5 h-5" />
                            Ajouter
                        </button>
                    </form>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {(settings.destinations || []).map((dest, idx) => (
                            <div key={`${dest}-${idx}`} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3 rounded-lg hover:border-blue-300 transition group">
                                <span className="text-slate-700 dark:text-slate-200 font-medium truncate pr-2">{dest}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveDestination(dest);
                                    }}
                                    className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full hover:bg-red-700 transition shadow-sm z-20"
                                    title="Supprimer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visa Types Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Types de Visas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gérez les types de visas proposés par l'agence.</p>

                    <form onSubmit={handleAddVisaType} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Nouveau type (ex: Visa Omra...)"
                            value={newVisaType}
                            onChange={(e) => setNewVisaType(e.target.value)}
                            className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
                            <PlusIcon className="w-5 h-5" />
                            Ajouter
                        </button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {(settings.visaTypes || []).map((type, idx) => (
                            <div key={`${type}-${idx}`} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3 rounded-lg hover:border-green-300 transition group">
                                <span className="text-slate-700 dark:text-slate-200 font-medium truncate pr-2">{type}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveVisaType(type);
                                    }}
                                    className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full hover:bg-red-700 transition shadow-sm z-20"
                                    title="Supprimer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Centers Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <GlobeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Centres de Visa & URLs</h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Configurez les liens vers les portails de rendez-vous pour chaque centre.</p>

                    <form onSubmit={handleAddCenter} className="flex flex-col sm:flex-row gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Nom du centre (ex: TLSContact Tunis)"
                            value={newCenterName}
                            onChange={(e) => setNewCenterName(e.target.value)}
                            className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                            type="url"
                            placeholder="URL du portail (https://...)"
                            value={newCenterUrl}
                            onChange={(e) => setNewCenterUrl(e.target.value)}
                            className="flex-[2] p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm font-medium whitespace-nowrap">
                            <PlusIcon className="w-5 h-5" />
                            Ajouter
                        </button>
                    </form>

                    <div className="space-y-3">
                        {(settings.centers || []).map((center, idx) => (
                            <div key={`${center.name}-${idx}`} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{center.name}</p>
                                    <a href={center.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                        {center.url}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCenter(center.name)}
                                    className="text-slate-400 hover:text-red-600 p-2 transition"
                                    title="Supprimer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {(!settings.centers || settings.centers.length === 0) && (
                            <p className="text-sm text-slate-400 italic text-center py-4">Aucun centre configuré.</p>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SettingsView;
