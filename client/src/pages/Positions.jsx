import React, { useEffect, useState } from 'react';
import api from '../api';
import { Briefcase, Plus, Trash2, Edit2, Search, RefreshCw, X, Save } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Positions() {
    const [positions, setPositions] = useState([]);
    const [filteredPositions, setFilteredPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchPositions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/positions');
            setPositions(res.data);
            setFilteredPositions(res.data);
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredPositions(positions);
        } else {
            setFilteredPositions(positions.filter(p =>
                (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
            ));
        }
    }, [searchQuery, positions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await api.put(`/api/positions/${editItem.id}`, formData);
            } else {
                await api.post('/api/positions', formData);
            }
            setFormData({ name: '', description: '' });
            setShowModal(false);
            setEditItem(null);
            fetchPositions();
        } catch (err) {
            alert('Failed to save position');
        }
    };

    const handleEdit = (pos) => {
        setEditItem(pos);
        setFormData({
            name: pos.name || '',
            description: pos.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirm({ type: 'single', id, count: 1 });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            if (deleteConfirm.type === 'single' && deleteConfirm.id) {
                await api.delete(`/api/positions/${deleteConfirm.id}`);
            } else if (deleteConfirm.type === 'bulk' && selectedIds.length > 0) {
                await Promise.all(selectedIds.map(id => api.delete(`/api/positions/${id}`)));
                setSelectedIds([]);
            }
            setDeleteConfirm(null);
            fetchPositions();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete');
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedIds.length === 0) {
            alert('Please select items to delete');
            return;
        }
        setDeleteConfirm({ type: 'bulk', id: null, count: selectedIds.length });
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setFormData({ name: '', description: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: '#1E293B', fontWeight: 600 }}>
                    <Briefcase className="text-purple-500" />
                    Positions
                </h1>
                <button
                    type="button"
                    onClick={() => { setShowModal(true); setFormData({ name: '', description: '' }); setEditItem(null); }}
                    className="btn-primary"
                >
                    <Plus size={16} />
                    Add Position
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 text-sm flex-wrap">
                <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={14} /> Delete
                </button>
                <button
                    type="button"
                    onClick={fetchPositions}
                    className="btn-secondary"
                >
                    <RefreshCw size={14} /> Refresh
                </button>

                <div className="ml-auto w-64 relative">
                    <input
                        type="text"
                        placeholder="Search positions..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                    <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <SkeletonLoader rows={8} columns={5} showHeader={true} />
            ) : (
            <div className="card-base overflow-hidden p-0">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="table-header w-8">
                                <input
                                    type="checkbox"
                                    onChange={(e) => setSelectedIds(e.target.checked ? filteredPositions.map(p => p.id) : [])}
                                    checked={filteredPositions.length > 0 && selectedIds.length === filteredPositions.length}
                                />
                            </th>
                            <th className="table-header">ID</th>
                            <th className="table-header">Position Name</th>
                            <th className="table-header">Description</th>
                            <th className="table-header text-center sticky-action">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPositions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center" style={{ color: '#64748B' }}>
                                    No positions found.
                                </td>
                            </tr>
                        ) : (
                            filteredPositions.map((pos) => (
                                <tr key={pos.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(pos.id)}
                                            onChange={() => toggleSelect(pos.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4" style={{ color: '#64748B' }}>#{pos.id}</td>
                                    <td className="px-6 py-4 font-semibold" style={{ color: '#1E293B', fontWeight: 600 }}>{pos.name}</td>
                                    <td className="px-6 py-4" style={{ color: '#475569' }}>{pos.description || '-'}</td>
                                    <td className="px-6 py-4 sticky-action">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(pos)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                style={{ transition: 'all 200ms cubic-bezier(0.25, 0.8, 0.25, 1)' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, pos.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                style={{ transition: 'all 200ms cubic-bezier(0.25, 0.8, 0.25, 1)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-white/50" style={{ borderRadius: '16px' }}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold" style={{ color: '#1E293B', fontWeight: 600 }}>
                                {editItem ? 'Edit Position' : 'Add Position'}
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Position Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., Software Engineer"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg resize-none"
                                    rows={3}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-secondary rounded-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    {editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-white/50" style={{ borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4" style={{ color: '#1E293B', fontWeight: 600 }}>Confirm Delete</h3>
                            <p className="text-gray-600 mb-6">
                                {deleteConfirm.type === 'single'
                                    ? 'Are you sure you want to delete this position? This action cannot be undone.'
                                    : `Are you sure you want to delete ${deleteConfirm.count} selected position(s)? This action cannot be undone.`
                                }
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
