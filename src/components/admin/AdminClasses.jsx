import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Video, Plus, Trash2, X, PlayCircle, Calendar, AlertCircle, User, Layers, Tag } from 'lucide-react';

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

    // Fetch classes and modules when course selection changes
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
        if (!window.confirm('Delete this class? Students will no longer see it.')) return;
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)' }}>Manage Classes</h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Add class sessions (videos) to courses. Enrolled students will see them in their Classes page.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)', fontSize: '0.875rem',
                            color: 'var(--text)', backgroundColor: 'white', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <Button onClick={() => { setError(''); setIsModalOpen(true); }} disabled={!selectedCourseId}>
                        <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Class
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#DCFCE7', color: '#16A34A', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: '500' }}>
                    ✅ {success}
                </div>
            )}

            {/* Content Area */}
            {!selectedCourseId ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <Video size={48} color="var(--gray)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Select a Course</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Choose a course from the dropdown above to view and manage its classes.</p>
                </div>
            ) : loadingClasses ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading classes...</div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)' }}>
                            {courses.find(c => String(c.id) === String(selectedCourseId))?.title}
                        </h3>
                        <span style={{
                            padding: '0.2rem 0.7rem', backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600'
                        }}>
                            {classes.length} classes
                        </span>
                    </div>

                    {classes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px dashed var(--border-color)' }}>
                            <PlayCircle size={40} color="var(--gray)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
                            <p style={{ color: 'var(--text-light)' }}>No classes added yet. Click "Add Class" to get started.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
                            {classes.map(cls => (
                                <Card key={cls.id} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ position: 'relative', height: '180px', backgroundColor: '#111', overflow: 'hidden' }}>
                                        {getYoutubeId(cls.video_url) ? (
                                            <img
                                                src={`https://img.youtube.com/vi/${getYoutubeId(cls.video_url)}/hqdefault.jpg`}
                                                alt={cls.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e7ff' }}>
                                                <PlayCircle size={40} color="#4F46E5" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDelete(cls.id)}
                                            disabled={deleteId === cls.id}
                                            style={{
                                                position: 'absolute', top: '0.5rem', right: '0.5rem',
                                                backgroundColor: 'rgba(239,68,68,0.9)', color: 'white',
                                                border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                                                padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 2
                                            }}
                                            title="Delete this class"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: '600' }}>
                                            {cls.instructor_name || 'No Instructor'}
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.25rem', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h4 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem', lineHeight: '1.4' }}>{cls.title}</h4>
                                        </div>
                                        
                                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                            {cls.topic && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text)', marginBottom: '0.4rem' }}>
                                                    <Tag size={12} color="var(--primary)" />
                                                    <span style={{ fontWeight: '600' }}>Topic:</span> {cls.topic}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                <Calendar size={12} />
                                                <span>{cls.schedule ? new Date(cls.schedule).toLocaleString() : 'No schedule set'}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {cls.video_url && (
                                                <a
                                                    href={cls.video_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}
                                                >
                                                    <PlayCircle size={14} /> View Class
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Add Class Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <Card style={{ width: '100%', maxWidth: '600px', margin: '1rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text)' }}>Add New Class</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Fill in the details to schedule a new class session.
                        </p>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Class Title *</label>
                                    <input
                                        name="title" value={formData.title} onChange={handleChange} required
                                        placeholder="e.g. Introduction to React Hooks"
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Module</label>
                                    <select
                                        name="module_id" value={formData.module_id} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                                    >
                                        <option value="">Select Module (Optional)</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Topic</label>
                                    <input
                                        name="topic" value={formData.topic} onChange={handleChange}
                                        placeholder="e.g. useEffect & useState"
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Instructor Name</label>
                                    <input
                                        name="instructor_name" value={formData.instructor_name} onChange={handleChange}
                                        placeholder="e.g. Sharath"
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Schedule *</label>
                                    <input
                                        name="schedule" type="datetime-local" value={formData.schedule} onChange={handleChange} required
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>YouTube Video URL *</label>
                                    <input
                                        name="video_url" value={formData.video_url} onChange={handleChange} required
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    {formData.video_url && getYoutubeId(formData.video_url) && (
                                        <div style={{ marginTop: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <img
                                                src={`https://img.youtube.com/vi/${getYoutubeId(formData.video_url)}/mqdefault.jpg`}
                                                alt="Preview"
                                                style={{ width: '100%', maxHeight: '140px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} style={{
                                    padding: '0.625rem 1.75rem', backgroundColor: 'var(--primary)', color: 'white',
                                    border: 'none', borderRadius: '0.5rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontWeight: '700', fontSize: '0.875rem', opacity: submitting ? 0.7 : 1,
                                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                }}>
                                    {submitting ? 'Adding...' : 'Add Class Session'}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminClasses;
