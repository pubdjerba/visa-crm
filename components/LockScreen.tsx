
import React, { useState } from 'react';
import { LockIcon } from './Icons';
import { AppSettings } from '../types';

interface LockScreenProps {
    onUnlock: () => void;
    settings: AppSettings;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, settings }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === (settings.appPassword || '1234')) {
            onUnlock();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                    <LockIcon className="w-10 h-10" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">VisaFlow Sécurisé</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Veuillez entrer votre code PIN pour accéder à l'application.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input 
                            type="password" 
                            autoFocus
                            className={`w-full text-center text-2xl tracking-widest font-bold p-4 border rounded-xl outline-none transition focus:ring-4 ${error ? 'border-red-500 ring-red-200 text-red-600' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-100 dark:bg-slate-900 dark:text-white'}`}
                            placeholder="••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(false); }}
                        />
                        {error && <p className="text-red-500 text-sm mt-2">Mot de passe incorrect.</p>}
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
                    >
                        Déverrouiller
                    </button>
                </form>
                
                <p className="mt-6 text-xs text-slate-400">
                    Mot de passe oublié ? Contactez l'administrateur système.
                </p>
            </div>
        </div>
    );
};

export default LockScreen;
