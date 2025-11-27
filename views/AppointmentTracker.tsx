
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
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 relative">

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <BotIcon className="w-8 h-8 text-blue-600" />
                        Cockpit de Chasse
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {waitingClients.length} dossiers en attente.
                        {waitingClients.some(c => c.historyMatch) && <span className="text-orange-500 font-bold ml-2">🔥 Opportunité Détectée !</span>}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCockpitMode(!cockpitMode)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-sm ${cockpitMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border'}`}
                    >
                        {cockpitMode ? <GridIcon className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                        {cockpitMode ? 'Mode Cockpit (Focus)' : 'Mode Liste'}
                    </button>
                    <button
                        onClick={() => setShowHeatmap(true)}
                        className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-bold text-sm flex items-center gap-2 transition"
                    >
                        <TrendingUpIcon className="w-4 h-4" />
                        Tendances
                    </button>
                </div>
            </div>

            {/* COCKPIT MODE */}
            {cockpitMode && focusedClient && (
                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Sidebar Queue */}
                    <div className="w-full md:w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col flex-shrink-0 shadow-sm">
                        <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-500 uppercase tracking-wide">
                            File d'attente Prioritaire
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {waitingClients.map((client, idx) => (
                                <div
                                    key={client.id}
                                    onClick={() => setCockpitIndex(idx)}
                                    className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition ${idx === cockpitIndex
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-sm truncate ${idx === cockpitIndex ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {client.fullName}
                                        </span>
                                        {client.historyMatch && <span className="text-xs">🔥</span>}
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{client.activeApp.destination}</span>
                                        <span className={`px-1.5 py-0.5 rounded font-medium ${client.timeData.textColor} bg-white dark:bg-slate-800`}>
                                            {client.timeData.text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Focus Card */}
                    <div className="flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col p-8 relative overflow-hidden">
                        {focusedClient.historyMatch && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-orange-500 text-white text-center text-xs font-bold py-1 animate-pulse flex justify-center items-center gap-2">
                                <TrendingUpIcon className="w-3 h-3" /> HAUTE PROBABILITÉ D'OUVERTURE MAINTENANT
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-8 mt-4">
                            <div>
                                <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{focusedClient.fullName}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{focusedClient.activeApp.destination}</span>
                                    <span className="text-slate-500 dark:text-slate-400 text-lg">{focusedClient.activeApp.visaType}</span>
                                    <span className="text-slate-400 text-sm">({focusedClient.activeApp.center})</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex gap-2 mb-2 justify-end">
                                    <button
                                        onClick={() => openLogModal(focusedClient, focusedClient.activeApp)}
                                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2 py-1 rounded flex items-center gap-1 text-slate-600 dark:text-slate-300"
                                    >
                                        <FileTextIcon className="w-3 h-3" /> Journal
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 uppercase mb-1">Vérifié il y a</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${focusedClient.timeData.colorClass}`}>
                                    <ClockIcon className="w-5 h-5" />
                                    <span className="text-xl font-mono font-bold">{focusedClient.timeData.text}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 relative group hover:border-blue-400 transition">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                                    <span>LOGIN (Email)</span>
                                    <button
                                        onClick={() => copyToClipboard(focusedClient.activeApp.appointmentConfig?.portalLogin || focusedClient.email || '')}
                                        className="text-blue-500 opacity-0 group-hover:opacity-100 transition hover:text-blue-700"
                                        title="Copier"
                                    >
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                </p>
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 transition"
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
                            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 relative group hover:border-orange-400 transition">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                                    <span>MOT DE PASSE</span>
                                    <button
                                        onClick={() => copyToClipboard(focusedClient.activeApp.appointmentConfig?.portalPassword || 'Djerba@2021')}
                                        className="text-orange-500 opacity-0 group-hover:opacity-100 transition hover:text-orange-700"
                                        title="Copier"
                                    >
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                </p>
                                <div className="relative">
                                    <input
                                        type={revealedPasswordId === focusedClient.id ? "text" : "password"}
                                        className="w-full bg-transparent text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-orange-500 transition pr-8"
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
                                        className="absolute right-0 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-orange-600"
                                        onMouseDown={(e) => { e.preventDefault(); setRevealedPasswordId(focusedClient.id); }}
                                        onMouseUp={(e) => { e.preventDefault(); setRevealedPasswordId(null); }}
                                        onMouseLeave={() => setRevealedPasswordId(null)}
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto grid grid-cols-4 gap-4">
                            <button
                                onClick={() => {
                                    const centerConfig = centers.find(c => c.name === focusedClient.activeApp.center);
                                    const url = centerConfig ? centerConfig.url : (focusedClient.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                                    window.open(url, '_blank');
                                    handleMarkAsChecked(focusedClient.id, focusedClient.activeApp);
                                }}
                                className="col-span-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition flex flex-col items-center justify-center gap-1 active:scale-95"
                            >
                                <ExternalLinkIcon className="w-6 h-6" />
                                <span>OUVRIR (Espace)</span>
                            </button>

                            <button
                                onClick={handleNextClient}
                                className="col-span-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-4 rounded-xl font-bold text-lg shadow-sm transition flex flex-col items-center justify-center gap-1 active:scale-95"
                            >
                                <BoltIcon className="w-6 h-6" />
                                <span>SUIVANT (N)</span>
                            </button>

                            <button
                                onClick={() => openValidationModal(focusedClient.id, focusedClient.activeApp.id)}
                                className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition flex flex-col items-center justify-center gap-2 active:scale-95"
                            >
                                <CalendarIcon className="w-6 h-6" />
                                <span>RDV TROUVÉ ! (Valider)</span>
                            </button>
                        </div>

                        <div className="mt-4 text-center text-xs text-slate-400 flex justify-center gap-6 font-mono opacity-60">
                            <span>[Espace] = Ouvrir Site</span>
                            <span>[C] = Copier Login</span>
                            <span>[V] = Copier Mdp</span>
                            <span>[N / →] = Suivant</span>
                        </div>
                    </div>
                </div>
            )}

            {/* LIST MODE */}
            {!cockpitMode && (
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-left border-collapse bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Client</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Destination</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Login</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Dernière vérif.</th>
                                <th className="p-4 font-semibold text-right text-slate-600 dark:text-slate-300 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {waitingClients.map((client, idx) => (
                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                                        {client.fullName}
                                        {client.historyMatch && <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded font-bold">TOP</span>}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                        {client.activeApp.destination} <span className="text-xs text-slate-400">({client.activeApp.center})</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => copyToClipboard(client.activeApp.appointmentConfig?.portalLogin || '')}>
                                        {client.activeApp.appointmentConfig?.portalLogin}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${client.timeData.colorClass}`}>
                                                {client.timeData.text}
                                            </span>
                                            <button
                                                onClick={() => openLogModal(client, client.activeApp)}
                                                className="text-slate-400 hover:text-blue-500"
                                                title="Voir Journal"
                                            >
                                                <FileTextIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const centerConfig = centers.find(c => c.name === client.activeApp.center);
                                                    const url = centerConfig ? centerConfig.url : (client.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                                                    window.open(url, '_blank');
                                                }}
                                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2"
                                            >
                                                <ExternalLinkIcon className="w-4 h-4" />
                                                Ouvrir (Espace)
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold transition" onClick={() => {
                                            setCockpitMode(true);
                                            setCockpitIndex(idx);
                                        }}>Ouvrir</button>
                                    </td>
                                </tr>
                            ))}
                            {waitingClients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Aucun client en attente de rendez-vous.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* LOG MODAL (Enhanced) */}
            {showLogModal && logClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-slate-200 dark:border-slate-700 max-h-[85vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <div className="flex justify-between items-start mb-3">
                                <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileTextIcon className="w-5 h-5 text-blue-600" />
                                    Journal de Vérification
                                </h2>
                                <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm grid grid-cols-2 gap-2">
                                <div><p className="text-xs text-slate-400 uppercase">Client</p><p className="font-bold text-slate-700 dark:text-slate-200">{logClient.name}</p></div>
                                <div><p className="text-xs text-slate-400 uppercase">Destination</p><p className="font-semibold text-slate-700 dark:text-slate-200">{logClient.destination}</p></div>
                                <div><p className="text-xs text-slate-400 uppercase">Visa</p><p className="font-medium text-slate-700 dark:text-slate-200">{logClient.visaType}</p></div>
                                <div><p className="text-xs text-slate-400 uppercase">Centre</p><p className="font-medium text-slate-700 dark:text-slate-200">{logClient.center}</p></div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/50">
                            {logClient.logs.length === 0 ? <p className="text-center text-sm text-slate-400 italic py-8">Aucune vérification.</p> : (
                                <div className="space-y-2">
                                    {logClient.logs.map((log, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm bg-white dark:bg-slate-700 p-3 rounded border border-slate-200 dark:border-slate-600 shadow-sm">
                                            <div className="flex items-center gap-3"><span className="text-slate-400 text-xs font-mono">{i + 1}</span><span className="font-mono font-medium text-slate-700 dark:text-slate-200">{log}</span></div>
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded"><CheckCircleIcon className="w-3 h-3" /> Vérifié</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2">
                            <button onClick={handlePrintLog} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm"><PrinterIcon className="w-4 h-4" /> Imprimer Rapport</button>
                            <button onClick={handleDownloadLog} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-sm"><DownloadIcon className="w-4 h-4" /> Télécharger PDF</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Heatmap Modal */}
            {showHeatmap && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-purple-50 dark:bg-purple-900/20">
                            <div><h2 className="font-bold text-xl text-purple-900 dark:text-purple-200 flex items-center gap-2"><TrendingUpIcon className="w-6 h-6" /> Historique des Ouvertures</h2><p className="text-sm text-purple-700 dark:text-purple-300">Analyse des créneaux trouvés précédemment.</p></div>
                            <button onClick={() => setShowHeatmap(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-8">
                            <div className="h-64 w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={heatmapData}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Dernières Ouvertures Enregistrées</h3>
                                {openingLogs.slice(0, 10).map((log, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm">
                                        <div><span className="font-bold text-slate-800 dark:text-white">{log.destination}</span><span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({log.center})</span></div>
                                        <div className="text-sm"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono font-bold">{log.dayOfWeek} {log.timeOfDay}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Validation Modal */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-green-100 dark:border-green-900">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-green-50 dark:bg-green-900/20">
                            <h2 className="font-bold text-lg text-green-900 dark:text-green-200 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                Validation du RDV
                            </h2>
                            <button onClick={() => setShowValidationModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Veuillez confirmer la date et l'heure du rendez-vous trouvé.
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date du RDV</label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    value={validationDate}
                                    onChange={(e) => setValidationDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Heure du RDV</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-1/2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                        value={validationHour}
                                        onChange={(e) => setValidationHour(e.target.value)}
                                    >
                                        {hoursOptions.map(h => (
                                            <option key={h} value={h}>{h}h</option>
                                        ))}
                                    </select>
                                    <select
                                        className="w-1/2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
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
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
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
