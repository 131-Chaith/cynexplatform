import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, 
    Video, QrCode, TrendingUp, History, Search,
    ChevronRight, MapPin, ExternalLink, FileText,
    Bell, MoreHorizontal, User, Smartphone, Users
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRScanner from '../components/attendance/QRScanner';
import AttendanceAnalytics from '../components/attendance/AttendanceAnalytics';
import AttendanceNotifications from '../components/attendance/AttendanceNotifications';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const StudentAttendance = () => {
    const { currentUser: user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [activeScanSession, setActiveScanSession] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const path = location.pathname.split('/').pop();
        if (['dashboard', 'history', 'calendar', 'online', 'scan', 'analytics', 'notifications'].includes(path)) {
            setActiveTab(path);
            if (path === 'scan') setShowScanner(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 10000); // 10s poll for live sessions
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('attendance/sessions/active'),
                api.get('attendance/sessions/upcoming'),
                api.get('attendance/history/my'),
                api.get('attendance/student/stats'),
                api.get('attendance/analytics'),
                api.get('attendance/notifications')
            ]);

            if (results[0].status === 'fulfilled') {
                console.log('[DEBUG] Active Sessions Received:', results[0].value.data);
                setSessions(results[0].value.data || []);
            }
            if (results[1].status === 'fulfilled') setUpcomingSessions(results[1].value.data || []);
            if (results[2].status === 'fulfilled') setHistory(results[2].value.data || []);
            if (results[3].status === 'fulfilled') setStats(results[3].value.data);
            if (results[4].status === 'fulfilled') setAnalytics(results[4].value.data);
            if (results[5].status === 'fulfilled') setNotifications(results[5].value.data || []);
        } catch (error) {
            console.error("Error fetching student attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinOnline = async (session) => {
        try {
            if (!session.meet_link) return alert('No meeting link available.');
            const url = session.meet_link.startsWith('http') ? session.meet_link : `https://${session.meet_link}`;
            
            // Track join event
            await api.post('attendance/student/join-online', { sessionId: session.id });
            
            // Open Meet in new tab
            window.open(url, '_blank');
            
            setTimeout(fetchData, 2000);
        } catch (err) {
            console.error('Join tracking failed:', err);
            const url = session.meet_link.startsWith('http') ? session.meet_link : `https://${session.meet_link}`;
            window.open(url, '_blank');
        }
    };

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="dashboard">
            {/* Real-time Live Classes Banner */}
            {sessions.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div className="pulse" style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '50%' }}></div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', letterSpacing: '-0.02em' }}>Live Sessions Detected</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                        {sessions.map(session => (
                                <StudentSessionCard 
                                    key={session.id} 
                                    session={session} 
                                    onAction={() => {
                                        if (session.type === 'online') handleJoinOnline(session);
                                        else { setShowScanner(true); setActiveScanSession(session); }
                                    }}
                                />
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard label="Total Attendance" value={`${stats?.attendancePercentage || 0}%`} color="#6366F1" trend="+2.4%" />
                <StatCard label="Sessions Attended" value={stats?.presentCount || 0} color="#10B981" />
                <StatCard label="Absences" value={stats?.absentCount || 0} color="#EF4444" />
                <StatCard label="Late Marks" value={stats?.lateCount || 0} color="#F59E0B" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B' }}>Monthly Trends</h3>
                        <ActionTab active={false} label="Full Analytics" icon={<TrendingUp size={16} />} onClick={() => setActiveTab('analytics')} />
                    </div>
                    <div style={{ height: '300px' }}>
                        <AttendanceAnalytics data={analytics} />
                    </div>
                </div>
                <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem' }}>Security Logs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notifications.slice(0, 4).map((n, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '12px' }}>
                                <Smartphone size={20} color="#64748B" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>{n.title}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>{n.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Dynamic Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366F1', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', background: '#6366F1', borderRadius: '50%' }}></div>
                        Academic Portal • Live Sync
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.04em' }}>
                        {activeTab === 'dashboard' ? 'Attendance Hub' : 
                         activeTab === 'online' ? 'Live Classes' : 
                         activeTab === 'scan' ? 'QR Scanner' : 
                         activeTab === 'calendar' ? 'Class Schedule' : 'My History'}
                    </h1>
                </div>
                <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '1.5rem', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>Portal Time</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#F1F5F9' }}></div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10B981', margin: 0 }}>{stats?.attendancePercentage || 0}%</p>
                        <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', margin: 0 }}>Attendance</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <ActionTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Summary" icon={<TrendingUp size={18} />} />
                <ActionTab 
                    active={activeTab === 'online'} 
                    onClick={() => setActiveTab('online')} 
                    label="Live Meet" 
                    icon={<Video size={18} />} 
                    badge={sessions.filter(s => s.type === 'online').length}
                    badgeColor="#6366F1"
                />
                <ActionTab 
                    active={activeTab === 'scan'} 
                    onClick={() => setActiveTab('scan')} 
                    label="QR Scanner" 
                    icon={<QrCode size={18} />} 
                    badge={sessions.filter(s => s.type === 'offline').length}
                    badgeColor="#F59E0B"
                />
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
                    <div className="animate-spin" style={{ width: '48px', height: '48px', border: '4px solid #F1F5F9', borderTop: '4px solid #6366F1', borderRadius: '50%' }}></div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && renderDashboard()}
                    
                    {activeTab === 'online' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key="online_tab">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                                {sessions.filter(s => s.type === 'online').length > 0 ? (
                                    sessions.filter(s => s.type === 'online').map(session => (
                                        <StudentSessionCard key={session.id} session={session} onAction={() => handleJoinOnline(session)} />
                                    ))
                                ) : <EmptyState icon={<Video size={48} />} title="No Live Classes" message="Your virtual classroom is currently dormant. You'll see active Google Meet sessions here when they go live." />}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'scan' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key="scan_tab">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                                {sessions.filter(s => s.type === 'offline').length > 0 ? (
                                    sessions.filter(s => s.type === 'offline').map(session => (
                                        <StudentSessionCard key={session.id} session={session} onAction={() => { setShowScanner(true); setActiveScanSession(session); }} />
                                    ))
                                ) : <EmptyState icon={<QrCode size={48} />} title="No QR Sessions" message="No physical class sessions are active. When your instructor starts a QR session, it will appear here for scanning." />}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="history_tab">
                            <div style={{ background: 'white', borderRadius: '2rem', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#F8FAFC' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Session Topic</th>
                                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Mode</th>
                                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Security</th>
                                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Timestamp</th>
                                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <p style={{ fontWeight: '800', color: '#1E293B', margin: 0 }}>{r.topic}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>{r.course_title}</p>
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', background: r.type === 'online' ? '#EEF2FF' : '#FFF7ED', color: r.type === 'online' ? '#6366F1' : '#EA580C' }}>
                                                        {r.type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', color: '#10B981' }}>
                                                        {r.gps_verified === 1 && <MapPin size={16} title="Location Verified" />}
                                                        <CheckCircle2 size={16} title="Secure Entry" />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                                                    {new Date(r.join_time).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontWeight: '900', fontSize: '0.85rem' }}>
                                                        <CheckCircle2 size={18} /> PRESENT
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Global Scanner Overlay */}
            <AnimatePresence>
                {showScanner && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                                <h3 style={{ fontWeight: '900', color: '#0F172A', fontSize: '1.1rem', margin: 0 }}>Identity Validation</h3>
                                <button onClick={() => setShowScanner(false)} style={{ background: 'white', border: '1px solid #E2E8F0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><X size={18} /></button>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <QRScanner 
                                    session={activeScanSession}
                                    onClose={() => { setShowScanner(false); setActiveScanSession(null); }} 
                                    onSuccess={() => { setShowScanner(false); setActiveScanSession(null); fetchData(); }} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .pulse { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// --- Specialized UI Components ---

const ActionTab = ({ active, onClick, label, icon, badge, badgeColor }) => (
    <motion.button 
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', 
            background: active ? '#6366F1' : 'white', color: active ? 'white' : '#64748B',
            borderRadius: '16px', border: '1px solid', borderColor: active ? '#6366F1' : '#F1F5F9',
            boxShadow: active ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
            cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s', whiteSpace: 'nowrap',
            position: 'relative'
        }}
    >
        {icon} {label}
        {badge > 0 && (
            <span style={{ 
                background: active ? 'white' : (badgeColor || '#6366F1'), 
                color: active ? (badgeColor || '#6366F1') : 'white',
                fontSize: '0.65rem', padding: '0.2rem 0.45rem', borderRadius: '50%',
                minWidth: '20px', textAlign: 'center', fontWeight: '900'
            }}>
                {badge}
            </span>
        )}
    </motion.button>
);

const StatCard = ({ label, value, color, trend }) => (
    <div style={{ background: 'white', padding: '1.75rem', borderRadius: '2rem', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            {trend && <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#10B981', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{trend}</span>}
        </div>
        <p style={{ fontSize: '2.25rem', fontWeight: '900', color: color || '#1E293B', letterSpacing: '-0.04em' }}>{value}</p>
    </div>
);

const StudentSessionCard = ({ session, onAction }) => (
    <motion.div 
        whileHover={{ y: -8 }}
        style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: session.type === 'online' ? '#6366F1' : '#F59E0B' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '16px' }}>
                {session.type === 'online' ? <Video color="#6366F1" size={24} /> : <QrCode color="#F59E0B" size={24} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', color: '#10B981', padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900' }}>
                <div className="pulse" style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div> ACTIVE SESSION
            </div>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{session.topic}</h3>
        <p style={{ color: '#6366F1', fontWeight: '800', marginBottom: '1rem', fontSize: '0.9rem' }}>{session.course_title}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '700' }}>
                <CalendarIcon size={16} /> {new Date(session.start_time).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '700' }}>
                <Clock size={16} /> {session.duration_mins} mins
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '700' }}>
                <Users size={16} /> {session.batch_name || 'All Batches'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '700' }}>
                <User size={16} /> {session.instructor_name}
            </div>
        </div>

        <Button 
            onClick={onAction}
            style={{ width: '100%', padding: '1.1rem', borderRadius: '18px', background: session.type === 'online' ? '#6366F1' : '#F59E0B', display: 'flex', justifyContent: 'center', gap: '0.75rem', fontWeight: '900', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' }}
        >
            {session.type === 'online' ? <><ExternalLink size={20} /> Join Meeting Now</> : <><QrCode size={20} /> Open Identity Scanner</>}
        </Button>
    </motion.div>
);

const EmptyState = ({ icon, title, message }) => (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '2.5rem', border: '2px dashed #E2E8F0' }}>
        <div style={{ color: '#94A3B8', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>{message}</p>
    </div>
);

const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default StudentAttendance;
