
import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser as deleteUserService } from '../services/googleSheetService';
import { User, UserRole, UserStatus } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAddUser = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if(window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUserService(userId);
                addToast("User deleted successfully", "success");
                fetchUsers();
            } catch (error) {
                addToast("Failed to delete user", "error");
            }
        }
    };

    const handleSaveUser = async (user: User) => {
        try {
            await saveUser(user);
            addToast(`User ${user.id ? 'updated' : 'created'} successfully`, 'success');
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            addToast("Failed to save user", "error");
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading Users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">User Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage system users and roles</p>
                </div>
                <button onClick={handleAddUser} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">
                    Add New User
                </button>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Action'].map(h =>
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4">{user.id}</td>
                                    <td className="px-6 py-4">{user.name}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-3">
                                        <button onClick={() => handleEditUser(user)} className="text-primary hover:text-secondary">Edit</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-danger hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={currentUser}
                onSave={handleSaveUser}
            />
        </div>
    );
};

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (user: User) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<User | Partial<User>>({});

    useEffect(() => {
        setFormData(user || {
            name: '', username: '', email: '', role: UserRole.Borrower, status: UserStatus.Active, password: ''
        });
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as User);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={formData.id || ''} />
                <div>
                    <label>Full Name</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required />
                </div>
                <div>
                    <label>Username</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required />
                </div>
                {!user && (
                    <div>
                        <label>Password</label>
                        <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md" required />
                    </div>
                )}
                <div>
                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md">
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-dark-border rounded-md">
                        {Object.values(UserStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium">Cancel</button>
                    <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default UserManagement;
