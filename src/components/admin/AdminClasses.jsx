import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Video, Plus, Trash2, X, PlayCircle, Calendar, AlertCircle, User, Layers, Tag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminClasses = () => {
    const { data } = useData();
    const { courses = [] } = data;
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [classes, setClasses] = useState([]);
    const [modules, setModules] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({ 
        title: '', 
        video_url: '', 
        schedule: '',
        module_id: '',
        topic: '',
        instructor_name: ''
    });

    useEffect(() => {
        if (selectedCourseId) {
            fetchClasses();
            fetchModules();
        } else {
            setClasses([]);
            setModules([]);
        }
    }, [selectedCourseId]);

    const fetchClasses = async () => {
        setLoadingClasses(true);
        setError('');
        try {
            const res = await api.get(`/courses/${selectedCourseId}/classes`);
            setClasses(res.data);
        } catch (e) {
            setError('Failed to load classes');
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchModules = async () => {
        try {
            const res = await api.get(`/courses/${selectedCourseId}/modules`);
            setModules(res.data);
        } catch (e) {
            console.error('Failed to load modules');
        }
    };

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.video_url.trim() || !formData.schedule) {
            return setError('Please fill all required fields (*).');
        }
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/courses/${selectedCourseId}/classes`, formData);
            setSuccess('Class added successfully!');
            setIsModalOpen(false);
            setFormData({ 
                title: '', 
                video_url: '', 
                schedule: '',
                module_id: '',
                topic: '',
                instructor_name: ''
            });
            fetchClasses();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            setError('Failed to add class: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (classId) => {
        if (!window.confirm('Delete this class?')) return;
        setDeleteId(classId);
        try {
            await api.delete(`/courses/${selectedCourseId}/classes/${classId}`);
            setClasses(prev => prev.filter(c => c.id !== classId));
            setSuccess('Class removed.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError('Failed to delete class.');
        } finally {
            setDeleteId(null);
        }
    };

    const getYoutubeId = url => {
        if (!url) return null;
        const m = url.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return m && m[2].length === 11 ? m[2] : null;
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)' }}>Session Management</h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Schedule and manage video classes for courses.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        style={{
                            padding: '0.75rem', borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.85rem', fontWeight: '700',
                            color: 'var(--text)', backgroundColor: 'white',
                            minWidth: '220px'
                        }}
                    >
                        <option value="">-- Select Course --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <Button
                        onClick={() => { setError(''); setIsModalOpen(true); }}
                        disabled={!selectedCourseId}
                        style={{ borderRadius: '12px' }}
                    >
                        <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Session
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: 'var(--danger)', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                        <AlertCircle size={16} /> {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '0.75rem 1rem', backgroundColor: '#DCFCE7', color: '#16A34A', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                        ✅ {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            {!selectedCourseId ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'white', borderRadius: '1.5rem', border: '1px dashed var(--border-color)' }}>
                    <Video size={48} color="var(--text-light)" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                    <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontWeight: '800' }}>No Course Selected</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Choose a course from the dropdown to manage its sessions.</p>
                </div>
            ) : loadingClasses ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>Loading sessions...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {classes.map(cls => (
                        <Card key={cls.id} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ position: 'relative', height: '170px', backgroundColor: '#0F172A' }}>
                                {getYoutubeId(cls.video_url) ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${getYoutubeId(cls.video_url)}/hqdefault.jpg`}
                                        alt={cls.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PlayCircle size={40} color="white" />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
                                <button
                                    onClick={() => handleDelete(cls.id)}
                                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', zIndex: 10 }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <User size={12} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{cls.instructor_name || 'Administrator'}</span>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem' }}>
                                <h4 style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem', marginBottom: '0.5rem' }}>{cls.title}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {cls.topic && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            <Tag size={12} /> <span>{cls.topic}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                        <Calendar size={12} /> <span>{new Date(cls.schedule).toLocaleString()}</span>
                                    </div>
                                </div>
                                <a href={cls.video_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800' }}>
                                    <PlayCircle size={14} /> Play Video
                                </a>
                            </div>
                        </Card>
                    ))}
                    {classes.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'var(--light)', borderRadius: '1.25rem', border: '1px dashed var(--border-color)' }}>
                            <p style={{ color: 'var(--text-light)', fontWeight: '600' }}>No sessions scheduled for this course yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Session Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '580px', padding: '2rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--light)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}>
                                <X size={20} color="var(--text-light)" />
                            </button>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '1.5rem' }}>Schedule New Session</h3>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <Input label="Session Title *" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Introduction to React" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-light)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Module</label>
                                        <select name="module_id" value={formData.module_id} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--light)' }}>
                                            <option value="">None</option>
                                            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Topic" name="topic" value={formData.topic} onChange={handleChange} placeholder="Specific focus" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input label="Instructor" name="instructor_name" value={formData.instructor_name} onChange={handleChange} placeholder="Name" />
                                    <Input label="Schedule *" name="schedule" type="datetime-local" value={formData.schedule} onChange={handleChange} required />
                                </div>
                                <Input label="YouTube URL *" name="video_url" value={formData.video_url} onChange={handleChange} required placeholder="https://..." />
                                
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={submitting} style={{ borderRadius: '10px' }}>Schedule Session</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminClasses;
