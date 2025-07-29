import React, { useEffect, useState, useRef } from 'react';
import { UserRole, EntityType } from '../types.js';
import * as sheetService from '../services/googleSheetService.js';
import { Icon } from '../components/Icon.js';
import { UserModal } from '../components/UserModal.js';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal.js';
import { EntityModal } from '../components/EntityModal.js';

function LogoUploadCard({ title, description, currentLogoUrl, onSave, isSaving }) {
    const [newLogoFile, setNewLogoFile] = useState(null);
    const [newLogoPreview, setNewLogoPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!newLogoFile) {
            setNewLogoPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(newLogoFile);
        setNewLogoPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [newLogoFile]);
    
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewLogoFile(e.target.files[0]);
        }
    };

    const handleCancel = () => {
        setNewLogoFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        if (!newLogoFile) return;
        try {
            await onSave(newLogoFile);
            setNewLogoFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        } catch(error) {
            alert(error.message); // Show file size error to user
        }
    };

    return (
        React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" },
            React.createElement('h3', { className: "text-lg font-bold text-gray-900 dark:text-white" }, title),
            React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400 mb-4" }, description),
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6 items-center" },
                React.createElement('div', null,
                    React.createElement('p', { className: "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" }, "Current"),
                    React.createElement('div', { className: "w-32 h-32 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50" },
                        currentLogoUrl ? React.createElement('img', { src: currentLogoUrl, alt: "Current logo", className: "max-w-full max-h-full object-contain" }) : React.createElement(Icon, { name: 'image', className: 'text-3xl text-gray-400' })
                    )
                ),
                React.createElement('div', null,
                     React.createElement('input', { type: "file", accept: "image/png, image/jpeg, image/svg+xml, image/gif", ref: fileInputRef, onChange: handleFileSelect, className: "hidden" }),
                     newLogoPreview ? (
                        React.createElement('div', null,
                             React.createElement('p', { className: "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" }, "New Preview"),
                            React.createElement('div', { className: "w-32 h-32 p-2 border border-dashed border-primary-500 rounded-lg flex items-center justify-center" },
                                React.createElement('img', { src: newLogoPreview, alt: "New logo preview", className: "max-w-full max-h-full object-contain" })
                            )
                        )
                     ) : (
                        React.createElement('button', { onClick: () => fileInputRef.current?.click(), className: "w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" },
                            React.createElement(Icon, { name: "upload", className: "text-2xl mb-2" }),
                            React.createElement('span', { className: "font-semibold" }, "Upload New"),
                            React.createElement('span', { className: "text-xs" }, "PNG, JPG, GIF or SVG (Max 35KB)")
                        )
                    )
                )
            ),
            newLogoPreview && (
                 React.createElement('div', { className: "flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700" },
                    React.createElement('button', { onClick: handleCancel, disabled: isSaving, className: "px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200" },
                        "Cancel"
                    ),
                    React.createElement('button', { onClick: handleSave, disabled: isSaving, className: "px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 w-32 disabled:bg-primary-300" },
                        isSaving ? React.createElement(Icon, { name: "spinner", className: "animate-spin" }) : 'Save Logo'
                    )
                )
            )
        )
    );
};

