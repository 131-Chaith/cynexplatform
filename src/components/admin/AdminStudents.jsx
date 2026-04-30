import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Users, BookOpen, Plus, X, Search, Filter, Edit2, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [enrollments, setEnrollments] = useState([]); // New state for direct enrollments

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '',
        dob: '', address: '', gender: 'Male',
        guardian_name: '', guardian_contact: '',
        previous_qualification: '', batch_id: '', course_id: ''
    });

    const [editingStudent, setEditingStudent] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes, batchesRes] = await Promise.all([
                api.get('admin/students'),
                api.get('courses'),
                api.get('batches')
            ]);
            setStudents(studentsRes.data);
            setCourses(coursesRes.data);
            setBatches(batchesRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingStudent) {
                await api.put(`admin/students/${editingStudent.id}`, formData);
                // If a new course was assigned, refresh enrollments list
                if (formData.course_id) {
                    const enrollRes = await api.get(`admin/students/${editingStudent.id}/enrollments`);
                    setEnrollments(enrollRes.data);
                }
            } else {
                await api.post('admin/students', formData);
            }
            
            setSuccess(true);
            setSubmitting(false);
            
            // Auto-close after 2 seconds
            setTimeout(() => {
                setShowAddModal(false);
                setEditingStudent(null);
                setSuccess(false);
                fetchData();
                // Reset form
                setFormData({
                    name: '', email: '', password: '', phone: '',
                    dob: '', address: '', gender: 'Male',
                    guardian_name: '', guardian_contact: '',
                    previous_qualification: '', batch_id: '', course_id: ''
                });
            }, 2000);

        } catch (error) {
            setSubmitting(false);
            console.error("Error saving student:", error);
            alert(error.response?.data?.message || "Failed to save student");
        }
    };

    const handleEdit = async (student) => {
        try {
            // Format date for <input type="date"> (YYYY-MM-DD)
            let formattedDob = '';
            if (student.dob) {
                const date = new Date(student.dob);
                if (!isNaN(date.getTime())) {
                    formattedDob = date.toISOString().split('T')[0];
                }
            }

            // Fetch current enrollments
            const enrollRes = await api.get(`admin/students/${student.id}/enrollments`);
            setEnrollments(enrollRes.data);

            setEditingStudent(student);
            setFormData({
                name: student.name,
                email: student.email,
                password: '*****', // Don't show password
                phone: student.phone || '',
                dob: formattedDob,
                address: student.address || '',
                gender: student.gender || 'Male',
                guardian_name: student.guardian_name || '',
                guardian_contact: student.guardian_contact || '',
                previous_qualification: student.previous_qualification || '',
                batch_id: student.batch_id ? String(student.batch_id) : '',
                course_id: '' // Start empty so selecting one adds to enrollments
            });
            setShowAddModal(true);
        } catch (error) {
            alert("Error loading student details");
        }
    };

    const handleUnenroll = async (courseId) => {
        if (!window.confirm("Are you sure you want to unenroll this student?")) return;
        try {
            await api.delete(`admin/enroll/${editingStudent.id}/${courseId}`);
            // Refresh enrollments
            const enrollRes = await api.get(`/admin/students/${editingStudent.id}/enrollments`);
            setEnrollments(enrollRes.data);
        } catch (error) {
            alert("Failed to unenroll student");
        }
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student (ID: " + studentId + ")?")) return;
        
        try {
            console.log(`Sending delete request for ID: ${studentId}`);
            await api.delete(`admin/students/${studentId}`);
            alert("Student Deleted Successfully!");
            fetchData(); // Reload data
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Failed to delete student: " + (error.response?.data?.message || error.message));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                        Manage Students
                    </h1>
                    <p style={{ color: 'var(--text-light)' }}>
                        Add, view, and manage student profiles and enrollments.
                    </p>
                </div>
                <Button onClick={() => { setEditingStudent(null); setFormData({ name: '', email: '', password: '', phone: '', dob: '', address: '', gender: 'Male', guardian_name: '', guardian_contact: '', previous_qualification: '', batch_id: '', course_id: '' }); setShowAddModal(true); }}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add New Student
                </Button>
            </div>


            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', perspective: '1500px' }}>
                    <AnimatePresence mode="popLayout">
                        {students.map((student, i) => (
                            <motion.div 
                                key={student.id} 
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)', transition: { duration: 0.3 } }}
                                layout
                                transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                                whileHover={{ scale: 1.02, rotateX: -5, rotateY: 2, z: 20 }}
                                style={{ 
                                    background: 'linear-gradient(165deg, #0f172a, #1e293b)', 
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    borderRadius: '1rem',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                {/* Terminal Top Bar */}
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                                
                                <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transform: 'translateZ(20px)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#38bdf8',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)'
                                    }}>
                                        <Users size={24} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.025em', textShadow: '0 0 10px rgba(56, 189, 248, 0.3)', marginBottom: '0.15rem' }}>
                                            {student.name}
                                        </h3>
                                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{student.email}</p>
                                    </div>
                                </div>
                                
                                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', transform: 'translateZ(10px)' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ 
                                            padding: '0.3rem 0.6rem', 
                                            backgroundColor: 'rgba(56, 189, 248, 0.08)', 
                                            borderRadius: '8px', 
                                            fontSize: '0.65rem', 
                                            color: '#38bdf8',
                                            fontWeight: '900',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            border: '1px solid rgba(56, 189, 248, 0.2)'
                                        }}>
                                            <Clock size={12} /> JOINED: {new Date(student.created_at).toLocaleDateString()}
                                        </div>
                                        {student.phone && (
                                            <div style={{ 
                                                padding: '0.3rem 0.6rem', 
                                                backgroundColor: 'rgba(251, 146, 60, 0.08)', 
                                                borderRadius: '8px', 
                                                fontSize: '0.65rem', 
                                                color: '#fb923c',
                                                fontWeight: '900',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                border: '1px solid rgba(251, 146, 60, 0.2)'
                                            }}>
                                                <span>📱 LINK: {student.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Deployment Stats Group */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Squadron</div>
                                            <div style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: '700' }}>{batches.find(b => String(b.id) === String(student.batch_id))?.batch_name || 'UNASSIGNED'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', gridColumn: student.enrolled_courses?.includes(', ') ? '1 / -1' : 'auto' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Assigned Cores</div>
                                            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                {student.enrolled_courses ? student.enrolled_courses.split(', ').map((c, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        {student.enrolled_courses.includes(', ') && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#38bdf8' }}></span>}
                                                        {c}
                                                    </div>
                                                )) : 'GENERAL'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', position: 'relative', zIndex: 100 }}>
                                        <Button 
                                            size="small" 
                                            variant="glass" 
                                            style={{ flex: 1, borderRadius: '12px', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '0.1em', padding: '0.8rem', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }} 
                                            onClick={() => handleEdit(student)}
                                        >
                                            ID ACCESS
                                        </Button>
                                        <Button 
                                            variant="danger"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
                                            style={{ 
                                                flex: 1, 
                                                borderRadius: '12px', 
                                                fontWeight: '900', 
                                                fontSize: '0.75rem', 
                                                letterSpacing: '0.1em', 
                                                padding: '0.8rem',
                                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                                            }}
                                        >
                                            TERMINATE
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {students.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '6rem', textAlign: 'center', color: '#475569', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '2rem' }}>
                            <Users size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                            <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}>
                                Negative Operative Presence Detected.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Student Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)', 
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            padding: '1.5rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                width: '100%',
                                maxWidth: '750px',
                                background: '#ffffff',
                                borderRadius: '2rem',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                padding: '2.5rem'
                            }}
                        >
                            <button
                                onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
                                style={{ 
                                    position: 'absolute', top: '1.5rem', right: '1.5rem', 
                                    border: 'none', background: 'rgba(0,0,0,0.05)', 
                                    cursor: 'pointer', color: '#64748b',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                            >
                                <X size={18} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ 
                                    width: '64px', height: '64px', background: 'rgba(37, 99, 235, 0.1)', 
                                    borderRadius: '1rem', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', color: '#2563eb', margin: '0 auto 1rem'
                                }}>
                                    <Users size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
                                    {editingStudent ? 'Update Operative' : 'Instantiate Operative'}
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                    Configure core identity and system access parameters.
                                </p>
                            </div>

                            {success ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ 
                                        textAlign: 'center', padding: '3rem 0',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}
                                >
                                    <div style={{ 
                                        width: '80px', height: '80px', background: '#10b981', 
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', 
                                        justifyContent: 'center', color: 'white', marginBottom: '1.5rem',
                                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
                                    }}>
                                        <Plus size={48} style={{ transform: 'rotate(45deg)' }} /> {/* Using Plus rotated as a placeholder for checkmark or similar if I don't have Check */}
                                    </div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>
                                        SUCCESSFUL INSTANTIATION
                                    </h2>
                                    <p style={{ color: '#64748b' }}>
                                        Operative data has been successfully synchronized.
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <h4 style={{ 
                                            fontSize: '0.75rem', fontWeight: '800', color: '#2563eb', 
                                            textTransform: 'uppercase', letterSpacing: '0.1em', 
                                            marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', 
                                            paddingBottom: '0.5rem' 
                                        }}>Primary Protocol Data</h4>
                                    </div>
                                    
                                    <Input label="Full Identity Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter full name" />
                                    <Input label="Comm Link (Email)" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="operative@cynex.ai" />
                                    <Input label="Access Key (Password)" type="text" name="password" value={formData.password} onChange={handleChange} required={!editingStudent} placeholder={editingStudent ? "Leave as ***** to keep" : "Minimum 8 characters"} />
                                    <Input label="Phone Link" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (XXX) XXX-XXXX" />

                                    <Input label="Temporal Origin (DOB)" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                                    
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Identity Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} style={{ 
                                            width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', 
                                            borderRadius: '0.75rem', background: '#f8fafc', fontSize: '0.875rem'
                                        }}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Primary Core Assignment</label>
                                        <select name="course_id" value={formData.course_id} onChange={handleChange} style={{ 
                                            width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', 
                                            borderRadius: '0.75rem', background: '#f8fafc', fontSize: '0.875rem'
                                        }}>
                                            <option value="">-- No Core Assigned --</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Squadron Assignment (Batch)</label>
                                        <select name="batch_id" value={formData.batch_id} onChange={handleChange} style={{ 
                                            width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', 
                                            borderRadius: '0.75rem', background: '#f8fafc', fontSize: '0.875rem'
                                        }}>
                                            <option value="">-- No Squadron Assigned --</option>
                                            {batches.map(b => (
                                                <option key={b.id} value={b.id}>{b.batch_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {editingStudent && enrollments.length > 0 && (
                                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Active Parallel Enrollments</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {enrollments.map(e => (
                                                    <div key={e.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.4rem 0.8rem', backgroundColor: '#ffffff',
                                                        borderRadius: '0.5rem', fontSize: '0.75rem', border: '1px solid #e2e8f0',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#1e293b', fontWeight: '600'
                                                    }}>
                                                        <span>{e.title}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnenroll(e.id)}
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 0 }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Input label="Geospatial Coordinates (Address)" textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter physical address..." />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <h4 style={{ 
                                            fontSize: '0.75rem', fontWeight: '800', color: '#2563eb', 
                                            textTransform: 'uppercase', letterSpacing: '0.1em', 
                                            marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', 
                                            paddingBottom: '0.5rem', marginTop: '1rem' 
                                        }}>Secondary Accession Data</h4>
                                    </div>

                                    <Input label="Guardian Name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} />
                                    <Input label="Guardian Contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleChange} />
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Input label="Previous System Qualifications" name="previous_qualification" value={formData.previous_qualification} onChange={handleChange} placeholder="Degrees, Certifications, etc." />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                                        <Button 
                                            type="submit" 
                                            style={{ width: '100%', height: '3.5rem', fontSize: '1rem', borderRadius: '1rem' }}
                                            isLoading={submitting}
                                        >
                                            {editingStudent ? 'UPDATE CORE IDENTITY' : 'EXECUTE INSTANTIATION'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminStudents;
