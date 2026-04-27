import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Users, BookOpen, Plus, X, Search, Filter, Edit2, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
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
                api.get('/admin/students'),
                api.get('/courses'),
                api.get('/batches')
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
        try {
            if (editingStudent) {
                await api.put(`/admin/students/${editingStudent.id}`, formData);
                alert("Student Updated Successfully!");
                // If a new course was assigned, refresh enrollments list
                if (formData.course_id) {
                    const enrollRes = await api.get(`/admin/students/${editingStudent.id}/enrollments`);
                    setEnrollments(enrollRes.data);
                }
            } else {
                await api.post('/admin/students', formData);
                alert("Student Added Successfully!");
            }
            setShowAddModal(false);
            setEditingStudent(null);
            fetchData();
            // Reset form
            setFormData({
                name: '', email: '', password: '', phone: '',
                dob: '', address: '', gender: 'Male',
                guardian_name: '', guardian_contact: '',
                previous_qualification: '', batch_id: '', course_id: ''
            });
        } catch (error) {
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
            const enrollRes = await api.get(`/admin/students/${student.id}/enrollments`);
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
            await api.delete(`/admin/enroll/${editingStudent.id}/${courseId}`);
            // Refresh enrollments
            const enrollRes = await api.get(`/admin/students/${editingStudent.id}/enrollments`);
            setEnrollments(enrollRes.data);
        } catch (error) {
            alert("Failed to unenroll student");
        }
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await api.delete(`/admin/students/${studentId}`);
            alert("Student Deleted Successfully!");
            fetchData();
        } catch (error) {
            alert("Failed to delete student");
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
                    {students.map((student, i) => (
                        <motion.div 
                            key={student.id} 
                            initial={{ opacity: 0, y: 30, rotateX: 10 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
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
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Primary Core</div>
                                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{courses.find(c => String(c.id) === String(student.course_id))?.title || 'GENERAL'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <Button 
                                        size="small" 
                                        variant="outline" 
                                        style={{ flex: 1, borderRadius: '8px', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '0.05em', padding: '0.5rem' }} 
                                        onClick={() => handleEdit(student)}
                                    >
                                        ID ACCESS
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outline" 
                                        style={{ flex: 1, borderRadius: '8px', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '0.05em', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem' }} 
                                        onClick={() => handleDelete(student.id)}
                                    >
                                        TERMINATE
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {students.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '6rem', textAlign: 'center', color: '#475569', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '2rem' }}>
                            <Users size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                            <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}>Negative Operative Presence Detected.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Student Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    overflowY: 'auto', padding: '2rem 0'
                }}>
                    <Card style={{ width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {editingStudent ? 'Edit Student Profile' : 'Add New Student'}
                        </h3>

                        <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>Basic Information</h4>
                            </div>
                            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                            <Input label="Password" type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="Leave as ***** to keep current" />
                            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />

                            <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem' }}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Assign Course</label>
                                <select name="course_id" value={formData.course_id} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem' }}>
                                    <option value="">-- No Course --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {editingStudent && enrollments.length > 0 && (
                                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Current Direct Enrollments</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {enrollments.map(e => (
                                            <div key={e.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.25rem 0.75rem', backgroundColor: '#f3f4f6',
                                                borderRadius: '9999px', fontSize: '0.75rem', border: '1px solid #e5e7eb'
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
                                <Input label="Address" textarea name="address" value={formData.address} onChange={handleChange} />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem', marginTop: '1rem' }}>Additional Details</h4>
                            </div>

                            <Input label="Guardian Name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} />
                            <Input label="Guardian Contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleChange} />
                            <Input label="Previous Qualification" name="previous_qualification" value={formData.previous_qualification} onChange={handleChange} />

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Assign Batch</label>
                                <select name="batch_id" value={formData.batch_id} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem' }}>
                                    <option value="">-- No Batch --</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.batch_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                <Button type="submit" style={{ width: '100%' }}>
                                    {editingStudent ? 'Update Student' : 'Create Student'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
