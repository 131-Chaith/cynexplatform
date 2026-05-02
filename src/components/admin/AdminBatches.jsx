import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Users, BookOpen, Plus, Calendar, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminBatches = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ batch_name: '', start_date: '', end_date: '' });

    const [editingBatch, setEditingBatch] = useState(null);

    // Data for assignments
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);

    // Assignment modals
    const [assignStudentsModal, setAssignStudentsModal] = useState({ isOpen: false, batchId: null, batchName: '' });
    const [assignCoursesModal, setAssignCoursesModal] = useState({ isOpen: false, batchId: null, batchName: '' });
    
    // Viewing modals
    const [viewStudentsModal, setViewStudentsModal] = useState({ isOpen: false, batchId: null, batchName: '' });
    const [viewCoursesModal, setViewCoursesModal] = useState({ isOpen: false, batchId: null, batchName: '' });
    
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);

    // Currently assigned items (for display)
    const [currentBatchStudents, setCurrentBatchStudents] = useState([]);
    const [currentBatchCourses, setCurrentBatchCourses] = useState([]);

    // Batch stats (student and course counts)
    const [batchStats, setBatchStats] = useState({});

    useEffect(() => {
        fetchBatches();
        fetchStudentsAndCourses();
    }, []);

    useEffect(() => {
        // Fetch stats for all batches
        if (batches.length > 0) {
            batches.forEach(batch => {
                fetchBatchStats(batch.id);
            });
        }
    }, [batches]);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/batches');
            setBatches(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch batches", error);
            setLoading(false);
        }
    };

    const fetchStudentsAndCourses = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                api.get('/admin/students'),
                api.get('/courses')
            ]);
            setStudents(studentsRes.data);
            setCourses(coursesRes.data);
        } catch (error) {
            console.error("Failed to fetch students/courses", error);
        }
    };

    const fetchBatchStats = async (batchId) => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                api.get(`/batches/${batchId}/students`),
                api.get(`/batches/${batchId}/courses`)
            ]);
            setBatchStats(prev => ({
                ...prev,
                [batchId]: {
                    studentCount: studentsRes.data.length,
                    courseCount: coursesRes.data.length
                }
            }));
        } catch (error) {
            console.error(`Failed to fetch stats for batch ${batchId}`, error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatch) {
                await api.put(`/batches/${editingBatch.id}`, formData);
                alert("Batch Updated Successfully!");
            } else {
                await api.post('/batches', formData);
                alert("Batch Created Successfully!");
            }
            fetchBatches(); // Refresh
            setShowModal(false);
            setEditingBatch(null);
            setFormData({ batch_name: '', start_date: '', end_date: '' });
        } catch (error) {
            alert(editingBatch ? "Failed to update batch" : "Failed to create batch");
        }
    };

    const handleEdit = (batch) => {
        setEditingBatch(batch);
        // Format dates for input type="date"
        const start = batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : '';
        const end = batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : '';

        setFormData({
            batch_name: batch.batch_name,
            start_date: start,
            end_date: end
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this batch?")) return;
        try {
            await api.delete(`/batches/${id}`);
            alert("Batch Deleted Successfully!");
            fetchBatches();
        } catch (error) {
            alert("Failed to delete batch");
        }
    };

    // Assignment Handlers
    const handleOpenAssignStudents = async (batch) => {
        setAssignStudentsModal({ isOpen: true, batchId: batch.id, batchName: batch.batch_name });
        // Fetch students already in this batch
        try {
            const res = await api.get(`/batches/${batch.id}/students`);
            setCurrentBatchStudents(res.data);
            const assignedIds = res.data.map(s => s.id);
            setSelectedStudents(assignedIds);
        } catch (error) {
            console.error("Failed to fetch assigned students", error);
            setCurrentBatchStudents([]);
            setSelectedStudents([]);
        }
    };

    const handleAssignStudents = async () => {
        try {
            await api.post(`/batches/${assignStudentsModal.batchId}/students`, {
                student_ids: selectedStudents
            });
            alert("Students assigned successfully!");
            setAssignStudentsModal({ isOpen: false, batchId: null, batchName: '' });
            setSelectedStudents([]);
            setCurrentBatchStudents([]);
            // Refresh batch stats
            fetchBatchStats(assignStudentsModal.batchId);
        } catch (error) {
            alert("Failed to assign students");
        }
    };

    const handleOpenAssignCourses = async (batch) => {
        setAssignCoursesModal({ isOpen: true, batchId: batch.id, batchName: batch.batch_name });
        // Fetch courses already assigned to this batch
        try {
            const res = await api.get(`/batches/${batch.id}/courses`);
            setCurrentBatchCourses(res.data);
            const assignedIds = res.data.map(c => c.id);
            setSelectedCourses(assignedIds);
        } catch (error) {
            console.error("Failed to fetch assigned courses", error);
            setCurrentBatchCourses([]);
            setSelectedCourses([]);
        }
    };

    const handleAssignCourses = async () => {
        try {
            // Assign each selected course
            for (const courseId of selectedCourses) {
                try {
                    await api.post(`/batches/${assignCoursesModal.batchId}/courses`, {
                        course_id: courseId
                    });
                } catch (err) {
                    // Ignore if already assigned
                }
            }
            alert("Courses assigned successfully!");
            setAssignCoursesModal({ isOpen: false, batchId: null, batchName: '' });
            setSelectedCourses([]);
            setCurrentBatchCourses([]);
            // Refresh batch stats
            fetchBatchStats(assignCoursesModal.batchId);
        } catch (error) {
            alert("Failed to assign courses");
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleCourseSelection = (courseId) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const handleOpenViewStudents = async (batch) => {
        setViewStudentsModal({ isOpen: true, batchId: batch.id, batchName: batch.batch_name });
        try {
            const res = await api.get(`/batches/${batch.id}/students`);
            setCurrentBatchStudents(res.data);
        } catch (error) {
            console.error("Failed to fetch batch students", error);
        }
    };

    const handleOpenViewCourses = async (batch) => {
        setViewCoursesModal({ isOpen: true, batchId: batch.id, batchName: batch.batch_name });
        try {
            const res = await api.get(`/batches/${batch.id}/courses`);
            setCurrentBatchCourses(res.data);
        } catch (error) {
            console.error("Failed to fetch batch courses", error);
        }
    };

    return (
        <div style={{ padding: '2rem', background: '#0F172A', minHeight: '100vh', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ 
                        fontSize: '2.25rem', 
                        fontWeight: '900', 
                        color: '#f8fafc', 
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em',
                        textShadow: '0 0 30px rgba(56, 189, 248, 0.3)'
                    }}>
                        Batch Management
                    </h1>
                    <p style={{ color: '#94a3b8', fontWeight: '600', fontSize: '1rem' }}>
                        Strategic deployment and squadron synchronization.
                    </p>
                </div>
                <Button onClick={() => { setEditingBatch(null); setFormData({ batch_name: '', start_date: '', end_date: '' }); setShowModal(true); }}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> Create Batch
                </Button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {batches.map(batch => {
                        const stats = batchStats[batch.id] || { studentCount: 0, courseCount: 0 };
                        return (
                            <Card key={batch.id} style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem', color: '#4f46e5' }}>
                                        <Users size={24} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
                                        <motion.button
                                            whileHover={{ scale: 1.2, color: '#4f46e5' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(batch); }}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                                            title="Edit Batch"
                                        >
                                            <Edit2 size={18} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.2, backgroundColor: '#fee2e2' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                                            title="Delete Batch"
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f8fafc', marginBottom: '0.75rem', letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                                    {batch.batch_name}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#bae6fd', fontWeight: '700' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Calendar size={16} color="#38bdf8" /> 
                                        <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Activation:</span> 
                                        {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Calendar size={16} color="#fb7185" /> 
                                        <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Termination:</span> 
                                        {batch.end_date ? new Date(batch.end_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>

                                {/* Stats Display - CLICKABLE */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1.25rem',
                                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))',
                                    borderRadius: '1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    gap: '1rem',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)'
                                }}>
                                    <motion.div 
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleOpenViewStudents(batch)}
                                        style={{ textAlign: 'center', cursor: 'pointer', flex: 1 }}
                                    >
                                        <div style={{ 
                                            fontSize: '2rem', 
                                            fontWeight: '900', 
                                            color: '#38bdf8', 
                                            textShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
                                            lineHeight: '1'
                                        }}>
                                            {stats.studentCount}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.75rem', 
                                            color: '#f8fafc', 
                                            fontWeight: '900', 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.1em', 
                                            marginTop: '0.5rem',
                                            opacity: 0.9
                                        }}>
                                            Operatives
                                        </div>
                                    </motion.div>
                                    <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '100%' }}></div>
                                    <motion.div 
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleOpenViewCourses(batch)}
                                        style={{ textAlign: 'center', cursor: 'pointer', flex: 1 }}
                                    >
                                        <div style={{ 
                                            fontSize: '2rem', 
                                            fontWeight: '900', 
                                            color: '#fb923c', 
                                            textShadow: '0 0 20px rgba(251, 146, 60, 0.5)',
                                            lineHeight: '1'
                                        }}>
                                            {stats.courseCount}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.75rem', 
                                            color: '#f8fafc', 
                                            fontWeight: '900', 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.1em', 
                                            marginTop: '0.5rem',
                                            opacity: 0.9
                                        }}>
                                            Modules
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Custom Control Buttons */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <Button 
                                        size="small" 
                                        variant="outline" 
                                        style={{ 
                                            flex: 1, 
                                            borderRadius: '12px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '900',
                                            borderColor: 'rgba(56, 189, 248, 0.4)',
                                            color: '#38bdf8',
                                            background: 'rgba(56, 189, 248, 0.05)'
                                        }}
                                        onClick={() => handleOpenAssignStudents(batch)}
                                    >
                                        ADD +
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outline" 
                                        style={{ 
                                            flex: 1, 
                                            borderRadius: '12px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '900',
                                            borderColor: 'rgba(251, 146, 60, 0.4)',
                                            color: '#fb923c',
                                            background: 'rgba(251, 146, 60, 0.05)'
                                        }}
                                        onClick={() => handleOpenAssignCourses(batch)}
                                    >
                                        MAP PROG
                                    </Button>
                                </div>


                            </Card>
                        );
                    })}
                    {batches.length === 0 && <p>No batches found.</p>}
                </div>
            )}

            {/* Create/Edit Batch Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <Card style={{ 
                        width: '100%', 
                        maxWidth: '450px', 
                        position: 'relative', 
                        backgroundColor: '#ffffff', 
                        borderRadius: '2rem', 
                        padding: '3rem 2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: 'none'
                    }}>
                        <button
                            onClick={() => { setShowModal(false); setEditingBatch(null); }}
                            style={{ 
                                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                                border: 'none', background: 'rgba(0,0,0,0.05)', 
                                cursor: 'pointer', color: '#000000',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '1.5rem', color: '#000000', letterSpacing: '-0.025em' }}>
                            {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Batch Name"
                                value={formData.batch_name}
                                onChange={e => setFormData({ ...formData, batch_name: e.target.value })}
                                required
                            />
                            <Input
                                type="date"
                                label="Start Date"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                            <Input
                                type="date"
                                label="End Date"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                            <Button type="submit" style={{ marginTop: '1rem' }}>
                                {editingBatch ? 'Update Batch' : 'Create Batch'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Assign Students Modal */}
            {assignStudentsModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <Card style={{ 
                        width: '100%', 
                        maxWidth: '650px', 
                        position: 'relative', 
                        maxHeight: '85vh', 
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        borderRadius: '2rem',
                        padding: '3rem 2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: 'none'
                    }}>
                        <button
                            onClick={() => { setAssignStudentsModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchStudents([]); }}
                            style={{ 
                                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                                border: 'none', background: 'rgba(0,0,0,0.05)', 
                                cursor: 'pointer', color: '#000000',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.5rem', color: '#000000', letterSpacing: '-0.025em' }}>
                            Assign Students
                        </h3>
                        <p style={{ color: '#64748B', marginBottom: '2rem', fontSize: '1rem', fontWeight: '500' }}>
                            Squadron Identification: <strong style={{ color: '#4F46E5' }}>{assignStudentsModal.batchName}</strong>
                        </p>

                        {/* Currently Assigned Students */}
                        {currentBatchStudents.length > 0 && (
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                backgroundColor: '#eff6ff',
                                borderRadius: '0.5rem',
                                border: '1px solid #bfdbfe'
                            }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.75rem' }}>
                                    Currently Assigned Students ({currentBatchStudents.length})
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {currentBatchStudents.map(student => (
                                        <div key={student.id} style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#dbeafe',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            color: '#1e40af',
                                            fontWeight: '500'
                                        }}>
                                            {student.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                            Select Students to Assign
                        </h4>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {students.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No students available</p>
                            ) : (
                                students.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudentSelection(student.id)}
                                        style={{
                                            padding: '0.75rem',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: selectedStudents.includes(student.id) ? '#eff6ff' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{student.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{student.email}</div>
                                        </div>
                                        {selectedStudents.includes(student.id) && (
                                            <Check size={20} color="#4f46e5" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="ghost" onClick={() => { setAssignStudentsModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchStudents([]); }} style={{ flex: 1 }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssignStudents} style={{ flex: 1 }}>
                                Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Assign Courses Modal */}
            {assignCoursesModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <Card style={{ 
                        width: '100%', 
                        maxWidth: '650px', 
                        position: 'relative', 
                        maxHeight: '85vh', 
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        borderRadius: '2rem',
                        padding: '3rem 2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: 'none'
                    }}>
                        <button
                            onClick={() => { setAssignCoursesModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchCourses([]); }}
                            style={{ 
                                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                                border: 'none', background: 'rgba(0,0,0,0.05)', 
                                cursor: 'pointer', color: '#000000',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.5rem', color: '#000000', letterSpacing: '-0.025em' }}>
                            Map Curriculum
                        </h3>
                        <p style={{ color: '#64748B', marginBottom: '2rem', fontSize: '1rem', fontWeight: '500' }}>
                            Squadron Identification: <strong style={{ color: '#FB923C' }}>{assignCoursesModal.batchName}</strong>
                        </p>

                        {/* Currently Assigned Courses */}
                        {currentBatchCourses.length > 0 && (
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                backgroundColor: '#fff7ed',
                                borderRadius: '0.5rem',
                                border: '1px solid #fed7aa'
                            }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#c2410c', marginBottom: '0.75rem' }}>
                                    Currently Assigned Courses ({currentBatchCourses.length})
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {currentBatchCourses.map(course => (
                                        <div key={course.id} style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#ffedd5',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            color: '#c2410c',
                                            fontWeight: '500'
                                        }}>
                                            {course.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text)' }}>
                            Select Courses to Assign
                        </h4>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {courses.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No courses available</p>
                            ) : (
                                courses.map(course => (
                                    <div
                                        key={course.id}
                                        onClick={() => toggleCourseSelection(course.id)}
                                        style={{
                                            padding: '0.75rem',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: selectedCourses.includes(course.id) ? '#fff7ed' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{course.title}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                                {course.description ? course.description.substring(0, 60) + '...' : course.duration || 'N/A'}
                                            </div>
                                        </div>
                                        {selectedCourses.includes(course.id) && (
                                            <Check size={20} color="#f97316" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="ghost" onClick={() => { setAssignCoursesModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchCourses([]); }} style={{ flex: 1 }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssignCourses} style={{ flex: 1 }}>
                                Assign {selectedCourses.length} Course{selectedCourses.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            {/* View Students Modal */}
            {viewStudentsModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', position: 'relative' }}
                    >
                        <Card style={{ backgroundColor: '#ffffff', border: 'none', padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)', borderRadius: '2.5rem' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'linear-gradient(90deg, #38bdf8, #4f46e5)' }} />
                            
                            <div style={{ padding: '3rem 2.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#000000', letterSpacing: '-0.025em' }}>
                                        Squadron Personnel
                                    </h3>
                                    <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: '500' }}>Active operatives in <strong style={{ color: '#4f46e5' }}>{viewStudentsModal.batchName}</strong>.</p>
                                </div>
                                <button
                                    onClick={() => { setViewStudentsModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchStudents([]); }}
                                    style={{ border: 'none', background: 'rgba(255,255,255,0.05)', height: '40px', width: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
                                {currentBatchStudents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                                        <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', fontSize: '0.8rem' }}>No operatives found in this data set.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {currentBatchStudents.map((s, i) => (
                                            <motion.div 
                                                key={s.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{ 
                                                    background: 'rgba(255,255,255,0.02)', 
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    padding: '1.25rem',
                                                    borderRadius: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                                    <div style={{ width: '45px', height: '45px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                                                        <Users size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '1rem' }}>{s.name}</h4>
                                                        <div style={{ color: '#64748B', fontSize: '0.8rem', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                            <span>{s.email}</span>
                                                            {s.phone && <span style={{ color: '#312E81' }}>//</span>}
                                                            {s.phone && <span>LINK: {s.phone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Discipline</div>
                                                    <div style={{ color: '#38BDF8', fontWeight: '700', fontSize: '0.875rem' }}>
                                                        {courses.find(c => String(c.id) === String(s.course_id))?.title || 'GENERAL STUDIES'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* View Courses Modal */}
            {viewCoursesModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{ width: '100%', maxWidth: '650px', maxHeight: '80vh', position: 'relative' }}
                    >
                        <Card style={{ backgroundColor: '#ffffff', border: 'none', padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)', borderRadius: '2.5rem' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'linear-gradient(90deg, #fb923c, #fb7185)' }} />
                            
                            <div style={{ padding: '3rem 2.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#000000', letterSpacing: '-0.025em' }}>
                                        Curriculum Map
                                    </h3>
                                    <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: '500' }}>Modules assigned to <strong style={{ color: '#fb923c' }}>{viewCoursesModal.batchName}</strong>.</p>
                                </div>
                                <button
                                    onClick={() => { setViewCoursesModal({ isOpen: false, batchId: null, batchName: '' }); setCurrentBatchCourses([]); }}
                                    style={{ border: 'none', background: 'rgba(255,255,255,0.05)', height: '40px', width: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
                                {currentBatchCourses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                                        <BookOpen size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', fontSize: '0.8rem' }}>No modules mapped to this squadron.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {currentBatchCourses.map((c, i) => (
                                            <motion.div 
                                                key={c.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{ 
                                                    background: 'rgba(255,255,255,0.02)', 
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    padding: '1.25rem',
                                                    borderRadius: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1.25rem'
                                                }}
                                            >
                                                <div style={{ width: '45px', height: '45px', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c' }}>
                                                    <BookOpen size={20} />
                                                </div>
                                                <div>
                                                    <h4 style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '1rem' }}>{c.title}</h4>
                                                    <div style={{ color: '#64748B', fontSize: '0.8rem', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                        <span>{c.duration || 'Flexible'} Duration</span>
                                                        <span style={{ color: '#312E81' }}>//</span>
                                                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Program</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminBatches;
