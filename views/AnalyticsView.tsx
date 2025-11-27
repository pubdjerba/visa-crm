
import React from 'react';
import { Client, ApplicationStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';

interface AnalyticsViewProps {
    clients: Client[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ clients }) => {
    // Calcul des statistiques
    const allApps = clients.flatMap(c => c.applications);
    
    // KPI: Total Revenue
    const totalRevenue = allApps.reduce((acc, app) => acc + (app.price || 0), 0);
    const totalDeposit = allApps.reduce((acc, app) => acc + (app.deposit || 0), 0);
    const remaining = totalRevenue - totalDeposit;

    // KPI: Status Breakdown
    const statusCounts = allApps.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Data for Status Pie Chart
    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff0000', '#82ca9d', '#a4de6c'];

    // KPI: Destination Breakdown (Bar Chart)
    const destCounts = allApps.reduce((acc, app) => {
        acc[app.destination] = (acc[app.destination] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = Object.keys(destCounts).map(dest => ({
        name: dest,
        count: destCounts[dest]
    })).sort((a, b) => b.count - a.count);

    // KPI: Success Rate
    const completed = statusCounts[ApplicationStatus.COMPLETED] || 0;
    const refused = statusCounts[ApplicationStatus.REFUSED] || 0;
    const totalFinished = completed + refused;
    const successRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 0;

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <ChartIcon className="w-8 h-8 text-blue-600" />
                Tableau de Bord Analytique
            </h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Chiffre d'Affaires Estimé</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalRevenue.toLocaleString()} <span className="text-sm">TND</span>
                    </p>
                    <p className="text-xs text-green-500 mt-1 font-medium">Reçu: {totalDeposit.toLocaleString()} TND</p>
                </div>

                {/* Applications */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Dossiers Totaux</h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{allApps.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Actuellement en cours</p>
                </div>

                 {/* Success Rate */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Taux d'Acceptation</h3>
                    <div className="flex items-center gap-2">
                         <p className={`text-2xl font-bold ${successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                            {successRate}%
                        </p>
                        {successRate >= 80 && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Basé sur {totalFinished} dossiers clôturés</p>
                </div>

                {/* Refusals */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Refus Enregistrés</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-red-500">{refused}</p>
                        {refused > 0 && <AlertTriangleIcon className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Dossiers rejetés</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Destinations Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-80 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Dossiers par Destination</h3>
                    <div className="flex-grow">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-80 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Répartition des Statuts</h3>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