export function AdminConsolePage({ currentUser, settings, onSettingsUpdate }) {
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [entities, setEntities] = useState([]);
    const [isLoadingEntities, setIsLoadingEntities] = useState(true);
    const [isSavingAppLogo, setIsSavingAppLogo] = useState(false);
    const [isSavingCompanyLogo, setIsSavingCompanyLogo] = useState(false);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);
    
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [isDeleteEntityModalOpen, setIsDeleteEntityModalOpen] = useState(false);
    const [deletingEntityId, setDeletingEntityId] = useState(null);

    const fetchData = async () => {
        setIsLoadingUsers(true);
        setIsLoadingEntities(true);
        try {
            const [userData, entityData] = await Promise.all([
                sheetService.getUsers(),
                sheetService.getEntities()
            ]);
            setUsers(userData);
            setEntities(entityData);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            alert("Could not load admin data. Please check console for details.");
        } finally {
            setIsLoadingUsers(false);
            setIsLoadingEntities(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenUserModal = (user = null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (editingUser) {
                const updatedUser = await sheetService.updateUser(editingUser.id, userData, currentUser.name);
                setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
            } else {
                const newUser = await sheetService.addUser(userData, currentUser.name);
                setUsers([...users, newUser]);
            }
        } catch (error) {
            console.error("Failed to save user:", error);
            alert("Could not save user. " + error.message);
        }
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleDeleteUserClick = (userId) => {
        setDeletingUserId(userId);
        setIsDeleteUserModalOpen(true);
    };

    const confirmUserDelete = async () => {
        if (deletingUserId !== null) {
            await sheetService.deleteUser(deletingUserId, currentUser.name);
            setUsers(users.filter(u => u.id !== deletingUserId));
            setIsDeleteUserModalOpen(false);
            setDeletingUserId(null);
        }
    };

    const handleOpenEntityModal = (entity = null) => {
        setEditingEntity(entity);
        setIsEntityModalOpen(true);
    };

    const handleSaveEntity = async (entityData) => {
        try {
            if (editingEntity) {
                const updatedEntity = await sheetService.updateEntity(editingEntity.id, entityData, currentUser.name);
                setEntities(entities.map(e => e.id === editingEntity.id ? updatedEntity : e));
            } else {
                const newEntity = await sheetService.addEntity(entityData, currentUser.name);
                setEntities([...entities, newEntity].sort((a,b) => a.name.localeCompare(b.name)));
            }
        } catch (error) {
            console.error("Failed to save entity:", error);
            alert("Could not save entity. " + error.message);
        }
        setIsEntityModalOpen(false);
        setEditingEntity(null);
    };

    const handleDeleteEntityClick = (entityId) => {
        setDeletingEntityId(entityId);
        setIsDeleteEntityModalOpen(true);
    };
    
    const confirmEntityDelete = async () => {
        if (deletingEntityId !== null) {
            await sheetService.deleteEntity(deletingEntityId, currentUser.name);
            setEntities(entities.filter(e => e.id !== deletingEntityId));
            setIsDeleteEntityModalOpen(false);
            setDeletingEntityId(null);
        }
    };

    const handleSaveLogo = async (file, saveFunction, setIsSaving) => {
        setIsSaving(true);
        try {
            const newSettings = await saveFunction(file, currentUser.name);
            onSettingsUpdate(newSettings);
        } catch (error) {
            console.error("Failed to upload logo:", error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "space-y-8" },
                 React.createElement('div', { className: "prose prose-lg dark:prose-invert max-w-none" },
                    React.createElement('h1', null, "Admin Console"),
                    React.createElement('p', { className: "lead" },
                        "Manage users, entities, company branding, and system settings."
                    )
                ),
                
                React.createElement('div', null,
                     React.createElement('h2', { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Company Branding"),
                     React.createElement('div', { className: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
                        React.createElement(LogoUploadCard, {
                            title: "App Logo",
                            description: "Used in the sidebar. Recommended: Square, 1:1 ratio.",
                            currentLogoUrl: settings.appLogoUrl,
                            onSave: (file) => handleSaveLogo(file, sheetService.updateAppLogo, setIsSavingAppLogo),
                            isSaving: isSavingAppLogo
                        }),
                        React.createElement(LogoUploadCard, {
                            title: "Company Logo",
                            description: "Used in the header. Recommended: Rectangular, wide.",
                            currentLogoUrl: settings.companyLogoUrl,
                            onSave: (file) => handleSaveLogo(file, sheetService.updateCompanyLogo, setIsSavingCompanyLogo),
                            isSaving: isSavingCompanyLogo
                        })
                     )
                ),

                 React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" },
                    React.createElement('div', { className: "flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700" },
                        React.createElement('h2', { className: "text-xl font-bold text-gray-900 dark:text-white" }, "Supplier & Client Management"),
                        React.createElement('button', { onClick: () => handleOpenEntityModal(), className: "bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shadow-sm" },
                            React.createElement(Icon, { name: "plus" }),
                            "Add Entity"
                        )
                    ),
                    React.createElement('div', { className: "overflow-x-auto" },
                        isLoadingEntities ? (
                            React.createElement('div', { className: "text-center p-10" }, React.createElement(Icon, { name: "spinner", className: "animate-spin text-3xl text-primary-500" }))
                        ) : (
                            React.createElement('table', { className: "w-full" },
                                React.createElement('thead', { className: "bg-gray-50 dark:bg-gray-700/50" },
                                    React.createElement('tr', null,
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "Name"),
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "Type"),
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "Actions")
                                    )
                                ),
                                React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-gray-700" },
                                    entities.map(entity => (
                                        React.createElement('tr', { key: entity.id },
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" }, entity.name),
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap" },
                                                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    entity.type === EntityType.SUPPLIER
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' 
                                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                                                }` },
                                                    entity.type
                                                )
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-sm font-medium" },
                                                 React.createElement('div', { className: "flex gap-3" },
                                                    React.createElement('button', { onClick: () => handleOpenEntityModal(entity), className: "text-primary-500 hover:text-primary-700 transition-colors duration-200", title: "Edit" },
                                                        React.createElement(Icon, { name: "edit" })
                                                    ),
                                                    React.createElement('button', { onClick: () => handleDeleteEntityClick(entity.id), className: "text-red-500 hover:text-red-700 transition-colors duration-200", title: "Delete" },
                                                        React.createElement(Icon, { name: "trash" })
                                                    )
                                                )
                                            )
                                        )
                                    ))
                                )
                            )
                        )
                    )
                ),

                React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" },
                    React.createElement('div', { className: "flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700" },
                        React.createElement('h2', { className: "text-xl font-bold text-gray-900 dark:text-white" }, "User Management"),
                        React.createElement('button', { onClick: () => handleOpenUserModal(), className: "bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shadow-sm" },
                            React.createElement(Icon, { name: "plus" }),
                            "Add User"
                        )
                    ),
                    React.createElement('div', { className: "overflow-x-auto" },
                        isLoadingUsers ? (
                            React.createElement('div', { className: "text-center p-10" }, React.createElement(Icon, { name: "spinner", className: "animate-spin text-3xl text-primary-500" }))
                        ) : (
                            React.createElement('table', { className: "w-full" },
                                React.createElement('thead', { className: "bg-gray-50 dark:bg-gray-700/50" },
                                    React.createElement('tr', null,
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "User"),
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "Role"),
                                        React.createElement('th', { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, "Actions")
                                    )
                                ),
                                React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-gray-700" },
                                    users.map(user => (
                                        React.createElement('tr', { key: user.id },
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap" },
                                                React.createElement('div', { className: "flex items-center" },
                                                    React.createElement('div', { className: "w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-4 flex-shrink-0" },
                                                        user.imageUrl ? React.createElement('img', { src: user.imageUrl, alt: user.name, className: 'w-full h-full object-cover rounded-full' }) :
                                                        React.createElement('span', { className: "font-bold text-primary-600 dark:text-primary-300" }, user.name.charAt(0))
                                                        
                                                    ),
                                                    React.createElement('div', null,
                                                        React.createElement('div', { className: "text-sm font-medium text-gray-900 dark:text-white" }, user.name),
                                                        React.createElement('div', { className: "text-sm text-gray-500 dark:text-gray-400" }, user.email)
                                                    )
                                                )
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap" },
                                                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.role === UserRole.ADMIN 
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300' 
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                                                }` },
                                                    user.role
                                                )
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-sm font-medium" },
                                                 React.createElement('div', { className: "flex gap-3" },
                                                    React.createElement('button', { onClick: () => handleOpenUserModal(user), className: "text-primary-500 hover:text-primary-700 transition-colors duration-200", title: "Edit" }, React.createElement(Icon, {name: 'edit'})),
                                                    React.createElement('button', { onClick: () => handleDeleteUserClick(user.id), disabled: user.id === currentUser.id, className: "text-red-500 hover:text-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed", title: "Delete" },
                                                        React.createElement(Icon, { name: "trash" })
                                                    )
                                                )
                                            )
                                        )
                                    ))
                                )
                            )
                        )
                    )
                )
            ),
            React.createElement(UserModal, { isOpen: isUserModalOpen, onClose: () => setIsUserModalOpen(false), onSave: handleSaveUser, editingUser: editingUser }),
            React.createElement(DeleteConfirmationModal, { isOpen: isDeleteUserModalOpen, onClose: () => setIsDeleteUserModalOpen(false), onConfirm: confirmUserDelete, itemType: "user" }),
            React.createElement(EntityModal, { isOpen: isEntityModalOpen, onClose: () => setIsEntityModalOpen(false), onSave: handleSaveEntity, editingEntity: editingEntity }),
            React.createElement(DeleteConfirmationModal, { isOpen: isDeleteEntityModalOpen, onClose: () => setIsDeleteEntityModalOpen(false), onConfirm: confirmEntityDelete, itemType: "entity" })
        )
    );
};
