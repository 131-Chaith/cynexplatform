import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import { Users, BookOpen, Calendar, CheckCircle, XCircle, Clock, Search, Filter, FileSpreadsheet, RefreshCw, BarChart } from 'lucide-react';
import GoogleSheetsAttendanceSync from './GoogleSheetsAttendanceSync';
import { AnimatePresence } from 'framer-motion';

const AdminAttendance = () => {
    const { data } = useData() || {};
    const { courses = [] } = data || {};
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchBatches();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedBatchId || selectedCourseId) {
            fetchAttendanceSummary();
        }
    }, [selectedBatchId, selectedCourseId]);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/batches');
            setBatches(res.data);
        } catch (err) {
            console.error("Failed to fetch batches", err);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/courses/classes/all'); // Assuming this endpoint exists, or I'll create it
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        }
    };

    const fetchAttendanceSummary = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedBatchId) params.batch_id = selectedBatchId;
            if (selectedCourseId) params.course_id = selectedCourseId;
            
            const res = await api.get('/attendance/summary', { params });
            setAttendanceData(res.data);
        } catch (err) {
            console.error("Failed to fetch attendance summary", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (classId, studentId, status) => {
        try {
            await api.post('/attendance/mark', { class_id: classId, student_id: studentId, status });
            // Update local state to avoid full refetch
            setAttendanceData(prev => prev.map(item => 
                (item.class_id === classId && item.student_id === studentId) 
                ? { ...item, status } 
                : item
            ));
        } catch (err) {
            alert("Failed to mark attendance");
        }
    };

    const filteredData = attendanceData.filter(item => 
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.class_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present': return { backgroundColor: '#DCFCE7', color: '#16A34A', icon: <CheckCircle size={14} /> };
            case 'Absent': return { backgroundColor: '#FEE2E2', color: '#DC2626', icon: <XCircle size={14} /> };
            default: return { backgroundColor: '#FEF9C3', color: '#CA8A04', icon: <Clock size={14} /> };
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Attendance Management</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#6B7280' }}>Track and manage student attendance across all courses and batches.</p>
                    <button 
                        onClick={() => setShowSyncModal(true)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1rem', borderRadius: '0.5rem',
                            backgroundColor: '#10B981', color: 'white', border: 'none',
                            fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <FileSpreadsheet size={18} />
                        Sync Google Sheets
                    </button>
                </div>
            </div>

            <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Filter by Batch</label>
                        <select 
                            value={selectedBatchId} 
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', backgroundColor: 'white' }}
                        >
                            <option value="">All Batches</option>
                            {(batches || []).map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Filter by Course</label>
                        <select 
                            value={selectedCourseId} 
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', backgroundColor: 'white' }}
                        >
                            <option value="">All Courses</option>
                            {(courses || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Search Student or Class</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 0.625rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB' }}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4F46E5', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#6B7280' }}>Loading attendance records...</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #D1D5DB' }}>
                    <Calendar size={48} style={{ color: '#9CA3AF', marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>No Records Found</h3>
                    <p style={{ color: '#6B7280' }}>Try adjusting your filters or adding some classes.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>Attendance Overview</h3>
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <BarChart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem' }}>Analytical Visualization (Recharts Integration Pending)</p>
                                    <p style={{ fontSize: '0.75rem' }}>Present: {filteredData.filter(d => d.status === 'Present').length} | Absent: {filteredData.filter(d => d.status === 'Absent').length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>Quick Stats</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#166534' }}>
                                        {filteredData.length > 0 ? Math.round((filteredData.filter(d => d.status === 'Present').length / filteredData.length) * 100) : 0}%
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Avg Attendance</div>
                                </div>
                                <div style={{ padding: '1rem', background: '#e0e7ff', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3730a3' }}>
                                        {new Set(filteredData.map(d => d.student_id)).size}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3730a3', textTransform: 'uppercase' }}>Tracked Students</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Student</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Batch / Course</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Class / Topic</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Date & Time</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>

                        <tbody>
                            {(filteredData || []).map((item, idx) => {
                                const statusStyle = getStatusStyle(item.status);
                                return (
                                    <tr key={`${item.class_id}-${item.student_id}`} style={{ borderBottom: idx === filteredData.length - 1 ? 'none' : '1px solid #F3F4F6', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{item.student_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#4B5563' }}>{item.batch_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{item.course_title}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{item.class_title}</div>
                                            {item.topic && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Topic: {item.topic}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#4B5563' }}>
                                                {new Date(item.schedule).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                {new Date(item.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                padding: '0.25rem 0.625rem', borderRadius: '9999px',
                                                fontSize: '0.75rem', fontWeight: '600',
                                                ...statusStyle
                                            }}>
                                                {statusStyle.icon}
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => handleMarkAttendance(item.class_id, item.student_id, 'Present')}
                                                    style={{ 
                                                        padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #16A34A',
                                                        backgroundColor: item.status === 'Present' ? '#DCFCE7' : 'white',
                                                        color: '#16A34A', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    title="Mark Present"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleMarkAttendance(item.class_id, item.student_id, 'Absent')}
                                                    style={{ 
                                                        padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #DC2626',
                                                        backgroundColor: item.status === 'Absent' ? '#FEE2E2' : 'white',
                                                        color: '#DC2626', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    title="Mark Absent"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
                </>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            <AnimatePresence>
                {showSyncModal && (
                    <GoogleSheetsAttendanceSync 
                        classes={classes}
                        onClose={() => setShowSyncModal(false)}
                        onSyncComplete={() => {
                            fetchAttendanceSummary();
                            // Optional: show a small toast or just close after a delay
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAttendance;
