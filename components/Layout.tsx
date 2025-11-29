
import React from 'react';
import { ViewState, AppSettings } from '../types';
import { HomeIcon, UsersIcon, CalendarIcon, ArchiveIcon, ListIcon, BotIcon, SettingsIcon, GlobeIcon, ClipboardListIcon, FileSignatureIcon, LayoutIcon, ChartIcon, LogOutIcon, MenuIcon } from './Icons';

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
          <MenuIcon className="w-6 h-6" />
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
        fixed inset-y-0 left-0 z-50 text-white flex flex-col flex-shrink-0 transition-all duration-300 shadow-2xl
        md:relative md:w-64
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-black
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800/50 hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
          <div className="relative">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 animate-fade-in">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-serif italic shadow-lg shadow-blue-500/30">
                V
              </span>
              <span className="text-gradient">VisaFlow</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">CRM Agence de Voyage</p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="p-4 border-b border-slate-800/50 md:hidden flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'client-detail' && item.id === 'clients');
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as ViewState);
                  setIsSidebarOpen(false);
                }}
                className={`
                  group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-sm font-bold">A</span>
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Admin</p>
                <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  En ligne
                </p>
              </div>
            </div>
            <button
              onClick={onLock}
              className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
              title="Verrouiller l'application"
            >
              <LogOutIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow h-full overflow-hidden relative bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pt-16 md:pt-0 transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
