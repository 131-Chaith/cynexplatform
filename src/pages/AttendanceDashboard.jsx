import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Users, Video, QrCode, TrendingUp, Calendar, 
    ChevronRight, Plus, X, Download, FileText, 
    BarChart3, Clock, MapPin, CheckCircle2, AlertCircle,
    Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight,
    RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRView from '../components/attendance/QRView';
import QRScanner from '../components/attendance/QRScanner';
import OnlineAttendanceManager from '../components/attendance/OnlineAttendanceManager';
import AttendanceReports from '../components/attendance/AttendanceReports';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area, LineChart, Line
} from 'recharts';

const ActionTab = ({ active, onClick, label, icon }) => (
    <motion.button 
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.5rem', 
            background: active ? '#6366F1' : 'white', color: active ? 'white' : '#64748B',
            borderRadius: '12px', border: '1px solid', borderColor: active ? '#6366F1' : '#F1F5F9',
            boxShadow: active ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
            cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
    >
        {icon}
        <span>{label}</span>
    </motion.button>
);

const AttendanceDashboard = () => {
    const { currentUser: user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // State
    const [sessions, setSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeQR, setActiveQR] = useState(null);
    const [liveMonitorSession, setLiveMonitorSession] = useState(null); // {id, topic}
    const [liveRecords, setLiveRecords] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBatch, setFilterBatch] = useState('all');

    // Derived State (Sub-module based on URL)
    const currentPath = location.pathname;
    const isDashboard = currentPath.includes('/dashboard') || currentPath.endsWith('/attendance');
    const isOnline = currentPath.includes('/online');
    const isOffline = currentPath.includes('/offline');
    const isReports = currentPath.includes('/reports') || currentPath.includes('/history');
    const isAnalytics = currentPath.includes('/analytics');

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [user, currentPath]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sessionsRes, statsRes, historyRes] = await Promise.all([
                api.get('attendance/sessions/active'),
                api.get('attendance/analytics'),
                api.get('attendance/history/my')
            ]);
            setSessions(sessionsRes.data || []);
            setStats(statsRes.data);
            setHistory(historyRes.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStopSession = async (sessionId) => {
        if (!window.confirm('Stop this session? Students will no longer be able to scan after this.')) return;
        try {
            await api.post(`attendance/sessions/${sessionId}/stop`);
            fetchData();
        } catch (err) {
            alert('Failed to stop session: ' + err.message);
        }
    };

    const handleExport = () => {

        // Simple CSV Export Logic
        const headers = ["Topic", "Course", "Date", "Status", "Duration"];
        const rows = history.map(r => [
            r.topic, r.course_title, new Date(r.start_time).toLocaleDateString(), "Present", "45m"
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_report.csv");
        document.body.appendChild(link);
        link.click();
    };

    // Sub-Module: Dashboard Overview
    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <StatCard icon={<Users color="#6366f1" />} label="Total Present Today" value="142" trend="+12%" positive={true} />
                <StatCard icon={<Video color="#10b981" />} label="Meet Engagement" value="92%" trend="+4.5%" positive={true} />
                <StatCard icon={<QrCode color="#f59e0b" />} label="QR Scans" value="58" trend="-2%" positive={false} />
                <StatCard icon={<TrendingUp color="#ef4444" />} label="Avg. Attendance" value="84.2%" trend="+0.8%" positive={true} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <Card title="Attendance Trend (30 Days)" badge="Real-time">
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={stats?.trends || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Session Distribution">
                    <div style={{ height: '350px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Online', value: 65 },
                                        { name: 'Offline', value: 35 }
                                    ]}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    <Cell fill="#6366f1" />
                                    <Cell fill="#10b981" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
                            <LegendItem color="#6366f1" label="Online Meet" value="65%" />
                            <LegendItem color="#10b981" label="QR Offline" value="35%" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    // Sub-Module: Reports & History
    const renderReports = () => (
        <Card title="Attendance Records Explorer" 
            action={
                <Button onClick={handleExport} variant="outline" style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <Download size={16} /> Export CSV
                </Button>
            }
        >
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                        type="text" 
                        placeholder="Search student, topic or batch..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }}
                    />
                </div>
                <select 
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', minWidth: '150px' }}
                >
                    <option value="all">All Batches</option>
                    <option value="march-2024">March 2024</option>
                </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #F3F4F6' }}>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Session Topic</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Course</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Time & Date</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record, idx) => (
                            <motion.tr 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={record.id} 
                                style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.2s' }}
                            >
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: '700', color: '#1E293B', marginBottom: '0.1rem' }}>{record.topic}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>by {record.instructor_name}</p>
                                </td>
                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>{record.course_title}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                                        backgroundColor: record.type === 'online' ? '#EEF2FF' : '#FFF7ED',
                                        color: record.type === 'online' ? '#6366F1' : '#F59E0B'
                                    }}>
                                        {record.type.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>{new Date(record.join_time).toLocaleDateString()}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(record.join_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: '700', fontSize: '0.85rem' }}>
                                        <CheckCircle2 size={16} /> Present
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
    // Main Layout Render
    return (
        <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            {/* Top Navigation / Breadcrumbs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        Attendance {isDashboard ? 'Dashboard' : isOnline ? 'Online Integration' : isOffline ? 'Offline Scanning' : isReports ? 'Reports' : isAnalytics ? 'Analytics' : 'Management'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748B', fontSize: '0.9rem' }}>
                        <Calendar size={16} />
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button 
                        onClick={fetchData}
                        variant="outline" 
                        style={{ padding: '0.75rem', borderRadius: '12px', background: 'white' }}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    {(user.role === 'admin' || user.role === 'instructor') && (
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{ background: 'var(--primary-gradient)', padding: '0.75rem 1.5rem', borderRadius: '12px', display: 'flex', gap: '0.5rem', fontWeight: '700' }}
                        >
                            <Plus size={20} /> Launch New Class
                        </Button>
                    )}
                </div>
            </div>

            {/* Sub Navigation Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <ActionTab active={isDashboard} onClick={() => navigate('/admin/attendance/dashboard')} label="Overview" icon={<TrendingUp size={18} />} />
                <ActionTab active={isOnline} onClick={() => navigate('/admin/attendance/online')} label="Online Mode" icon={<Video size={18} />} />
                <ActionTab active={isOffline} onClick={() => navigate('/admin/attendance/offline')} label="Offline Mode" icon={<QrCode size={18} />} />
                <ActionTab active={isAnalytics} onClick={() => navigate('/admin/attendance/analytics')} label="Analytics" icon={<Search size={18} />} />
                <ActionTab active={isReports} onClick={() => navigate('/admin/attendance/reports')} label="Reports" icon={<FileText size={18} />} />

            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid var(--primary)', borderRadius: '50%' }}></div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {isDashboard && renderOverview()}

                    {isOnline && (
                        <div>
                            {/* Live Sessions */}
                            {sessions.filter(s => s.type === 'online' && s.status === 'ongoing').length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ECFDF5', color: '#059669', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem' }}>● LIVE</span> Active Sessions
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                        {sessions.filter(s => s.type === 'online' && s.status === 'ongoing').map(session => (
                                            <SessionCard key={session.id} session={session} role={user.role} onMonitor={() => setLiveMonitorSession(session)} onStop={handleStopSession} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Google Meet Management */}
                            <OnlineAttendanceManager userRole={user.role} />
                        </div>
                    )}
                    {isOffline && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                            {sessions.filter(s => s.type === 'offline').map(session => (
                                <SessionCard key={session.id} session={session} role={user.role} onViewQR={() => setActiveQR(session)} onMonitor={() => setLiveMonitorSession(session)} onStop={handleStopSession} />
                            ))}
                            {sessions.filter(s => s.type === 'offline').length === 0 && <EmptyState type="offline" />}
                        </div>
                    )}
                    {(isReports || isDashboard) && isReports && <AttendanceReports />}

                </div>
            )}

            {/* Overlays */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateSessionModal 
                        onClose={() => setIsCreateModalOpen(false)} 
                        onSubmit={async (data) => {
                            try {
                                await api.post('attendance/sessions', data);
                                setIsCreateModalOpen(false);
                                if (data.type === 'online') {
                                    navigate('/admin/attendance/online');
                                } else {
                                    navigate('/admin/attendance/offline');
                                }
                                fetchData();
                            } catch (err) {
                                alert("Initialization failed: " + err.message);
                            }
                        }} 
                    />
                )}
                {activeQR && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '600px', overflow: 'hidden' }}>
                            <div style={{ padding: '2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>Dynamic QR Gateway</h3>
                                <button onClick={() => setActiveQR(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={28} /></button>
                            </div>
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <QRView sessionId={activeQR.id} topic={activeQR.topic} />
                                <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '1rem', background: '#F8FAFC', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="pulse" style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '50%' }}></div>
                                    <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Token active • Auto-refreshes in 30s</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .pulse { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
            `}</style>
        </div>
    );
};

// --- Specialized UI Components ---

const StatCard = ({ icon, label, value, trend, positive }) => (
    <motion.div 
        whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}
        style={{ padding: '1.75rem', background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.8rem', background: '#F8FAFC', borderRadius: '14px', color: '#6366f1' }}>{icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: positive ? '#10B981' : '#EF4444', background: positive ? '#ECFDF5' : '#FEF2F2', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
            </div>
        </div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</h4>
        <p style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</p>
    </motion.div>
);

const Card = ({ title, badge, action, children }) => (
    <div style={{ background: 'white', borderRadius: '1.75rem', padding: '2rem', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A' }}>{title}</h3>
                {badge && <span style={{ padding: '0.25rem 0.6rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>{badge}</span>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

const LegendItem = ({ color, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: color }}></div>
            <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>{label}</span>
        </div>
        <span style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.9rem' }}>{value}</span>
    </div>
);

const SessionCard = ({ session, role, onViewQR, onMonitor, onStop }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        style={{ background: 'white', borderRadius: '1.75rem', overflow: 'hidden', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}
    >
        <div style={{ height: '8px', background: session.type === 'online' ? '#6366F1' : '#F59E0B' }}></div>
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.75rem', fontWeight: '800' }}>
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} /> LIVE NOW
                </div>
                <button
                    onClick={onMonitor}
                    style={{ background: '#F1F5F9', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#6366F1' }}
                    title="Live Monitor"
                >
                    <TrendingUp size={18} />
                </button>
            </div>
            <h4 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem' }}>{session.topic}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                    <Users size={14} /> <span>{session.course_title} • {session.instructor_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                    <Clock size={14} /> <span>Started at {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button
                    onClick={() => session.type === 'online' ? window.open(session.meet_link, '_blank') : onViewQR()}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: session.type === 'online' ? '#6366F1' : '#F59E0B', display: 'flex', justifyContent: 'center', gap: '0.75rem', fontWeight: '800' }}
                >
                    {session.type === 'online' ? <><Video size={18} /> Meet</> : <><QrCode size={18} /> Show QR</>}
                </Button>
                {(role === 'admin' || role === 'instructor') && onStop && (
                    <Button
                        onClick={() => onStop(session.id)}
                        variant="outline"
                        style={{ padding: '0.8rem 1rem', borderRadius: '12px', fontWeight: '800', color: '#EF4444', borderColor: '#FCA5A5' }}
                        title="Stop Session"
                    >
                        ⏹ Stop
                    </Button>
                )}
            </div>
        </div>
    </motion.div>
);

const LiveMonitorOverlay = ({ session, records, onClose, onManualMark }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>Live Presence Monitor</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>{session.topic} • {records.length} Students Present</p>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={28} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #F3F4F6' }}>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>Student</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>Scan Time</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>Device/IP</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>GPS</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r, idx) => (
                            <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={r.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem' }}>{r.student_name?.[0]}</div>
                                        <div>
                                            <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.9rem' }}>{r.student_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{r.student_email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>{new Date(r.join_time).toLocaleTimeString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>{r.device_info}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{r.ip_address}</p>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: r.gps_verified ? '#10B981' : '#F59E0B' }}>
                                        <MapPin size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{r.gps_verified ? 'Verified' : 'Bypassed'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#ECFDF5', color: '#10B981', fontSize: '0.7rem', fontWeight: '800' }}>PRESENT</span>
                                </td>
                            </motion.tr>
                        ))}
                        {records.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Waiting for first scan...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div style={{ padding: '1.5rem 2rem', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="pulse" style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>Live Connection Active • Syncing every 5s</span>
                </div>
                <Button variant="outline" onClick={onClose} style={{ padding: '0.6rem 1.5rem' }}>Close Monitor</Button>
            </div>
        </motion.div>
    </div>
);

const EmptyState = ({ type }) => (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: '#F8FAFC', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}>
        <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#94A3B8' }}>
            {type === 'online' ? <Video size={40} /> : <QrCode size={40} />}
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.75rem' }}>No active {type} classes</h3>
        <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto' }}>Curriculum architecture is currently dormant. Launch a new session to begin tracking.</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#6366f1' }}>{payload[0].value} Students</p>
            </div>
        );
    }
    return null;
};

const CreateSessionModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        type: 'online',
        topic: '',
        course_id: '',
        batch_id: '',
        duration_mins: 60,
        threshold_percentage: 75,
        gps_validation: false
    });

    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        const fetchMeta = async () => {
            const [cRes, bRes] = await Promise.all([api.get('courses'), api.get('batches')]);
            setCourses(cRes.data || []);
            setBatches(bRes.data || []);
            if (cRes.data?.length > 0) setFormData(prev => ({...prev, course_id: cRes.data[0].id}));
            if (bRes.data?.length > 0) setFormData(prev => ({...prev, batch_id: bRes.data[0].id}));
        };
        fetchMeta();
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A' }}>Initialize Session</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div onClick={() => setFormData({...formData, type: 'online'})} style={{ flex: 1, padding: '1.5rem', borderRadius: '1.25rem', border: formData.type === 'online' ? '2px solid #6366F1' : '1px solid #E2E8F0', background: formData.type === 'online' ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                            <Video size={24} color={formData.type === 'online' ? '#6366F1' : '#94A3B8'} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ fontWeight: '800', fontSize: '0.8rem', color: formData.type === 'online' ? '#6366F1' : '#64748B' }}>ONLINE MEET</p>
                        </div>
                        <div onClick={() => setFormData({...formData, type: 'offline'})} style={{ flex: 1, padding: '1.5rem', borderRadius: '1.25rem', border: formData.type === 'offline' ? '2px solid #F59E0B' : '1px solid #E2E8F0', background: formData.type === 'offline' ? '#FFFBEB' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                            <QrCode size={24} color={formData.type === 'offline' ? '#F59E0B' : '#94A3B8'} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ fontWeight: '800', fontSize: '0.8rem', color: formData.type === 'offline' ? '#F59E0B' : '#64748B' }}>QR OFFLINE</p>
                        </div>
                    </div>

                    {/* Offline QR info banner */}
                    {formData.type === 'offline' && (
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '1rem', fontSize: '0.82rem', color: '#92400E', lineHeight: '1.5' }}>
                            <strong>📋 How QR Attendance Works:</strong><br/>
                            System generates a rotating JWT-signed QR (refreshes every 30s, valid 10 min). Students scan via their portal browser — no app needed. One-use per student prevents replay attacks.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Session Topic</label>
                        <input 
                            type="text" 
                            placeholder="e.g. System Design Mastery" 
                            value={formData.topic}
                            onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '1rem', fontWeight: '500', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Course</label>
                            <select 
                                value={formData.course_id}
                                onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '600' }}
                            >
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Batch</label>
                            <select 
                                value={formData.batch_id}
                                onChange={(e) => setFormData({...formData, batch_id: e.target.value})}
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '600' }}
                            >
                                <option value="">Select Batch</option>
                                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Duration (Mins)</label>
                            <input 
                                type="number" 
                                value={formData.duration_mins}
                                onChange={(e) => setFormData({...formData, duration_mins: e.target.value})}
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Threshold %</label>
                            <input 
                                type="number" 
                                value={formData.threshold_percentage}
                                onChange={(e) => setFormData({...formData, threshold_percentage: e.target.value})}
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* GPS Validation Toggle (offline only) */}
                    {formData.type === 'offline' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1E293B' }}>📍 GPS Radius Validation</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Verify student is physically present (150m radius)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, gps_validation: !formData.gps_validation})}
                                style={{
                                    width: '48px', height: '26px', borderRadius: '13px',
                                    background: formData.gps_validation ? '#6366F1' : '#E2E8F0',
                                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '3px',
                                    left: formData.gps_validation ? '25px' : '3px',
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    background: 'white', transition: 'left 0.3s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </button>
                        </div>
                    )}

                    <Button
                        onClick={() => onSubmit(formData)}
                        style={{ background: 'var(--primary-gradient)', padding: '1rem', borderRadius: '12px', fontWeight: '900', marginTop: '1rem' }}
                    >
                        🚀 INITIALIZE ENGINE
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default AttendanceDashboard;
