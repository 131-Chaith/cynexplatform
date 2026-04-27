import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, 
    Video, QrCode, TrendingUp, History, Search,
    ChevronRight, MapPin, ExternalLink, FileText
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRScanner from '../components/attendance/QRScanner';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import AttendanceAnalytics from '../components/attendance/AttendanceAnalytics';
import AttendanceReports from '../components/attendance/AttendanceReports';
import AttendanceNotifications from '../components/attendance/AttendanceNotifications';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const StudentAttendance = () => {
    const { currentUser: user } = useAuth();
    const location = useLocation();
    const [sessions, setSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history' | 'calendar' | 'online' | 'scan' | 'analytics' | 'reports' | 'notifications'

    useEffect(() => {
        // Map URL paths to tabs
        const path = location.pathname.split('/').pop();
        if (['dashboard', 'history', 'calendar', 'online', 'scan', 'analytics', 'reports', 'notifications'].includes(path)) {
            setActiveTab(path);
            if (path === 'scan') setShowScanner(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sessionsRes, historyRes, statsRes, analyticsRes, notifRes] = await Promise.all([
                api.get('attendance/sessions/active'),
                api.get('attendance/history/my'),
                api.get('attendance/student/stats'),
                api.get('attendance/analytics'),
                api.get('attendance/notifications')
            ]);
            setSessions(sessionsRes.data || []);
            setHistory(historyRes.data || []);
            setStats(statsRes.data);
            setAnalytics(analyticsRes.data);
            setNotifications(notifRes.data || []);
        } catch (error) {
            console.error("Error fetching student attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Student Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                        Attendance Hub
                    </h1>
                    <p style={{ color: '#64748B', fontWeight: '500' }}>Stay on track with your curriculum participation.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F0F9FF', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                        <TrendingUp size={18} color="#0284C7" />
                        <span style={{ fontWeight: '800', color: '#0369A1' }}>{stats?.attendancePercentage || 0}% Present Rate</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                <ActionTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" icon={<TrendingUp size={18} />} />
                <ActionTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="My Attendance" icon={<History size={18} />} />
                <ActionTab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Calendar" icon={<CalendarIcon size={18} />} />
                <ActionTab active={activeTab === 'online'} onClick={() => setActiveTab('online')} label="Live Classes" icon={<Video size={18} />} />
                <ActionTab active={activeTab === 'scan'} onClick={() => setActiveTab('scan')} label="QR Scan" icon={<QrCode size={18} />} />
                <ActionTab active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} label="Alerts" icon={<Bell size={18} />} />
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTop: '4px solid #6366F1', borderRadius: '50%' }}></div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="dashboard">
                            {/* Dashboard Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <DashboardStatCard label="Total Classes" value={stats?.totalSessions} color="#6366F1" />
                                <DashboardStatCard label="Attended" value={stats?.presentCount} color="#10B981" />
                                <DashboardStatCard label="Absent" value={stats?.absentCount} color="#EF4444" />
                                <DashboardStatCard label="Late Joins" value={stats?.lateCount} color="#F59E0B" />
                                <DashboardStatCard label="Percentage" value={`${stats?.attendancePercentage}%`} color="#8B5CF6" />
                            </div>

                            {/* Warning Banner */}
                            {stats?.attendancePercentage < 75 && (
                                <motion.div 
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}
                                >
                                    <AlertCircle color="#EF4444" size={24} />
                                    <div>
                                        <h4 style={{ color: '#991B1B', fontWeight: '800' }}>Attendance Warning</h4>
                                        <p style={{ color: '#B91C1C', fontSize: '0.9rem' }}>Your attendance is below the mandatory 75% threshold. Please attend upcoming sessions to maintain eligibility.</p>
                                    </div>
                                </motion.div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                <AttendanceAnalytics data={analytics} />
                                <AttendanceNotifications notifications={notifications} />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'online' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="online">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                                {sessions.filter(s => s.type === 'online').length > 0 ? sessions.filter(s => s.type === 'online').map(session => (
                                    <StudentSessionCard 
                                        key={session.id} 
                                        session={session} 
                                        onJoin={() => window.open(session.meet_link, '_blank')}
                                        fetchData={fetchData}
                                    />
                                )) : <EmptyState message="No online classes scheduled for now." />}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'scan' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="scan">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                                {sessions.filter(s => s.type === 'offline' || s.type === 'qr').length > 0 ? sessions.filter(s => s.type === 'offline' || s.type === 'qr').map(session => (
                                    <StudentSessionCard 
                                        key={session.id} 
                                        session={session} 
                                        onScan={() => setShowScanner(true)}
                                        fetchData={fetchData}
                                    />
                                )) : <EmptyState message="No QR sessions active. Ask your instructor to start a session." />}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'calendar' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="calendar">
                            <AttendanceCalendar data={history} />
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="notifications">
                            <AttendanceNotifications notifications={notifications} />
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="history">
                            <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: '#F8FAFC' }}>
                                                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Subject / Topic</th>
                                                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Mode</th>
                                                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Date</th>
                                                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((record, idx) => (
                                                <tr key={record.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '1.25rem' }}>
                                                        <p style={{ fontWeight: '700', color: '#1E293B' }}>{record.topic}</p>
                                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{record.course_title}</p>
                                                    </td>
                                                    <td style={{ padding: '1.25rem' }}>
                                                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', background: record.type === 'online' ? '#EEF2FF' : '#FFF7ED', color: record.type === 'online' ? '#6366F1' : '#F59E0B' }}>
                                                            {(record.type || 'N/A').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem', color: '#64748B', fontSize: '0.9rem' }}>
                                                        {new Date(record.join_time).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: '1.25rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: '800' }}>
                                                            <CheckCircle2 size={18} /> Present
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {history.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>No attendance records found yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Scanning Overlay */}
            <AnimatePresence>
                {showScanner && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: '900', color: '#1E293B' }}>Smart Scanner</h3>
                                <button onClick={() => setShowScanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <QRScanner 
                                    onClose={() => setShowScanner(false)} 
                                    onSuccess={() => {
                                        setShowScanner(false);
                                        fetchData();
                                    }} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ActionTab = ({ active, onClick, label, icon }) => (
    <motion.button 
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', 
            background: active ? '#6366F1' : 'white', color: active ? 'white' : '#64748B',
            borderRadius: '16px', border: '1px solid', borderColor: active ? '#6366F1' : '#F1F5F9',
            boxShadow: active ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
            cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
    >
        {icon} {label}
    </motion.button>
);

const StudentSessionCard = ({ session, onJoin, onScan, fetchData }) => (
    <motion.div 
        whileHover={{ y: -10 }}
        style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '14px' }}>
                {session.type === 'online' ? <Video color="#6366F1" /> : <QrCode color="#F59E0B" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ECFDF5', color: '#10B981', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900' }}>
                <div className="pulse" style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div> LIVE
            </div>
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem' }}>{session.topic}</h3>
        <p style={{ color: '#64748B', fontWeight: '600', marginBottom: '1.5rem' }}>{session.course_title}</p>
        
        {session.type === 'offline' && session.qr_token && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '1.5rem', border: '1px solid #E2E8F0' }}>
                <QRCodeSVG value={session.qr_token} size={150} level="H" />
                <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>Scan this code to mark attendance</p>
            </div>
        )}

        <Button 
            onClick={async () => {
                if (session.type === 'online') {
                    try {
                        await api.post('attendance/student/join-online', { sessionId: session.id });
                        window.open(session.meet_link, '_blank');
                        if (fetchData) fetchData();
                    } catch (err) {
                        console.error('Join tracking failed:', err);
                        window.open(session.meet_link, '_blank');
                    }
                } else {
                    if (onScan) onScan();
                }
            }}
            style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: session.type === 'online' ? '#6366F1' : '#F59E0B', display: 'flex', justifyContent: 'center', gap: '0.75rem', fontWeight: '900', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
        >
            {session.type === 'online' ? <><ExternalLink size={20} /> Join Meeting</> : <><QrCode size={20} /> Mark Attendance</>}
        </Button>
    </motion.div>
);

const DashboardStatCard = ({ label, value, color }) => (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: '900', color: color || '#1E293B' }}>{value}</p>
    </div>
);

const EmptyState = ({ message }) => (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}>
        <CalendarIcon size={48} color="#94A3B8" style={{ marginBottom: '1.5rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.5rem' }}>Nothing Found</h3>
        <p style={{ color: '#64748B' }}>{message}</p>
    </div>
);

const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Bell = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;

export default StudentAttendance;
