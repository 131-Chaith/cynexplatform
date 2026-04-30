import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Megaphone, Send, Edit2, Trash2, Calendar, Users, User, Bell, Clock, Trash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target_type: 'all',
        target_id: '',
        status: 'published',
        publish_at: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [annRes, batchRes, studRes] = await Promise.all([
                api.get('announcements'),
                api.get('batches'),
                api.get('admin/students')
            ]);
            setAnnouncements(annRes.data);
            setBatches(batchRes.data);
            setStudents(studRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`announcements/${editingId}`, formData);
            } else {
                await api.post('announcements', formData);
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            alert("Failed to save announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this announcement?")) return;
        try {
            await api.delete(`announcements/${id}`);
            fetchData();
        } catch (error) {
            alert("Failed to delete announcement");
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            target_type: 'all',
            target_id: '',
            status: 'published',
            publish_at: new Date().toISOString().slice(0, 16)
        });
    };

    const handleEdit = (ann) => {
        setEditingId(ann.id);
        setFormData({
            title: ann.title,
            message: ann.message,
            target_type: ann.target_type,
            target_id: ann.target_id || '',
            status: ann.status,
            publish_at: new Date(ann.publish_at).toISOString().slice(0, 16)
        });
        setShowModal(true);
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                        Announcements & Broadcasts
                    </h1>
                    <p style={{ color: '#64748b' }}>Manage system-wide notifications and scheduled broadcasts.</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>
                    <Megaphone size={18} style={{ marginRight: '0.5rem' }} /> Create Announcement
                </Button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Announcements...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    <AnimatePresence>
                        {announcements.map((ann) => (
                            <motion.div 
                                key={ann.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ 
                                            padding: '0.25rem 0.75rem', 
                                            borderRadius: '9999px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '600',
                                            background: ann.status === 'published' ? '#ecfdf5' : '#fef3c7',
                                            color: ann.status === 'published' ? '#059669' : '#d97706',
                                            textTransform: 'uppercase'
                                        }}>
                                            {ann.status}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={12} /> {new Date(ann.publish_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>{ann.title}</h3>
                                    <p style={{ 
                                        color: '#64748b', 
                                        fontSize: '0.9rem', 
                                        flex: 1, 
                                        marginBottom: '1.5rem', 
                                        lineHeight: '1.7',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        paddingRight: '0.5rem',
                                        scrollbarWidth: 'thin'
                                    }}>
                                        {ann.message}
                                    </p>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                                                {ann.target_type === 'all' && <><Users size={14} /> All Students</>}
                                                {ann.target_type === 'batch' && <><Users size={14} /> Batch: {batches.find(b => b.id == ann.target_id)?.batch_name || 'Unknown'}</>}
                                                {ann.target_type === 'individual' && <><User size={14} /> {students.find(s => s.id == ann.target_id)?.name || 'Direct'}</>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleEdit(ann)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(ann.id)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Post/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '600px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                    {editingId ? 'Edit Announcement' : 'Post New Broadcast'}
                                </h2>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <Input label="Announcement Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Campus Holiday Notice" />
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Message Content</label>
                                    <textarea 
                                        value={formData.message} 
                                        onChange={(e) => setFormData({...formData, message: e.target.value})} 
                                        required 
                                        rows={5}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem' }}
                                        placeholder="Detailed announcement details..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Target Audience</label>
                                        <select 
                                            value={formData.target_type} 
                                            onChange={(e) => setFormData({...formData, target_type: e.target.value, target_id: ''})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        >
                                            <option value="all">All Students</option>
                                            <option value="batch">Specific Batch</option>
                                            <option value="individual">Individual Student</option>
                                        </select>
                                    </div>
                                    {formData.target_type !== 'all' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                                                Select {formData.target_type === 'batch' ? 'Batch' : 'Student'}
                                            </label>
                                            <select 
                                                value={formData.target_id} 
                                                onChange={(e) => setFormData({...formData, target_id: e.target.value})}
                                                required
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                            >
                                                <option value="">-- Select --</option>
                                                {formData.target_type === 'batch' ? (
                                                    batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)
                                                ) : (
                                                    students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Publish Date/Time</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.publish_at} 
                                            onChange={(e) => setFormData({...formData, publish_at: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Initial Status</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        >
                                            <option value="published">Publish Now</option>
                                            <option value="scheduled">Schedule</option>
                                            <option value="draft">Save Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={submitting}>
                                        {editingId ? 'Update Broadcast' : 'Post Announcement'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAnnouncements;
