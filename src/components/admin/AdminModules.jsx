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
            const msg = error.response?.data?.message || error.message;
            alert("Failed to delete module: " + msg);
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
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ 
                        width: '100%', 
                        maxWidth: '550px', 
                        position: 'relative', 
                        backgroundColor: 'white',
                        borderRadius: '2.5rem',
                        padding: '3rem'
                    }}>
                        <button
                            onClick={() => { setShowModal(false); setEditingModule(null); }}
                            style={{ 
                                position: 'absolute', 
                                top: '2rem', 
                                right: '2rem', 
                                border: 'none', 
                                background: '#F1F5F9',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                cursor: 'pointer', 
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
                            onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}
                        >
                            <X size={24} />
                        </button>
                        <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.75rem', color: '#0F172A', letterSpacing: '-0.03em' }}>
                            {editingModule ? 'Edit Module' : 'Create Module'}
                        </h3>
                        <p style={{ color: '#64748B', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: '500' }}>
                            {editingModule ? 'Update the details for this reusable curriculum block.' : 'Define a new reusable curriculum block to attach to your courses.'}
                        </p>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module Title *</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g. Advanced SQL"
                                    style={{ width: '100%', padding: '1.1rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC' }}
                                />
                            </div>
                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What will students learn in this module?"
                                    style={{ width: '100%', padding: '1.1rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '120px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <Button type="submit" style={{ padding: '1.25rem', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem', marginTop: '1rem' }}>
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
