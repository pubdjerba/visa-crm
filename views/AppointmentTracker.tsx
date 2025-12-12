
import React, { useState, useEffect, useRef } from 'react';
import { Client, ApplicationStatus, Application, PriorityMode, OpeningLog } from '../types';
import { BotIcon, CopyIcon, EyeIcon, MagicWandIcon, SparklesIcon, BoltIcon, TrendingUpIcon, MegaphoneIcon, ExternalLinkIcon, GridIcon, ListIcon, ClockIcon, FileTextIcon, PrinterIcon, DownloadIcon, CheckCircleIcon, CalendarIcon, TrashIcon, ArchiveIcon, SearchIcon, BellIcon } from '../components/Icons';
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


    // --- AUDIO CONTEXT LOGIC (OSCILLATOR) ---
    const playAlarmSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                console.error("Web Audio API not supported");
                return;
            }

            const ctx = new AudioContext();

            const playBeep = (startTime: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(440, startTime); // A4
                osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.1);

                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.5);
            };

            const now = ctx.currentTime;
            playBeep(now);
            playBeep(now + 0.6);
            playBeep(now + 1.2);

        } catch (e) {
            console.error("AudioContext Error:", e);
        }
    };

    // --- ALARM LOGIC ---
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [alarms, setAlarms] = useState<string[]>(() => {
        const saved = localStorage.getItem('appointmentAlarms');
        return saved ? JSON.parse(saved) : [];
    });
    const [newAlarmTime, setNewAlarmTime] = useState('');
    const [lastTriggeredTime, setLastTriggeredTime] = useState<string | null>(null);
    const [activeAlarm, setActiveAlarm] = useState<{ time: string, active: boolean } | null>(null);

    useEffect(() => {
        localStorage.setItem('appointmentAlarms', JSON.stringify(alarms));
    }, [alarms]);

    // Request on mount if needed, but rely on button
    useEffect(() => {
        if (alarms.length > 0 && Notification.permission === 'default') {
            // Optional: don't force it, wait for user
        }
    }, [alarms]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            if (alarms.includes(currentTime) && currentTime !== lastTriggeredTime) {
                triggerAlarm(currentTime);
                setLastTriggeredTime(currentTime);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [alarms, lastTriggeredTime]);

    const diagnoseNotifications = async () => {
        let msg = "Diagnostic Notifications:\n";
        msg += `- Supporté: ${"Notification" in window ? "OUI" : "NON"}\n`;
        msg += `- Permission actuelle: ${Notification.permission}\n`;
        msg += `- Secure Context (HTTPS/Localhost): ${window.isSecureContext ? "OUI" : "NON"}\n`;

        if (Notification.permission !== 'granted') {
            msg += "\nTentative de demande de permission...";
            const result = await Notification.requestPermission();
            msg += `\nNouveau statut: ${result}`;
        }

        if (Notification.permission === 'granted') {
            try {
                new Notification("Test Diagnostic", { body: "Ceci est un test." });
                msg += "\nNotification envoyée (vérifiez votre centre de notifications Windows).";
            } catch (e) {
                msg += `\nErreur d'envoi: ${e}`;
            }
        }

        alert(msg);
    };

    const triggerAlarm = (time: string) => {
        console.log(`⏰ Triggering Alarm for ${time}`);

        // Remove the alarm from the list (Auto-delete)
        setAlarms(prev => prev.filter(t => t !== time));

        // Play Sound (Oscillator)
        playAlarmSound();

        // Show In-App Notification
        setActiveAlarm({ time, active: true });
        setTimeout(() => setActiveAlarm(null), 10000); // Hide after 10s automatic

        // System Notification
        if ("Notification" in window && Notification.permission === 'granted') {
            try {
                const n = new Notification("⏰ Rappel de Recherche RDV", {
                    body: `Il est ${time}, c'est l'heure de vérifier les rendez-vous !`,
                    silent: false
                });
                n.onclick = () => { window.focus(); n.close(); };
            } catch (e) {
                console.error("❌ Exception creating notification:", e);
            }
        }
    };

    const addAlarm = () => {
        if (!newAlarmTime) return;
        if (!alarms.includes(newAlarmTime)) {
            setAlarms([...alarms, newAlarmTime].sort());
        }
        setNewAlarmTime('');
    };

    const removeAlarm = (time: string) => {
        setAlarms(alarms.filter(a => a !== time));
    };


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

        // Check if it's the custom format first: "5/12 9:10" (day/month hour:minute)
        const customFormatRegex = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/;
        const customMatch = lastCheckedStr.match(customFormatRegex);

        if (customMatch) {
            const [, d, m, h, min] = customMatch.map(Number);
            checkDate = new Date(now.getFullYear(), m - 1, d, h, min);

            if (checkDate > now) {
                checkDate = new Date(now.getFullYear() - 1, m - 1, d, h, min);
            }
        } else {
            const standardParse = new Date(lastCheckedStr);
            if (!isNaN(standardParse.getTime())) {
                checkDate = standardParse;
            } else {
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
        c.applications.some(app => app.status === ApplicationStatus.WAITING_APPOINTMENT && !app.archived)
    ).map(c => {
        const app = c.applications.find(a => a.status === ApplicationStatus.WAITING_APPOINTMENT && !a.archived)!;
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
        const formatted = now.toISOString();
        const currentConfig = app.appointmentConfig || {};
        const currentLog = currentConfig.checkLog || [];
        const readableFormat = `${now.getDate()}/${now.getMonth() + 1} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const newLog = [readableFormat, ...currentLog].slice(0, 50);

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
            onUpdateApplication(targetClientForValidation.clientId, targetClientForValidation.appId, {
                appointmentDate: fullDate,
                status: ApplicationStatus.APPOINTMENT_SET
            });
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">

                {/* IN-APP NOTIFICATION TOAST */}
                {activeAlarm && activeAlarm.active && (
                    <div className="fixed top-6 right-6 z-[100] animate-bounce-in bg-white dark:bg-slate-800 border-l-4 border-yellow-500 shadow-2xl rounded-r-xl p-4 max-w-sm flex items-start gap-4 ring-1 ring-black/5">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                            <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Rappel {activeAlarm.time}</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">C'est l'heure de vérifier les rendez-vous !</p>
                        </div>
                        <button
                            onClick={() => setActiveAlarm(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            &times;
                        </button>
                    </div>
                )}

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
                        onClick={() => setShowAlarmModal(true)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md ${alarms.length > 0
                            ? 'bg-yellow-500 text-white shadow-yellow-500/30 hover:bg-yellow-600'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <BellIcon className={`w-4 h-4 ${alarms.length > 0 ? 'animate-bounce' : ''}`} />
                        {alarms.length > 0 ? `${alarms.length} Alarme(s)` : 'Alarmes'}
                    </button>
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
                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Sidebar Queue */}
                    <div className="w-full md:w-72 card overflow-hidden flex flex-col flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                            File d'attente Prioritaire
                        </div>
                        <div className="flex-grow overflow-y-auto scrollbar-thin py-2">
                            {waitingClients.map((c, idx) => {
                                const app = c.activeApp;
                                const timeLeft = c.timeData.text;
                                const urgencyColor = c.timeData.colorClass;

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setCockpitIndex(idx)}
                                        className={`p-3 rounded-xl mx-2 my-1 cursor-pointer ${idx === cockpitIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className={`font-bold text-sm truncate max-w-[140px] ${idx === cockpitIndex ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {c.fullName}
                                                </div>
                                                <div className={`text-xs flex items-center gap-1 mt-1 ${idx === cockpitIndex ? 'text-blue-100' : 'text-slate-500'}`}>
                                                    <span>{app.destination}</span>
                                                    <span>•</span>
                                                    <span>{app.visaType}</span>
                                                </div>
                                            </div>
                                            <div className={`text-xs font-mono px-2 py-1 rounded-full ${idx === cockpitIndex
                                                ? 'bg-white/20 text-white backdrop-blur-sm'
                                                : urgencyColor
                                                }`}>
                                                {timeLeft}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
                                {focusedClient.notes && (
                                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r-xl max-w-xl shadow-sm animate-fade-in">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📝</span>
                                            <div>
                                                <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 uppercase mb-0.5">Note Interne</p>
                                                <p className="text-sm text-yellow-900 dark:text-yellow-100 italic font-medium leading-relaxed">
                                                    "{focusedClient.notes}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <button
                                    onClick={() => openLogModal(focusedClient, focusedClient.activeApp)}
                                    className="btn-ghost text-xs flex items-center gap-1"
                                >
                                    <FileTextIcon className="w-3 h-3" /> Journal
                                </button>
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
                        <div className="mt-auto grid grid-cols-3 gap-4">
                            <button
                                onClick={() => {
                                    const centerConfig = centers.find(c => c.name === focusedClient.activeApp.center);
                                    const url = centerConfig ? centerConfig.url : (focusedClient.activeApp.appointmentConfig?.portalUrl || 'https://fr.tlscontact.com/tn/tun/index.php');
                                    window.open(url, '_blank');
                                    handleMarkAsChecked(focusedClient.id, focusedClient.activeApp);
                                }}
                                className="col-span-1 btn-primary py-5 rounded-xl text-base shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 hover:shadow-2xl"
                            >
                                <SearchIcon className="w-6 h-6" />
                                <span className="text-sm">CHERCHER</span>
                                <span className="text-xs opacity-75">(Portail)</span>
                            </button>

                            <button
                                onClick={() => openValidationModal(focusedClient.id, focusedClient.activeApp.id)}
                                className="col-span-1 btn-success py-5 rounded-xl text-base shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 hover:shadow-2xl"
                            >
                                <CalendarIcon className="w-6 h-6" />
                                <span className="text-sm font-bold">RDV FIXÉ</span>
                                <span className="text-xs opacity-90">(Valider)</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm("Voulez-vous vraiment archiver ce dossier ?")) {
                                        onUpdateApplication(focusedClient.id, focusedClient.activeApp.id, { archived: true });
                                    }
                                }}
                                className="col-span-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-5 rounded-xl text-base shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <ArchiveIcon className="w-6 h-6" />
                                <span className="text-sm">ARCHIVER</span>
                                <span className="text-xs opacity-75">(Clôturer)</span>
                            </button>
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
                                                {client.notes && (
                                                    <div className="tooltip" data-tip={client.notes}>
                                                        <span className="text-yellow-500 text-lg cursor-help">📝</span>
                                                    </div>
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
                                <div>
                                    <p className="text-xs text-white/70 uppercase font-semibold mb-1">Compte Portail</p>
                                    <p className="font-medium text-white">{logClient.login}</p>
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
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{log}</p>
                                                    <p className="text-xs text-slate-500">Vérification manuelle</p>
                                                </div>
                                            </div>
                                            <div className="text-green-600 dark:text-green-400">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3">
                            <button onClick={handlePrintLog} className="flex-1 btn-ghost flex items-center justify-center gap-2">
                                <PrinterIcon className="w-4 h-4" /> Imprimer
                            </button>
                            <button onClick={handleDownloadLog} className="flex-1 btn-primary flex items-center justify-center gap-2">
                                <DownloadIcon className="w-4 h-4" /> PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEATMAP MODAL */}
            {showHeatmap && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUpIcon className="w-6 h-6 text-purple-500" />
                                Analyse des Ouvertures (24h)
                            </h2>
                            <button onClick={() => setShowHeatmap(false)} className="text-2xl hover:text-red-500">&times;</button>
                        </div>
                        <div className="flex-grow w-full h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-sm text-purple-800 dark:text-purple-200">
                            💡 <strong>Insight:</strong> Les créneaux d'ouverture sont plus fréquents entre 09h et 11h pour cette destination.
                        </div>
                    </div>
                </div>
            )}

            {/* ALARM MODAL */}
            {showAlarmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                <BellIcon className="w-6 h-6" />
                                Alarmes de Recherche
                            </h3>
                            <button onClick={() => setShowAlarmModal(false)} className="text-2xl hover:text-red-500">&times;</button>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Programmez des rappels sonores et visuels pour lancer vos recherches.
                        </p>

                        <div className="flex gap-2 mb-6">
                            <input
                                type="time"
                                className="input flex-grow"
                                value={newAlarmTime}
                                onChange={(e) => setNewAlarmTime(e.target.value)}
                            />
                            <button onClick={addAlarm} className="btn-primary">
                                Ajouter
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto mb-6 pr-1 space-y-2">
                            {alarms.length === 0 ? (
                                <p className="text-center text-slate-400 italic text-sm">Aucune alarme programmée</p>
                            ) : (
                                alarms.map(alarm => (
                                    <div key={alarm} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">{alarm}</span>
                                        <button onClick={() => removeAlarm(alarm)} className="text-red-500 hover:text-red-700 p-1">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => triggerAlarm("TEST")}
                            className="w-full btn-ghost text-xs flex items-center justify-center gap-2 mb-2"
                        >
                            🔔 Tester l'alarme (Son + Notification)
                        </button>


                        <div className="flex flex-col gap-2 mb-4">
                            {Notification.permission === 'granted' ? (
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Notifications actives
                                </div>
                            ) : (
                                <button
                                    onClick={() => Notification.requestPermission().then(() => setShowAlarmModal(prev => !prev))}
                                    className="text-xs text-white bg-blue-500 hover:bg-blue-600 p-2 rounded flex items-center justify-center gap-2 transition-colors"
                                >
                                    <BellIcon className="w-4 h-4" />
                                    Activer les notifications
                                </button>
                            )}
                            {Notification.permission === 'denied' && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    ⚠️ Notifications bloquées. Vérifiez les paramètres de votre navigateur.
                                </div>
                            )}

                            <button onClick={diagnoseNotifications} className="text-[10px] text-slate-400 underline hover:text-slate-600 text-center mt-2">
                                Diagnostiquer un problème de notification
                            </button>
                        </div>

                        <div className="text-xs text-center text-slate-400">
                            Assurez-vous que le son est activé et les notifications autorisées.
                        </div>
                    </div>
                </div>
            )}

            {/* VALIDATION MODAL */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CalendarIcon className="w-6 h-6" />
                            Confirmer le Rendez-vous
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Veuillez valider la date et l'heure exactes du rendez-vous obtenu.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="input w-full"
                                    value={validationDate}
                                    onChange={(e) => setValidationDate(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Heure</label>
                                    <select
                                        className="input w-full"
                                        value={validationHour}
                                        onChange={(e) => setValidationHour(e.target.value)}
                                    >
                                        {hoursOptions.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Minute</label>
                                    <select
                                        className="input w-full"
                                        value={validationMinute}
                                        onChange={(e) => setValidationMinute(e.target.value)}
                                    >
                                        {minutesOptions.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="flex-1 btn-ghost"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmValidation}
                                className="flex-1 btn-success shadow-lg shadow-green-500/30"
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AppointmentTracker;
