import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';

const AdminModules = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    const [editingModule, setEditingModule] = useState(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const res = await api.get('/modules');
            setModules(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch modules", error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await api.put(`/modules/${editingModule.id}`, formData);
                alert("Module Updated Successfully!");
            } else {
                await api.post('/modules', formData);
                alert("Module Added Successfully!");
            }
            setShowModal(false);
            setEditingModule(null);
            setFormData({ title: '', description: '' });
            fetchModules();
        } catch (error) {
            console.error("Error adding/updating module:", error);
            const msg = error.response?.data?.message || error.message || "Failed to save module";
            alert(`Error: ${msg}`);
        }
    };

    const handleEdit = (module) => {
        setEditingModule(module);
        setFormData({ title: module.title, description: module.description || '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this module? This may affect courses using it.")) return;
        try {
            await api.delete(`/modules/${id}`);
            alert("Module Deleted Successfully!");
            fetchModules();
        } catch (error) {
            alert("Failed to delete module");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)' }}>Global Modules Library</h2>
                    <p style={{ color: 'var(--text-light)' }}>Create reusable modules (e.g., SQL, Python) to attach to courses.</p>
                </div>
                <Button onClick={() => { setEditingModule(null); setFormData({ title: '', description: '' }); setShowModal(true); }}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> Create New Module
                </Button>
            </div>

            {loading ? <p>Loading modules...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {modules.map(module => (
                        <Card key={module.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', color: '#1d4ed8' }}>
                                    <Layers size={24} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(module)}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '0.25rem' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(module.id)}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>{module.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '40px' }}>{module.description || 'No description available.'}</p>
                        </Card>
                    ))}
                    {modules.length === 0 && <p style={{ color: 'var(--text-light)' }}>No modules found. Create one to get started.</p>}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                        <button
                            onClick={() => { setShowModal(false); setEditingModule(null); }}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {editingModule ? 'Edit Module' : 'Create Module'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Module Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. Advanced SQL"
                            />
                            <Input
                                label="Description"
                                textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What will students learn in this module?"
                            />
                            <Button type="submit" style={{ marginTop: '1rem' }}>
                                {editingModule ? 'Update Module' : 'Create Module'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminModules;
