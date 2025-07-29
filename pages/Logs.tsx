
import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/googleSheetService';
import { Log } from '../types';
import { DATE_FORMATTER } from '../constants';

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await getLogs();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading Logs...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">System Logs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View system activity logs and audit trail</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Filters would be implemented here */}
                    <select className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md"><option>All Log Types</option></select>
                    <select className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md"><option>All Users</option></select>
                    <select className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md"><option>This Month</option></select>
                    <button className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-sm font-medium">Export Logs</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['Timestamp', 'User', 'Action', 'Details', 'IP Address'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                            {logs.map(log => (
                                <tr key={log.timestamp}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4">{log.user}</td>
                                    <td className="px-6 py-4">{log.action}</td>
                                    <td className="px-6 py-4">{log.details}</td>
                                    <td className="px-6 py-4">{log.ip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Logs;
