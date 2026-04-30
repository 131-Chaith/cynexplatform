import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { BookOpen, Plus, Edit2, Trash2, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [availableModules, setAvailableModules] = useState([]); // Global modules
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Manage Modules Modal State (View Only for now, or Link new ones)
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [activeCourse, setActiveCourse] = useState(null);
    const [courseModules, setCourseModules] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '',
        module_ids: [] // Array of selected Module IDs
    });

    const [editingCourse, setEditingCourse] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, modulesRes] = await Promise.all([
                api.get('courses'),
                api.get('modules')
            ]);
            setCourses(coursesRes.data);
            setAvailableModules(modulesRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setLoading(false);
        }
    };

    // --- Create/Update Course Logic ---

    const handleModuleSelect = (e) => {
        const moduleId = Number(e.target.value);
        if (!moduleId) return;

        if (!formData.module_ids.includes(moduleId)) {
            setFormData({
                ...formData,
                module_ids: [...formData.module_ids, moduleId]
            });
        }
    };

    const removeModule = (moduleId) => {
        setFormData({
            ...formData,
            module_ids: formData.module_ids.filter(id => id !== moduleId)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await api.put(`/courses/${editingCourse.id}`, formData);
            } else {
                await api.post('/courses', formData);
            }
            setShowModal(false);
            setEditingCourse(null);
            setFormData({ title: '', description: '', duration: '', module_ids: [] });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save course");
        }
    };

    const handleEdit = async (course) => {
        setEditingCourse(course);
        // Fetch current linked modules for this course
        try {
            const res = await api.get(`/courses/${course.id}/modules`);
            const linkedIds = res.data.map(m => m.id);
            setFormData({
                title: course.title,
                description: course.description || '',
                duration: course.duration || '',
                module_ids: linkedIds
            });
            setShowModal(true);
        } catch (error) {
            console.error("Failed to fetch course modules", error);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm("Are you sure you want to delete this course?")) return;
        try {
            await api.delete(`/courses/${courseId}`);
            fetchData();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    // --- Manage Modules Logic ---

    const handleOpenModules = async (course) => {
        setActiveCourse(course);
        setShowModulesModal(true);
        try {
            const res = await api.get(`/courses/${course.id}/modules`);
            setCourseModules(res.data);
        } catch (error) {
            console.error("Failed to fetch modules", error);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <motion.h2 variants={item} style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.25rem' }}>Curriculum Architect</motion.h2>
                    <motion.p variants={item} style={{ color: '#64748B' }}>Design and distribute elite educational programs.</motion.p>
                </div>
                <motion.div variants={item}>
                    <Button 
                        onClick={() => { setEditingCourse(null); setFormData({ title: '', description: '', duration: '', module_ids: [] }); setShowModal(true); }}
                        style={{ borderRadius: '0.75rem', padding: '0.75rem 1.5rem', background: 'var(--primary-gradient)' }}
                    >
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Digital Course
                    </Button>
                </motion.div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                </div>
            ) : (
                <motion.div 
                    variants={container} 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                        gap: '2.5rem',
                        perspective: '1200px'
                    }}
                >
                    {courses.map((course, i) => (
                        <motion.div 
                            key={course.id} 
                            variants={item}
                            whileHover={{ scale: 1.05, rotateX: -5, rotateY: 3, z: 30 }}
                            style={{ 
                                background: 'linear-gradient(145deg, #0f172a, #111827)', 
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                borderRadius: '1.75rem',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '360px',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {/* Holographic Header */}
                            <div style={{ 
                                height: '140px', 
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderBottom: '1px solid rgba(56, 189, 248, 0.1)'
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #38bdf8, #c084fc)' }} />
                                <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                                
                                <div style={{ zIndex: 1, color: '#38bdf8', filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))', transform: 'translateZ(50px)' }}>
                                    <BookOpen size={56} />
                                </div>
                                
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '1.25rem', 
                                    right: '1.25rem', 
                                    display: 'flex', 
                                    gap: '0.6rem',
                                    zIndex: 2,
                                    transform: 'translateZ(30px)'
                                }}>
                                    <button 
                                        onClick={() => handleEdit(course)}
                                        style={{ border: 'none', background: 'rgba(255,255,255,0.05)', height: '32px', width: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(course.id)}
                                        style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', height: '32px', width: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', transform: 'translateZ(20px)' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f8fafc', marginBottom: '0.75rem', lineHeight: '1.3', letterSpacing: '-0.02em' }}>
                                    {course.title}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem', flex: 1, lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontWeight: '500' }}>
                                    {course.description || 'Deep architectural systems for digital personnel enhancement.'}
                                </p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Clock size={16} /> {course.duration || 'Flexible'}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        style={{ borderRadius: '10px', fontSize: '0.7rem', fontWeight: '900', padding: '0.4rem 1rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                                        onClick={() => handleOpenModules(course)}
                                    >
                                        STRUCTURE
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {courses.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '2rem', border: '2px dashed rgba(255,255,255,0.05)' }}>
                            <BookOpen size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                            <p style={{ color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>No curriculum architecture detected.</p>
                        </div>
                    )}
                </motion.div>
            )}

            <AnimatePresence>
                {/* Add Course Modal */}
                {showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                            backdropFilter: 'blur(12px)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            zIndex: 1000
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{ width: '100%', maxWidth: '550px' }}
                        >
                            <Card style={{ 
                                position: 'relative', 
                                maxHeight: '90vh', 
                                overflowY: 'auto', 
                                padding: '2.5rem', 
                                borderRadius: '2.5rem',
                                backgroundColor: '#ffffff',
                                border: 'none',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}>
                                <button
                                    onClick={() => { setShowModal(false); setEditingCourse(null); }}
                                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                >
                                    <X size={24} />
                                </button>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: '900', marginBottom: '0.5rem', color: '#0F172A', letterSpacing: '-0.025em' }}>
                                    {editingCourse ? 'Update Prototype' : 'New Program Initialization'}
                                </h3>
                                <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '1rem', fontWeight: '500' }}>Configure the parameters for this educational asset.</p>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <Input
                                        label="Designation (Title)"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g. Quantum Computing Masterclass"
                                    />
                                    <Input
                                        label="Program Brief"
                                        textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        placeholder="Outline the core objectives..."
                                    />
                                    <Input
                                        label="Temporal Duration"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="e.g. 14 Lunar Cycles / 12 Weeks"
                                    />

                                    {/* Modules Section */}
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                                            Core Modules Integration
                                        </label>

                                        <div style={{
                                            border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1rem',
                                            display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#F8FAFC'
                                        }}>
                                            {/* Selected Tags */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {formData.module_ids.map(id => {
                                                    const module = availableModules.find(m => m.id === id);
                                                    if (!module) return null;
                                                    return (
                                                        <motion.div 
                                                            key={id}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                backgroundColor: 'white', color: 'var(--primary)',
                                                                border: '1px solid #E2E8F0',
                                                                padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                                fontSize: '0.8rem', fontWeight: '800',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                            }}
                                                        >
                                                            <span>{module.title}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeModule(id)}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 0 }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                                {formData.module_ids.length === 0 && <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic' }}>No systems integrated.</span>}
                                            </div>

                                            <select
                                                onChange={handleModuleSelect}
                                                value=""
                                                style={{
                                                    width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
                                                    border: '1px solid #E2E8F0', fontSize: '0.875rem', outline: 'none',
                                                    cursor: 'pointer', backgroundColor: 'white', fontWeight: '600', color: '#475569'
                                                }}
                                            >
                                                <option value="">+ Integrate Module Segment</option>
                                                {availableModules
                                                    .filter(m => !formData.module_ids.includes(m.id))
                                                    .map(m => (
                                                        <option key={m.id} value={m.id}>{m.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <Button type="submit" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '1rem', background: 'var(--primary-gradient)' }}>
                                        {editingCourse ? 'Commit Changes' : 'Initialize Prototype'}
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}

                {/* View Course Modules Modal */}
                {showModulesModal && activeCourse && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                            backdropFilter: 'blur(12px)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            zIndex: 1000
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{ width: '100%', maxWidth: '500px' }}
                        >
                            <Card style={{ 
                                position: 'relative', 
                                padding: '2.5rem', 
                                borderRadius: '2.5rem',
                                backgroundColor: '#ffffff',
                                border: 'none',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}>
                                <button
                                    onClick={() => setShowModulesModal(false)}
                                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                >
                                    <X size={24} />
                                </button>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: '900', marginBottom: '0.5rem', color: '#0F172A', letterSpacing: '-0.025em' }}>System Architecture</h3>
                                <p style={{ color: 'var(--primary)', marginBottom: '2rem', fontWeight: '700' }}>{activeCourse.title}</p>


                                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {courseModules.map((mod, idx) => (
                                        <motion.div 
                                            key={mod.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                padding: '1.25rem', borderRadius: '1rem', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '1rem'
                                            }}
                                        >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                {idx + 1}
                                            </div>
                                            <span style={{ fontWeight: '700', color: '#334155' }}>{mod.title}</span>
                                        </motion.div>
                                    ))}
                                    {courseModules.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: '1rem' }}>
                                            No modules linked to this system.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
};

export default AdminCourses;
