import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    Video, 
    Search,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All, Present, Absent, Pending
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance/my-attendance');
            setAttendance(res.data);
        } catch (err) {
            console.error("Failed to fetch student attendance", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendance = attendance.filter(item => {
        const matchesFilter = filter === 'All' || item.status === filter;
        const matchesSearch = item.module_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present': return { bg: '#DCFCE7', text: '#16A34A', border: '#BFF0D2', icon: <CheckCircle size={14} /> };
            case 'Absent': return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', icon: <XCircle size={14} /> };
            default: return { bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A', icon: <Clock size={14} /> };
        }
    };

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        pending: attendance.filter(a => a.status === 'Pending').length,
        percentage: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'Present').length / (attendance.length - attendance.filter(a => a.status === 'Pending').length || 1)) * 100) : 0
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="show"
            variants={container}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                    <motion.h2 variants={item} style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Success Records</motion.h2>
                    <motion.p variants={item} style={{ color: '#64748B', fontSize: '1.1rem' }}>Your academic digital footprint and attendance metrics.</motion.p>
                </div>
                {attendance.length > 0 && (
                    <motion.div 
                        variants={item}
                        whileHover={{ scale: 1.05 }}
                        style={{ textAlign: 'right', background: 'var(--primary-gradient)', padding: '1rem 2rem', borderRadius: '1.25rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)' }}
                    >
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Consistency Score</div>
                        <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stats.percentage}%</div>
                    </motion.div>
                )}
            </div>

            {/* Quick Stats */}
            <motion.div variants={container} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Academic Sessions', value: stats.total, color: '#6366F1', icon: <Video size={24} />, bg: 'rgba(99, 102, 241, 0.1)' },
                    { label: 'Confirmed Presence', value: stats.present, color: '#10B981', icon: <CheckCircle size={24} />, bg: 'rgba(16, 185, 129, 0.1)' },
                    { label: 'Unrecorded Absence', value: stats.absent, color: '#EF4444', icon: <XCircle size={24} />, bg: 'rgba(239, 68, 68, 0.1)' },
                    { label: 'Pending Validation', value: stats.pending, color: '#F59E0B', icon: <Clock size={24} />, bg: 'rgba(245, 158, 11, 0.1)' }
                ].map((s, i) => (
                    <motion.div key={i} variants={item} whileHover={{ y: -5 }}>
                        <Card style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ padding: '1rem', borderRadius: '14px', backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {s.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '600' }}>{s.label}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>{s.value}</div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div variants={item}>
                <Card style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', background: '#F1F5F9', padding: '0.4rem', borderRadius: '1rem' }}>
                            {['All', 'Present', 'Absent', 'Pending'].map(f => (
                                <motion.button
                                    key={f}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700',
                                        border: 'none',
                                        backgroundColor: filter === f ? 'white' : 'transparent',
                                        color: filter === f ? 'var(--primary)' : '#64748B',
                                        boxShadow: filter === f ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {f}
                                </motion.button>
                            ))}
                        </div>
                        <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input 
                                type="text" 
                                placeholder="Locate specific journals, topics, or leads..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', 
                                    borderRadius: '1rem', border: '1px solid #E2E8F0',
                                    outline: 'none', transition: 'all 0.2s', fontSize: '0.9rem',
                                    backgroundColor: '#F8FAFC'
                                }}
                            />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ 
                        border: '3px solid #E2E8F0', 
                        borderTop: '3px solid var(--primary)', 
                        borderRadius: '50%', 
                        width: '40px', 
                        height: '40px', 
                        animation: 'spin 1s linear infinite', 
                        margin: '0 auto 1.5rem' 
                    }}></div>
                    <p style={{ color: '#64748B', fontWeight: '600' }}>Synchronizing Attendance Logs...</p>
                </div>
            ) : filteredAttendance.length === 0 ? (
                <motion.div 
                    variants={item}
                    style={{ textAlign: 'center', padding: '5rem 2.5rem', backgroundColor: 'white', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}
                >
                    <div style={{ fontSize: '4.5rem', marginBottom: '2rem', opacity: 0.3 }}>🏛️</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.75rem' }}>The archive is empty</h3>
                    <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>No entries match your current search criteria. Try adjusting the filters or wait for the system to populate.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={item}
                    style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}
                >
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '0.875rem', fontWeight: '600', background: 'rgba(248, 250, 252, 0.5)' }}>
                        Analysis: {filteredAttendance.length} records identified
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Domain</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Topic / Thesis</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Validity</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mentor</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timestamp</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Intel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.map((item, idx) => {
                                    const statusStyle = getStatusStyle(item.status);
                                    const date = new Date(item.schedule);
                                    return (
                                        <motion.tr 
                                            key={item.id} 
                                            whileHover={{ backgroundColor: '#F8FAFC' }}
                                            style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' }}
                                        >
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-gradient)' }}></div>
                                                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.9rem' }}>{item.module_name || 'Core Module'}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <div style={{ color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>{item.topic || item.title}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.4rem 1rem', borderRadius: '8px',
                                                    fontSize: '0.75rem', fontWeight: '800',
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.text,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.025em'
                                                }}>
                                                    {statusStyle.icon}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569', fontSize: '0.9rem', fontWeight: '600' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={14} />
                                                    </div>
                                                    {item.instructor_name || 'Senior Lead'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <div style={{ color: '#1E293B', fontSize: '0.85rem', fontWeight: '700' }}>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '600' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{ 
                                                        padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none',
                                                        backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800',
                                                        fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                                    }}
                                                >
                                                    EXPLORE
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
};

export default StudentAttendance;
