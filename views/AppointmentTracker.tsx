
import React, { useState, useEffect, useRef } from 'react';
import { Client, ApplicationStatus, Application, PriorityMode, OpeningLog } from '../types';
import { BotIcon, CopyIcon, EyeIcon, MagicWandIcon, SparklesIcon, BoltIcon, TrendingUpIcon, MegaphoneIcon, ExternalLinkIcon, GridIcon, ListIcon, ClockIcon, FileTextIcon, PrinterIcon, DownloadIcon, CheckCircleIcon, CalendarIcon } from '../components/Icons';
import { ALERT_SOUND_B64, CHECK_FREQUENCIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AppointmentTrackerProps {
    clients: Client[];
    onUpdateApplication: (clientId: string, appId: string, data: Partial<Application>) => void;
    onUpdateStatus: (clientId: string, appId: string, newStatus: ApplicationStatus) => void;
    openingLogs: OpeningLog[];
    centers: { name: string; url: string }[];
}

const AppointmentTracker: React.FC<AppointmentTrackerProps> = ({ clients, onUpdateApplication, onUpdateStatus, openingLogs, centers }) => {
    const [revealedPasswordId, setRevealedPasswordId] = useState<string | null>(null);

    // Validation Modal State
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationDate, setValidationDate] = useState('');
    // New separated states for restricted time selection
    const [validationHour, setValidationHour] = useState('09');
    const [validationMinute, setValidationMinute] = useState('00');

    const [targetClientForValidation, setTargetClientForValidation] = useState<{ clientId: string, appId: string } | null>(null);

    const [showHeatmap, setShowHeatmap] = useState(false);

    // Log Modal State
    const [showLogModal, setShowLogModal] = useState(false);
    const [logClient, setLogClient] = useState<{
        name: string;
        destination: string;
        visaType: string;
        center: string;
        login: string;
        logs: string[];
    } | null>(null);

    // COCKPIT MODE STATE
    const [cockpitIndex, setCockpitIndex] = useState(0);
    const [cockpitMode, setCockpitMode] = useState(true); // Default to Cockpit mode

    // --- RADAR LOGIC ---
    const [isRadarActive, setIsRadarActive] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND_B64);
        audioRef.current.volume = 0.5;
    }, []);

    // --- TIME FORMATTING HELPER ---
    const calculateTimeDisplay = (lastCheckedStr?: string) => {
        if (!lastCheckedStr) {
            return {
                text: "Jamais",
                minutes: 999999,
                colorClass: "bg-red-100 text-red-700 border-red-200",
                textColor: "text-red-600"
            };
        }

        let checkDate: Date;
        const now = new Date();

        const standardParse = new Date(lastCheckedStr);

        if (!isNaN(standardParse.getTime())) {
            checkDate = standardParse;
        } else {
            try {
                const parts = lastCheckedStr.split(' ');
                if (parts.length === 2) {
                    const [d, m] = parts[0].split('/').map(Number);
                    const [h, min] = parts[1].split(':').map(Number);
                    checkDate = new Date(now.getFullYear(), m - 1, d, h, min);
                } else {
                    throw new Error("Invalid format");
                }
            } catch (e) {
                return { text: "Erreur date", minutes: 999999, colorClass: "bg-slate-100", textColor: "text-slate-500" };
            }
        }

        if (isNaN(checkDate.getTime())) {
            return { text: "Erreur date", minutes: 999999, colorClass: "bg-slate-100", textColor: "text-slate-500" };
        }

        if (checkDate > now) {
            return { text: "À l'instant", minutes: 0, colorClass: "bg-green-100 text-green-700 border-green-200", textColor: "text-green-600" };
        }

        const diffMs = now.getTime() - checkDate.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        let text = "";
        let colorClass = "";
        let textColor = "";

        if (diffMin < 60) {
            text = `${diffMin} min`;
            colorClass = "bg-green-100 text-green-800 border-green-200";
            textColor = "text-green-600";
        } else if (diffMin < 1440) {
            const hours = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            text = `${hours}h ${mins}min`;

            if (hours < 4) {
                colorClass = "bg-blue-100 text-blue-800 border-blue-200";
                textColor = "text-blue-600";
            } else {
                colorClass = "bg-orange-100 text-orange-800 border-orange-200";
                textColor = "text-orange-600";
            }
        } else {
            const days = Math.floor(diffMin / 1440);
            text = `${days} jour${days > 1 ? 's' : ''}`;
            colorClass = "bg-red-100 text-red-800 border-red-200";
            textColor = "text-red-600";
        }

        return { text, minutes: diffMin, colorClass, textColor };
    };

    // --- PROBABILITY SCORING ALGORITHM ---
    const calculateUrgencyAndProbability = (client: Client, app: Application) => {
        let score = 0;
        const config = app.appointmentConfig || {};
        const now = new Date();

        if (config.targetDateStart) {
            const start = new Date(config.targetDateStart);
            const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 15) score += 50;
            else if (diffDays < 30) score += 20;
        }

        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentDay = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][now.getDay()];

        const historyMatch = openingLogs.some(log =>
            log.destination === app.destination &&
            log.dayOfWeek === currentDay &&
            log.timeOfDay.startsWith(currentHour)
        );

        if (historyMatch) {
            score += 100;
        }

        return { score, historyMatch };
    };

    const waitingClients = clients.filter(c =>
        c.applications.some(app => app.status === ApplicationStatus.WAITING_APPOINTMENT)
    ).map(c => {
        const app = c.applications.find(a => a.status === ApplicationStatus.WAITING_APPOINTMENT)!;
        const { score, historyMatch } = calculateUrgencyAndProbability(c, app);

        const timeData = calculateTimeDisplay(app.appointmentConfig?.lastChecked);

        const sortScore = score + (timeData.minutes > 10000 ? 100 : timeData.minutes / 10);

        return {
            ...c,
            activeApp: app,
            urgencyScore: score,
            historyMatch,
            timeData,
            sortScore
        };
    }).sort((a, b) => b.sortScore - a.sortScore);

    const focusedClient = waitingClients[cockpitIndex];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!cockpitMode || !focusedClient) return;
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

            if (e.code === 'Space') {
                e.preventDefault();
                const centerConfig = centers.find(c => c.name === focusedClient.activeApp.center);
                const url = centerConfig ? centerConfig.url : (focusedClient.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                window.open(url, '_blank');
                handleMarkAsChecked(focusedClient.id, focusedClient.activeApp);
            }
            if (e.code === 'KeyC') {
                if (focusedClient.activeApp.appointmentConfig?.portalLogin) {
                    copyToClipboard(focusedClient.activeApp.appointmentConfig.portalLogin);
                }
            }
            if (e.code === 'KeyV') {
                if (focusedClient.activeApp.appointmentConfig?.portalPassword) {
                    copyToClipboard(focusedClient.activeApp.appointmentConfig.portalPassword);
                }
            }
            if (e.code === 'KeyN' || e.code === 'ArrowRight') {
                handleNextClient();
            }
            if (e.code === 'ArrowLeft') {
                handlePrevClient();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cockpitMode, focusedClient, cockpitIndex, centers]);

    const handleNextClient = () => {
        if (cockpitIndex < waitingClients.length - 1) {
            setCockpitIndex(prev => prev + 1);
        } else {
            setCockpitIndex(0);
        }
    };

    const handlePrevClient = () => {
        if (cockpitIndex > 0) {
            setCockpitIndex(prev => prev - 1);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleMarkAsChecked = (clientId: string, app: Application) => {
        const now = new Date();
        const formatted = `${now.getDate()}/${now.getMonth() + 1} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentConfig = app.appointmentConfig || {};
        const currentLog = currentConfig.checkLog || [];

        const newLog = [formatted, ...currentLog].slice(0, 50);

        onUpdateApplication(clientId, app.id, {
            appointmentConfig: {
                ...currentConfig,
                lastChecked: formatted,
                checkLog: newLog
            }
        });
    };

    const openValidationModal = (clientId: string, appId: string) => {
        setTargetClientForValidation({ clientId, appId });
        const now = new Date();
        setValidationDate(now.toISOString().split('T')[0]);
        setValidationHour('09');
        setValidationMinute('00');
        setShowValidationModal(true);
    };

    const handleConfirmValidation = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!targetClientForValidation || !validationDate) return;

        const fullDate = `${validationDate} ${validationHour}:${validationMinute}`;

        if (window.confirm(`Confirmer le RDV pour le ${validationDate} à ${validationHour}:${validationMinute} ?`)) {
            // Update appointment date first
            onUpdateApplication(targetClientForValidation.clientId, targetClientForValidation.appId, {
                appointmentDate: fullDate,
                status: ApplicationStatus.APPOINTMENT_SET
            });

            // Then update status separately to trigger history logs if needed, though updateApplication can handle it if merged.
            // Calling updateStatus ensures consistency with App.tsx logic for Opening Logs
            onUpdateStatus(targetClientForValidation.clientId, targetClientForValidation.appId, ApplicationStatus.APPOINTMENT_SET);

            setShowValidationModal(false);
        }
    };

    const openLogModal = (client: Client, app: Application) => {
        setLogClient({
            name: client.fullName,
            destination: app.destination,
            visaType: app.visaType,
            center: app.center || 'Centre non spécifié',
            login: app.appointmentConfig?.portalLogin || 'N/A',
            logs: app.appointmentConfig?.checkLog || []
        });
        setShowLogModal(true);
    };

    const handlePrintLog = () => {
        if (!logClient) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Journal de Vérification - ${logClient.name}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb; }
                        .label { font-weight: bold; font-size: 12px; color: #6b7280; text-transform: uppercase; }
                        .value { font-weight: 600; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; font-size: 13px; }
                        th { text-align: left; border-bottom: 2px solid #e5e7eb; padding: 10px; color: #6b7280; font-size: 11px; text-transform: uppercase; }
                        td { border-bottom: 1px solid #e5e7eb; padding: 10px; }
                        .status { color: #059669; font-weight: bold; }
                        .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Rapport de Vérification RDV</h1>
                        <p>VisaFlow Agency</p>
                    </div>
                    <div class="info-grid">
                        <div><div class="label">Client</div><div class="value">${logClient.name}</div></div>
                        <div><div class="label">Destination</div><div class="value">${logClient.destination}</div></div>
                        <div><div class="label">Type de Visa</div><div class="value">${logClient.visaType}</div></div>
                        <div><div class="label">Centre</div><div class="value">${logClient.center}</div></div>
                        <div><div class="label">Compte Portail</div><div class="value">${logClient.login}</div></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date & Heure</th>
                                <th>Action</th>
                                <th>Résultat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logClient.logs.map(log => `
                                <tr>
                                    <td>${log}</td>
                                    <td>Vérification manuelle</td>
                                    <td class="status">Effectué</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        Généré automatiquement par VisaFlow le ${new Date().toLocaleString()}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleDownloadLog = () => {
        if (!logClient) return;

        if (!(window as any).jspdf) {
            alert("La librairie PDF n'est pas encore chargée. Veuillez rafraîchir la page.");
            return;
        }

        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setTextColor(40);
            doc.text("Rapport de Vérification RDV", 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("VisaFlow Agency - Rapport d'activité", 14, 28);

            doc.setFontSize(12);
            doc.setTextColor(0);

            doc.text(`Client: ${logClient.name}`, 14, 40);
            doc.text(`Destination: ${logClient.destination}`, 14, 46);
            doc.text(`Type de Visa: ${logClient.visaType}`, 14, 52);
            doc.text(`Centre: ${logClient.center}`, 14, 58);
            doc.text(`Compte Portail: ${logClient.login}`, 14, 64);

            const tableColumn = ["Date & Heure", "Action", "Résultat"];
            const tableRows = logClient.logs.map(log => [log, "Vérification manuelle", "Effectué"]);

            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [59, 130, 246] }
            });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Généré par VisaFlow Agency - ' + new Date().toLocaleString(), 14, doc.internal.pageSize.height - 10);
            }

            doc.save(`Rapport_RDV_${logClient.name.replace(/\s+/g, '_')}.pdf`);

        } catch (e) {
            console.error("PDF Generation Error", e);
            alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
        }
    };

    const heatmapData = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const count = openingLogs.filter(log => log.timeOfDay.startsWith(hour)).length;
        return { name: `${hour}h`, count };
    });

    const hoursOptions = ['08', '09', '10', '11', '12', '13', '14', '15', '16'];
    const minutesOptions = ['00', '15', '30', '45'];

    return (
        <div className="p-6 h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white mb-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <BotIcon className="w-7 h-7 text-white" />
                        </div>
                        Cockpit de Chasse
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-15">
                        {waitingClients.length} dossiers en attente
                        {waitingClients.some(c => c.historyMatch) && (
                            <span className="ml-2 inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold animate-pulse">
                                🔥 Opportunité Détectée !
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCockpitMode(!cockpitMode)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md ${cockpitMode
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/30 hover:shadow-lg'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {cockpitMode ? <GridIcon className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                        {cockpitMode ? 'Mode Cockpit' : 'Mode Liste'}
                    </button>
                    <button
                        onClick={() => setShowHeatmap(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-purple-500/30 hover:shadow-lg"
                    >
                        <TrendingUpIcon className="w-4 h-4" />
                        Tendances
                    </button>
                </div>
            </div>

            {/* COCKPIT MODE */}
            {cockpitMode && focusedClient && (
                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden animate-fade-in">
                    {/* Sidebar Queue */}
                    <div className="w-full md:w-72 card overflow-hidden flex flex-col flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                            File d'attente Prioritaire
                        </div>
                        <div className="flex-grow overflow-y-auto scrollbar-thin">
                            {waitingClients.map((client, idx) => (
                                <div
                                    key={client.id}
                                    onClick={() => setCockpitIndex(idx)}
                                    className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-all duration-300 ${idx === cockpitIndex
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-l-blue-600 shadow-sm'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-sm truncate ${idx === cockpitIndex
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                            {client.fullName}
                                        </span>
                                        {client.historyMatch && (
                                            <span className="text-lg animate-bounce-subtle">🔥</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                            {client.activeApp.destination}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${client.timeData.colorClass}`}>
                                            {client.timeData.text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Focus Card */}
                    <div className="flex-grow card p-8 relative overflow-hidden shadow-xl">
                        {/* High Probability Banner */}
                        {focusedClient.historyMatch && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white text-center text-xs font-bold py-2 animate-pulse flex justify-center items-center gap-2 shadow-lg">
                                <TrendingUpIcon className="w-4 h-4" />
                                HAUTE PROBABILITÉ D'OUVERTURE MAINTENANT
                                <TrendingUpIcon className="w-4 h-4" />
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-8 mt-6">
                            <div className="flex-1">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
                                    {focusedClient.fullName}
                                </h2>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="badge bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                                        {focusedClient.activeApp.destination}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 text-lg font-semibold">
                                        {focusedClient.activeApp.visaType}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500 text-sm">
                                        ({focusedClient.activeApp.center})
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex gap-2 mb-3 justify-end">
                                    <button
                                        onClick={() => openLogModal(focusedClient, focusedClient.activeApp)}
                                        className="btn-ghost text-xs flex items-center gap-1"
                                    >
                                        <FileTextIcon className="w-3 h-3" /> Journal
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-2 font-semibold">
                                    Vérifié il y a
                                </p>
                                <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 shadow-lg ${focusedClient.timeData.colorClass}`}>
                                    <ClockIcon className="w-6 h-6" />
                                    <span className="text-2xl font-mono font-bold">
                                        {focusedClient.timeData.text}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Login & Password Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 relative group hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex justify-between items-center">
                                    <span>LOGIN (Email)</span>
                                    <button
                                        onClick={() => copyToClipboard(focusedClient.activeApp.appointmentConfig?.portalLogin || focusedClient.email || '')}
                                        className="text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-700 dark:hover:text-blue-300 hover:scale-110"
                                        title="Copier"
                                    >
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                </p>
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-white outline-none border-b-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                    value={focusedClient.activeApp.appointmentConfig?.portalLogin ?? focusedClient.email}
                                    onChange={(e) => onUpdateApplication(focusedClient.id, focusedClient.activeApp.id, {
                                        appointmentConfig: {
                                            ...focusedClient.activeApp.appointmentConfig,
                                            portalLogin: e.target.value
                                        }
                                    })}
                                    placeholder="Login..."
                                />
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-800 relative group hover:border-orange-400 dark:hover:border-orange-600 transition-all hover:shadow-lg">
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2 flex justify-between items-center">
                                    <span>MOT DE PASSE</span>
                                    <button
                                        onClick={() => copyToClipboard(focusedClient.activeApp.appointmentConfig?.portalPassword || 'Djerba@2021')}
                                        className="text-orange-500 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-all hover:text-orange-700 dark:hover:text-orange-300 hover:scale-110"
                                        title="Copier"
                                    >
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                </p>
                                <div className="relative">
                                    <input
                                        type={revealedPasswordId === focusedClient.id ? "text" : "password"}
                                        className="w-full bg-transparent text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-white outline-none border-b-2 border-transparent focus:border-orange-500 dark:focus:border-orange-400 transition-all pr-10"
                                        value={focusedClient.activeApp.appointmentConfig?.portalPassword ?? 'Djerba@2021'}
                                        onChange={(e) => onUpdateApplication(focusedClient.id, focusedClient.activeApp.id, {
                                            appointmentConfig: {
                                                ...focusedClient.activeApp.appointmentConfig,
                                                portalPassword: e.target.value
                                            }
                                        })}
                                        placeholder="Mot de passe..."
                                    />
                                    <button
                                        className="absolute right-0 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                        onMouseDown={(e) => { e.preventDefault(); setRevealedPasswordId(focusedClient.id); }}
                                        onMouseUp={(e) => { e.preventDefault(); setRevealedPasswordId(null); }}
                                        onMouseLeave={() => setRevealedPasswordId(null)}
                                    >
                                        <EyeIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto grid grid-cols-4 gap-4">
                            <button
                                onClick={() => {
                                    const centerConfig = centers.find(c => c.name === focusedClient.activeApp.center);
                                    const url = centerConfig ? centerConfig.url : (focusedClient.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                                    window.open(url, '_blank');
                                    handleMarkAsChecked(focusedClient.id, focusedClient.activeApp);
                                }}
                                className="col-span-1 btn-primary py-5 rounded-xl text-base shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 hover:shadow-2xl"
                            >
                                <ExternalLinkIcon className="w-6 h-6" />
                                <span className="text-sm">OUVRIR</span>
                                <span className="text-xs opacity-75">(Espace)</span>
                            </button>

                            <button
                                onClick={handleNextClient}
                                className="col-span-1 btn-secondary py-5 rounded-xl text-base shadow-md flex flex-col items-center justify-center gap-2 active:scale-95"
                            >
                                <BoltIcon className="w-6 h-6" />
                                <span className="text-sm">SUIVANT</span>
                                <span className="text-xs opacity-75">(N)</span>
                            </button>

                            <button
                                onClick={() => openValidationModal(focusedClient.id, focusedClient.activeApp.id)}
                                className="col-span-2 btn-success py-5 rounded-xl text-base shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 hover:shadow-2xl"
                            >
                                <CalendarIcon className="w-6 h-6" />
                                <span className="text-sm font-bold">RDV TROUVÉ !</span>
                                <span className="text-xs opacity-90">(Valider le rendez-vous)</span>
                            </button>
                        </div>

                        {/* Keyboard Shortcuts */}
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-bold">Espace</kbd> Ouvrir
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-bold">C</kbd> Copier Login
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-bold">V</kbd> Copier Mdp
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-bold">N</kbd> Suivant
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIST MODE */}
            {!cockpitMode && (
                <div className="flex-grow overflow-y-auto animate-fade-in">
                    <div className="card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-sm">Client</th>
                                    <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-sm">Destination</th>
                                    <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-sm">Login</th>
                                    <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-sm">Dernière vérif.</th>
                                    <th className="p-4 font-bold text-right text-slate-700 dark:text-slate-200 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {waitingClients.map((client, idx) => (
                                    <tr
                                        key={client.id}
                                        className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent dark:hover:from-slate-700/50 dark:hover:to-transparent transition-all duration-300 animate-fade-in"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {client.fullName}
                                                </span>
                                                {client.historyMatch && (
                                                    <span className="badge bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs animate-pulse shadow-md shadow-purple-500/30">
                                                        🔥 TOP
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {client.activeApp.destination}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    ({client.activeApp.center})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => copyToClipboard(client.activeApp.appointmentConfig?.portalLogin || '')}
                                                className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1 group"
                                                title="Cliquer pour copier"
                                            >
                                                {client.activeApp.appointmentConfig?.portalLogin}
                                                <CopyIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${client.timeData.colorClass}`}>
                                                    {client.timeData.text}
                                                </span>
                                                <button
                                                    onClick={() => openLogModal(client, client.activeApp)}
                                                    className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="Voir Journal"
                                                >
                                                    <FileTextIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        const centerConfig = centers.find(c => c.name === client.activeApp.center);
                                                        const url = centerConfig ? centerConfig.url : (client.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="btn-ghost text-sm flex items-center gap-1"
                                                >
                                                    <ExternalLinkIcon className="w-4 h-4" />
                                                    Ouvrir
                                                </button>
                                                <button
                                                    className="btn-primary text-sm px-3 py-1.5"
                                                    onClick={() => {
                                                        setCockpitMode(true);
                                                        setCockpitIndex(idx);
                                                    }}
                                                >
                                                    Focus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {waitingClients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center">
                                                    <BotIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 font-medium">
                                                    Aucun client en attente de rendez-vous
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LOG MODAL (Enhanced) */}
            {showLogModal && logClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl animate-scale-in overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="font-bold text-xl text-white flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                        <FileTextIcon className="w-6 h-6 text-white" />
                                    </div>
                                    Journal de Vérification
                                </h2>
                                <button
                                    onClick={() => setShowLogModal(false)}
                                    className="text-white/80 hover:text-white text-2xl transition-colors hover:scale-110"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 text-sm grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-white/70 uppercase font-semibold mb-1">Client</p>
                                    <p className="font-bold text-white">{logClient.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/70 uppercase font-semibold mb-1">Destination</p>
                                    <p className="font-semibold text-white">{logClient.destination}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/70 uppercase font-semibold mb-1">Visa</p>
                                    <p className="font-medium text-white">{logClient.visaType}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/70 uppercase font-semibold mb-1">Centre</p>
                                    <p className="font-medium text-white">{logClient.center}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin">
                            {logClient.logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                        <FileTextIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 italic">Aucune vérification enregistrée</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logClient.logs.map((log, i) => (
                                        <div
                                            key={i}
                                            className="card-hover p-3 flex justify-between items-center animate-fade-in"
                                            style={{ animationDelay: `${i * 30}ms` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                <span className="font-mono font-medium text-slate-700 dark:text-slate-200 text-sm">{log}</span>
                                            </div>
                                            <span className="badge badge-success text-xs flex items-center gap-1">
                                                <CheckCircleIcon className="w-3 h-3" /> Vérifié
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3">
                            <button onClick={handlePrintLog} className="btn-ghost flex-1 text-sm flex items-center justify-center gap-2">
                                <PrinterIcon className="w-4 h-4" /> Imprimer
                            </button>
                            <button onClick={handleDownloadLog} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                                <DownloadIcon className="w-4 h-4" /> PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Heatmap Modal */}
            {showHeatmap && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-2xl text-white flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <TrendingUpIcon className="w-7 h-7 text-white" />
                                    </div>
                                    Historique des Ouvertures
                                </h2>
                                <p className="text-sm text-white/90 ml-15">Analyse des créneaux trouvés précédemment</p>
                            </div>
                            <button
                                onClick={() => setShowHeatmap(false)}
                                className="text-white/80 hover:text-white text-3xl transition-colors hover:scale-110"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin">
                            <div className="h-72 w-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={heatmapData}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '2px solid rgb(168, 85, 247)',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#colorGradient)"
                                            radius={[8, 8, 0, 0]}
                                            barSize={24}
                                        />
                                        <defs>
                                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                                    Dernières Ouvertures Enregistrées
                                </h3>
                                {openingLogs.slice(0, 10).map((log, i) => (
                                    <div
                                        key={i}
                                        className="card-hover p-4 flex justify-between items-center animate-fade-in"
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white">{log.destination}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({log.center})</span>
                                        </div>
                                        <span className="badge bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono shadow-md shadow-purple-500/30">
                                            {log.dayOfWeek} {log.timeOfDay}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Validation Modal */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-md overflow-hidden shadow-2xl border-2 border-green-200 dark:border-green-800 animate-scale-in">
                        <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 flex justify-between items-center">
                            <h2 className="font-bold text-xl text-white flex items-center gap-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-white" />
                                </div>
                                Validation du RDV
                            </h2>
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="text-white/80 hover:text-white text-2xl transition-colors hover:scale-110"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                Veuillez confirmer la date et l'heure du rendez-vous trouvé.
                            </p>

                            <div>
                                <label className="label">Date du RDV</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={validationDate}
                                    onChange={(e) => setValidationDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="label">Heure du RDV</label>
                                <div className="flex gap-3">
                                    <select
                                        className="input flex-1"
                                        value={validationHour}
                                        onChange={(e) => setValidationHour(e.target.value)}
                                    >
                                        {hoursOptions.map(h => (
                                            <option key={h} value={h}>{h}h</option>
                                        ))}
                                    </select>
                                    <select
                                        className="input flex-1"
                                        value={validationMinute}
                                        onChange={(e) => setValidationMinute(e.target.value)}
                                    >
                                        {minutesOptions.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmValidation}
                                disabled={!validationDate}
                                className="btn-success w-full py-3.5 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Confirmer & Mettre à jour
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentTracker;
