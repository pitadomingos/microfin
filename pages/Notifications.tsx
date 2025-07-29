
import React from 'react';

const settings = [
    { title: 'Loan Application Updates', description: 'Notify when loan status changes', checked: [true, true, true] },
    { title: 'Payment Reminders', description: 'Send reminders before due dates', checked: [true, true, true] },
    { title: 'Late Payment Alerts', description: 'Alert when payments are overdue', checked: [true, true, true] },
    { title: 'New Document Uploads', description: 'Notify about new document submissions', checked: [true, false, true] },
];

const recentNotifications = [
    { title: 'Loan Approved', text: 'Loan #L10045 for Maria Silva has been approved.', time: '2 hours ago', icon: 'fa-check-circle', color: 'blue' },
    { title: 'Payment Due Soon', text: 'João Santos has a payment due in 2 days.', time: '5 hours ago', icon: 'fa-exclamation-circle', color: 'yellow' },
    { title: 'Late Payment', text: 'Carlos Moreira has missed a payment. 1% penalty applied.', time: '1 day ago', icon: 'fa-times-circle', color: 'red' },
];

const iconColors: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300',
}

const Notifications: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage system and WhatsApp notifications</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
                    <h3 className="font-bold">Notification Settings</h3>
                    <button className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-secondary text-sm">Save Changes</button>
                </div>
                <div className="p-4 space-y-4">
                    {settings.map(setting => (
                        <div key={setting.title} className="flex justify-between items-center py-2">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{setting.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {['System', 'WhatsApp', 'Email'].map((label, i) => (
                                    <label key={label} className="inline-flex items-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" defaultChecked={setting.checked[i]} />
                                        <span className="ml-2 text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border"><h3 className="font-bold">Recent Notifications</h3></div>
                <div className="divide-y divide-gray-200 dark:divide-dark-border">
                    {recentNotifications.map(n => (
                        <div key={n.title} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-start">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${iconColors[n.color]}`}><i className={`fas ${n.icon}`}></i></div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className="font-medium">{n.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{n.text}</p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{n.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
