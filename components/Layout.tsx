
import React from 'react';
import { ViewState, AppSettings } from '../types';
import { HomeIcon, UsersIcon, CalendarIcon, ArchiveIcon, ListIcon, BotIcon, SettingsIcon, GlobeIcon, ClipboardListIcon, FileSignatureIcon, LayoutIcon, ChartIcon, LogOutIcon } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  settings: AppSettings;
  onLock: () => void; // Add onLock prop
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, settings, onLock }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dossiers en cours', icon: HomeIcon },
    { id: 'analytics', label: 'Statistiques (Analytics)', icon: ChartIcon },
    { id: 'kanban', label: 'Pipeline (Kanban)', icon: LayoutIcon },
    { id: 'clients', label: 'Annuaire Clients', icon: UsersIcon },
    { id: 'appointment-tracker', label: 'Suivi RDV (Bot)', icon: BotIcon },
    { id: 'tasks', label: 'Tâches (To-Do)', icon: ClipboardListIcon },
    { id: 'templates', label: 'Modèles Lettres', icon: FileSignatureIcon },
    { id: 'requirements', label: 'Documents Requis', icon: ListIcon },
    { id: 'resources', label: 'Liens Utiles', icon: GlobeIcon },
    { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
    { id: 'archives', label: 'Archives', icon: ArchiveIcon },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  // Sort items based on user settings
  const menuItems = [...baseMenuItems].sort((a, b) => {
    const indexA = settings.menuOrder.indexOf(a.id);
    const indexB = settings.menuOrder.indexOf(b.id);
    // Handle items not in the list (new features) by putting them at the end
    const finalA = indexA === -1 ? 999 : indexA;
    const finalB = indexB === -1 ? 999 : indexB;
    return finalA - finalB;
  });

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 dark:bg-slate-950 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-serif italic">V</span>
          <span className="font-bold text-lg">VisaFlow</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-300 hover:text-white">
          <ListIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col flex-shrink-0 transition-transform duration-300 shadow-xl
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-serif italic">V</span>
            VisaFlow
          </h1>
          <p className="text-xs text-slate-400 mt-1">CRM Agence de Voyage</p>
        </div>

        <div className="p-4 border-b border-slate-800 md:hidden flex justify-between items-center">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'client-detail' && item.id === 'clients');
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as ViewState);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-slate-500">En ligne</p>
              </div>
            </div>
            <button
              onClick={onLock}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition"
              title="Verrouiller l'application"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow h-full overflow-hidden relative bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
