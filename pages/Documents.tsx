
import React from 'react';

const documents = [
    { title: 'Loan Agreement - L10045', category: 'Contract', size: '356 KB', date: 'June 15, 2023', type: 'pdf' },
    { title: 'ID Card - Maria Silva', category: 'ID Document', size: '1.2 MB', date: 'June 12, 2023', type: 'image' },
    { title: 'Income Statement - João Santos', category: 'Proof of Income', size: '245 KB', date: 'June 10, 2023', type: 'excel' },
];

const fileIcons: { [key: string]: string } = {
    pdf: 'fas fa-file-pdf text-red-500',
    image: 'fas fa-file-image text-blue-500',
    excel: 'fas fa-file-excel text-green-500',
    default: 'fas fa-file-alt text-gray-500',
};

const Documents: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Documents</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage and upload loan documents</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-secondary">
                    Upload New Document
                </button>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Search documents..." className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" />
                    <select className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md">
                        <option value="all">All Categories</option>
                        <option value="id">ID Documents</option>
                        <option value="proof">Proof of Income</option>
                        <option value="contract">Contracts</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                    <div key={doc.title} className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <i className={`${fileIcons[doc.type] || fileIcons.default} text-2xl mr-3`}></i>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.category} • {doc.size}</p>
                                </div>
                            </div>
                            <button className="text-gray-500 dark:text-gray-400"><i className="fas fa-ellipsis-v"></i></button>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <span>Uploaded: {doc.date}</span>
                            <div className="space-x-3">
                                <button className="hover:text-primary"><i className="fas fa-download"></i></button>
                                <button className="hover:text-primary"><i className="fas fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Documents;
