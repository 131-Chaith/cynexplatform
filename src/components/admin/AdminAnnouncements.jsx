import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Megaphone, Send, Edit2, Trash2, Calendar, Users, User, Bell, Clock, Trash, X, Plus } from 'lucide-react';
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)' }}>
                        Broadcasts & Announcements
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Send notifications to students or specific batches.</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }} style={{ borderRadius: '12px' }}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Create Announcement
                </Button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>Loading Announcements...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {announcements.map((ann) => (
                            <motion.div 
                                key={ann.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ 
                                            padding: '0.25rem 0.6rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.65rem', 
                                            fontWeight: '800',
                                            background: ann.status === 'published' ? '#DCFCE7' : '#FEF3C7',
                                            color: ann.status === 'published' ? '#16A34A' : '#D97706',
                                            textTransform: 'uppercase'
                                        }}>
                                            {ann.status}
                                        </div>
                                        <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={12} /> {new Date(ann.publish_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--text)', marginBottom: '0.75rem' }}>{ann.title}</h3>
                                    <p style={{ 
                                        color: 'var(--text-light)', 
                                        fontSize: '0.875rem', 
                                        flex: 1, 
                                        marginBottom: '1.5rem', 
                                        lineHeight: '1.6',
                                        maxHeight: '120px',
                                        overflowY: 'auto'
                                    }}>
                                        {ann.message}
                                    </p>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                                                {ann.target_type === 'all' && <><Users size={14} /> All Students</>}
                                                {ann.target_type === 'batch' && <><Users size={14} /> Batch: {batches.find(b => b.id == ann.target_id)?.batch_name || 'Unknown'}</>}
                                                {ann.target_type === 'individual' && <><User size={14} /> {students.find(s => s.id == ann.target_id)?.name || 'Direct'}</>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleEdit(ann)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: 'var(--light)', color: 'var(--text-light)', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(ann.id)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#FEF2F2', color: 'var(--danger)', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
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
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '540px', padding: '2rem', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
                                    {editingId ? 'Edit Announcement' : 'New Broadcast'}
                                </h2>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <Input label="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Important Schedule Update" />
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Message</label>
                                    <textarea 
                                        value={formData.message} 
                                        onChange={(e) => setFormData({...formData, message: e.target.value})} 
                                        required 
                                        rows={4}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--light)', fontSize: '0.9rem' }}
                                        placeholder="Enter announcement details..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Target</label>
                                        <select 
                                            value={formData.target_type} 
                                            onChange={(e) => setFormData({...formData, target_type: e.target.value, target_id: ''})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--light)' }}
                                        >
                                            <option value="all">All Students</option>
                                            <option value="batch">Specific Batch</option>
                                            <option value="individual">Individual Student</option>
                                        </select>
                                    </div>
                                    {formData.target_type !== 'all' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Select {formData.target_type === 'batch' ? 'Batch' : 'Student'}
                                            </label>
                                            <select 
                                                value={formData.target_id} 
                                                onChange={(e) => setFormData({...formData, target_id: e.target.value})}
                                                required
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--light)' }}
                                            >
                                                <option value="">-- Select --</option>
                                                {formData.target_type === 'batch' ? (
                                                    batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)
                                                ) : (
                                                    students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Publish Date</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.publish_at} 
                                            onChange={(e) => setFormData({...formData, publish_at: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--light)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Status</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--light)' }}
                                        >
                                            <option value="published">Published</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="draft">Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={submitting} style={{ borderRadius: '12px' }}>
                                        {editingId ? 'Update' : 'Post Announcement'}
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
