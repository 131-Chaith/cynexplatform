import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Users, Video, QrCode, TrendingUp, Calendar, 
    ChevronRight, Plus, X, Download, FileText, 
    BarChart3, Clock, MapPin, CheckCircle2, AlertCircle,
    Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight,
    RefreshCw, ShieldCheck, Shield, Activity
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRView from '../components/attendance/QRView';
import QRScanner from '../components/attendance/QRScanner';
import OnlineAttendanceManager from '../components/attendance/OnlineAttendanceManager';
import OfflineAttendanceManager from '../components/attendance/OfflineAttendanceManager';
import AdminAttendance from '../components/admin/AdminAttendance';
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
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeQR, setActiveQR] = useState(null);
    const [dashboardAnalytics, setDashboardAnalytics] = useState(null);

    const currentPath = location.pathname;
    const isDashboard = currentPath.includes('/analytics') || currentPath.endsWith('/attendance') || currentPath.endsWith('/dashboard');
    const isOnline = currentPath.includes('/online');
    const isOffline = currentPath.includes('/offline');
    const isReports = currentPath.includes('/reports');

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 60000); // Polling every 60s for stability
            return () => clearInterval(interval);
        }
    }, [user, currentPath]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [sessionsRes, statsRes, batchesRes, analyticsRes] = await Promise.all([
                api.get('attendance/sessions/active'),
                api.get('attendance/analytics'),
                api.get('batches'),
                api.get('attendance/analytics-dashboard')
            ]);

            setSessions(sessionsRes.data || []);
            setStats(statsRes.data);
            setBatches(batchesRes.data || []);
            
            // Fetch history separately to support filtering
            await fetchHistory(selectedBatch);
            
            if (analyticsRes.data?.status === 'error') {
                console.warn("Analytics partial failure:", analyticsRes.data.message);
            }
            setDashboardAnalytics(analyticsRes.data);
        } catch (error) {
            console.error("Fetch error:", error);
            setError(error.response?.data?.message || "Failed to sync with attendance server.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (batchId) => {
        try {
            const historyRes = await api.get(`attendance/history/my?batch_id=${batchId}`);
            setHistory(historyRes.data || []);
        } catch (error) {
            console.error("History fetch error:", error);
        }
    };

    useEffect(() => {
        if (user && isReports) {
            fetchHistory(selectedBatch);
        }
    }, [selectedBatch, isReports]);

    const handleStopSession = async (sessionId) => {
        if (!window.confirm('Stop this session? Students will no longer be able to scan after this.')) return;
        try {
            await api.post(`attendance/sessions/${sessionId}/stop`);
            fetchData();
        } catch (err) {
            alert('Failed to stop session: ' + err.message);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get(`attendance/reports/export?batch_id=${selectedBatch}`);
            const rawData = res.data;
            if (!rawData || rawData.length === 0) return alert('No data to export.');
            
            const headers = Object.keys(rawData[0]);
            
            // Helper to escape CSV values
            const csvEscape = (val) => {
                if (val === null || val === undefined) return '';
                const s = String(val);
                if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                    return `"${s.replace(/"/g, '""')}"`;
                }
                return s;
            };

            const rows = rawData.map(obj => headers.map(header => csvEscape(obj[header])));
            
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `attendance_batch_${selectedBatch}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('Failed to export data: ' + error.message);
        }
    };

    // Sub-Module: Dashboard Overview
    const renderOverview = () => {
        if (error) {
            return (
                <div style={{ padding: '4rem', textAlign: 'center', background: '#FEF2F2', borderRadius: '2rem', border: '1px solid #FEE2E2' }}>
                    <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991B1B', marginBottom: '0.5rem' }}>Connection Interrupted</h3>
                    <p style={{ color: '#B91C1C', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>{error}</p>
                    <Button onClick={fetchData} style={{ background: '#EF4444', color: 'white', borderRadius: '12px', padding: '0.75rem 2rem' }}>
                        <RefreshCw size={18} style={{ marginRight: '0.5rem' }} /> Reconnect Now
                    </Button>
                </div>
            );
        }

        const trendsData = stats?.trends || [];
        const hasTrends = trendsData.length > 0;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Quick Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <StatCard 
                        icon={<Users size={24} />} 
                        label="Active Presence" 
                        value={dashboardAnalytics?.summary?.activePresence || "0"} 
                        trend="+12.5%" 
                        positive={true} 
                        color="#6366F1"
                    />
                    <StatCard 
                        icon={<Video size={24} />} 
                        label="Meet Engagement" 
                        value={`${dashboardAnalytics?.summary?.meetEngagement || 0}%`} 
                        trend="+5.2%" 
                        positive={true} 
                        color="#10B981"
                    />
                    <StatCard 
                        icon={<QrCode size={24} />} 
                        label="Offline Scans" 
                        value={dashboardAnalytics?.summary?.offlineScans || "0"} 
                        trend="-2.4%" 
                        positive={false} 
                        color="#F59E0B"
                    />
                    <StatCard 
                        icon={<TrendingUp size={24} />} 
                        label="Success Rate" 
                        value={`${dashboardAnalytics?.summary?.successRate || 0}%`} 
                        trend="+1.2%" 
                        positive={true} 
                        color="#EC4899"
                    />
                </div>

                {/* Main Charts Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <Card 
                            title="Attendance Pulse" 
                            badge="30 Day Trend"
                            action={
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', fontSize: '0.75rem', fontWeight: '700' }}>Daily</button>
                                    <button style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #6366F1', background: '#EEF2FF', color: '#6366F1', fontSize: '0.75rem', fontWeight: '700' }}>Weekly</button>
                                </div>
                            }
                        >
                            <div style={{ height: '380px', width: '100%', minHeight: '300px', marginTop: '1rem', position: 'relative' }}>
                                {hasTrends ? (
                                    <ResponsiveContainer width="99%" height="99%">
                                        <AreaChart data={trendsData}>
                                            <defs>
                                                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                                                dx={-10}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366F1', strokeWidth: 2 }} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke="#6366F1" 
                                                strokeWidth={4} 
                                                fillOpacity={1} 
                                                fill="url(#attendanceGradient)" 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.9rem', fontWeight: '600' }}>
                                        No trend data available for the selected period.
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <Card title="Mode Split">
                        <div style={{ height: '250px', width: '100%', minHeight: '200px', position: 'relative' }}>
                            <ResponsiveContainer width="99%" height="99%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Online', value: dashboardAnalytics?.summary?.meetEngagement || 50 },
                                            { name: 'Offline', value: 100 - (dashboardAnalytics?.summary?.meetEngagement || 50) }
                                        ]}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#6366F1" />
                                        <Cell fill="#10B981" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            <LegendItem color="#6366F1" label="Digital Classroom" value={`${dashboardAnalytics?.summary?.meetEngagement || 0}%`} />
                            <LegendItem color="#10B981" label="Physical Session" value={`${100 - (dashboardAnalytics?.summary?.meetEngagement || 0)}%`} />
                        </div>
                    </Card>
                </div>

                {/* Recent Activity Section */}
                <Card title="Recent Activity Feed" badge="Live">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F8FAFC' }}>
                                <tr>
                                    {['Student', 'Session Topic', 'Mode', 'Time', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(dashboardAnalytics?.recentActivity || []).length > 0 ? (
                                    dashboardAnalytics.recentActivity.map((record, idx) => (
                                        <tr key={record.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '1rem', fontWeight: '700', fontSize: '0.85rem' }}>{record.student_name}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>{record.topic}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', background: record.mode === 'online' ? '#EEF2FF' : '#FFF7ED', color: record.mode === 'online' ? '#6366F1' : '#F59E0B' }}>
                                                    {record.mode?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(record.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', background: record.status === 'present' ? '#DCFCE7' : record.status === 'absent' ? '#FEE2E2' : '#FEF9C3', color: record.status === 'present' ? '#16A34A' : record.status === 'absent' ? '#DC2626' : '#CA8A04' }}>
                                                    {record.status?.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>No recent activity records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    // Sub-Module: Reports & History
    const renderReports = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid #F1F5F9', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Batch</label>
                    <select 
                        value={selectedBatch} 
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.85rem', background: '#F8FAFC', fontWeight: '700', outline: 'none' }}
                    >
                        <option value="all">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                    </select>
                </div>
                <button onClick={handleExport} style={{ height: '46px', padding: '0 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Export Records
                </button>
            </div>

            <Card title="Attendance Ledger">
                <div style={{ overflowX: 'auto', margin: '0 -1.5rem -1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                {['Student', 'Batch', 'Topic', 'Mode', 'Time', 'Status', 'Security'].map(h => (
                                    <th key={h} style={{ padding: '1rem 1.5rem', color: '#64748B', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>{record.student_name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ padding: '0.2rem 0.5rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.7rem', color: '#475569', fontWeight: '600' }}>
                                            {record.batch_name || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{record.topic}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', background: record.type === 'online' ? '#EEF2FF' : '#FFF7ED', color: record.type === 'online' ? '#6366F1' : '#EA580C' }}>
                                            {record.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <p style={{ fontWeight: '700', margin: 0 }}>{new Date(record.session_start || record.join_time).toLocaleDateString()}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>{new Date(record.session_start || record.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem', background: record.status === 'present' ? '#ECFDF5' : '#FEF2F2', color: record.status === 'present' ? '#059669' : '#DC2626' }}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            {record.gps_verified && <ShieldCheck size={14} color="#10B981" />}
                                            <Shield size={14} color="#6366F1" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        Attendance System
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748B', fontSize: '0.9rem' }}>
                        <Calendar size={16} />
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => fetchData()} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', background: 'white' }}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
                    </Button>
                    {(user.role === 'admin' || user.role === 'instructor') && (
                        <Button onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontWeight: '900' }}>
                            <Plus size={20} /> Launch Class
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <ActionTab active={isDashboard} onClick={() => navigate('/admin/attendance/dashboard')} label="Overview" icon={<TrendingUp size={18} />} />
                <ActionTab active={isOnline} onClick={() => navigate('/admin/attendance/online')} label="Online Mode" icon={<Video size={18} />} />
                <ActionTab active={isOffline} onClick={() => navigate('/admin/attendance/offline')} label="Offline Mode" icon={<QrCode size={18} />} />
                <ActionTab active={isReports} onClick={() => navigate('/admin/attendance/reports')} label="Reports" icon={<FileText size={18} />} />
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                    <RefreshCw size={40} className="spin" color="#6366F1" />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {isDashboard && renderOverview()}
                    {isOnline && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <OnlineAttendanceManager 
                                key={`online-mgr-${sessions.map(s => s.id + s.status).join('-')}`} 
                                userRole={user.role} 
                            />
                        </div>
                    )}
                    {isOffline && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <OfflineAttendanceManager 
                                key={`offline-mgr-${sessions.map(s => s.id + s.status).join('-')}`} 
                                userRole={user.role} 
                            />
                        </div>
                    )}
                    {isReports && renderReports()}
                </div>
            )}

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateSessionModal onClose={() => setIsCreateModalOpen(false)} onSubmit={async (data) => {
                        try {
                            await api.post('attendance/sessions', data);
                            setIsCreateModalOpen(false);
                            // Explicitly navigate based on session type
                            if (data.type === 'online') {
                                navigate('/admin/attendance/online');
                            } else {
                                navigate('/admin/attendance/offline');
                            }
                            fetchData();
                        } catch (err) { alert(err.message); }
                    }} />
                )}
                {activeQR && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '600px', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>QR Gateway</h3>
                                <button onClick={() => setActiveQR(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={28} /></button>
                            </div>
                            <QRView sessionId={activeQR.id} topic={activeQR.topic} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// --- Sub Components ---

const StatCard = ({ icon, label, value, trend, positive, color }) => (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ color }}>{icon}</div>
            <div style={{ color: positive ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: '800' }}>{trend}</div>
        </div>
        <h4 style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</h4>
        <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>{value}</p>
    </div>
);

const Card = ({ title, badge, action, children }) => (
    <div style={{ background: 'white', borderRadius: '1.75rem', padding: '1.5rem', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900' }}>{title}</h3>
                {badge && <span style={{ padding: '0.2rem 0.5rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '6px', fontSize: '0.6rem', fontWeight: '800' }}>{badge}</span>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

const LegendItem = ({ color, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{label}</span>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{value}</span>
    </div>
);

const SessionCard = ({ session, role, onViewQR, onStop }) => (
    <motion.div
        whileHover={{ y: -5 }}
        style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}
    >
        <div style={{ height: '6px', background: session.type === 'online' ? '#6366F1' : '#F59E0B' }}></div>
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>
                    <div className="pulse" style={{ width: '6px', height: '6px', background: '#059669', borderRadius: '50%' }} /> LIVE
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>{session.type} Mode</span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.25rem' }}>{session.topic}</h4>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.25rem' }}>{session.course_title}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#64748B', fontSize: '0.7rem' }}>
                <Clock size={12} />
                <span>Started at {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                    onClick={() => {
                        if (session.type === 'online') {
                            if (!session.meet_link) return alert('No meeting link provided for this session.');
                            const url = session.meet_link.startsWith('http') ? session.meet_link : `https://${session.meet_link}`;
                            window.open(url, '_blank');
                        } else {
                            onViewQR();
                        }
                    }} 
                    style={{ flex: 1, background: session.type === 'online' ? '#6366F1' : '#F59E0B', fontSize: '0.8rem', fontWeight: '800', height: '40px' }}
                >
                    {session.type === 'online' ? <><Video size={14} /> Join Meet</> : <><QrCode size={14} /> Show QR</>}
                </Button>
                {onStop && (
                    <Button 
                        onClick={() => onStop(session.id)} 
                        variant="outline" 
                        style={{ color: '#EF4444', borderColor: '#FEE2E2', background: '#FEF2F2', fontSize: '0.8rem', fontWeight: '800', width: '80px', height: '40px' }}
                    >Stop</Button>
                )}
            </div>
        </div>
    </motion.div>
);

const EmptyState = ({ type }) => (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#F8FAFC', borderRadius: '1.5rem', border: '2px dashed #E2E8F0' }}>
        <p style={{ color: '#64748B' }}>No active {type} classes found.</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8' }}>{label}</p>
                <p style={{ fontSize: '1rem', fontWeight: '900', color: '#6366F1' }}>{payload[0].value} Present</p>
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
        start_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().slice(0,5),
        meet_link: ''
    });
    const [generatingLink, setGeneratingLink] = useState(false);
    const [authStatus, setAuthStatus] = useState('unknown'); // 'unknown', 'missing', 'connected'
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);

    const generateLink = async () => {
        if (formData.type !== 'online') return;
        setGeneratingLink(true);
        try {
            const res = await api.get(`attendance/generate-meet?topic=${formData.topic || 'Class Session'}&duration=${formData.duration_mins}`);
            if (res.data.meetLink) {
                setFormData(prev => ({ ...prev, meet_link: res.data.meetLink }));
                setAuthStatus(res.data.errorType === 'AUTH_MISSING' ? 'missing' : 'connected');
            }
        } catch (err) {
            console.error("Link generation failed", err);
            setAuthStatus('error');
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await api.get('attendance/google/auth-url');
            if (res.data.url === 'mocked') {
                await api.post('attendance/google/callback', { code: 'mock_code_123' });
                alert('Google Account Mock Connected Successfully!');
                setAuthStatus('connected');
                generateLink();
                return;
            }
            window.open(res.data.url, '_blank');
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            if (msg === 'GOOGLE_OAUTH_NOT_CONFIGURED') {
                alert('CRITICAL: Google OAuth is not configured in the server/.env file. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google Meet features.');
            } else {
                alert('Failed to get auth URL: ' + msg);
            }
        }
    };

    useEffect(() => {
        if (formData.type === 'online' && !formData.meet_link) {
            generateLink();
        }
    }, [formData.type]);

    useEffect(() => {
        api.get('courses').then(res => setCourses(res.data));
        api.get('batches').then(res => setBatches(res.data));
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '480px', padding: '1.75rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Exit Icon */}
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#F8FAFC', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 10 }}
                    onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseOut={e => e.currentTarget.style.background = '#F8FAFC'}
                >
                    <X size={16} color="#64748B" />
                </button>

                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A', marginBottom: '1.5rem', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>New Session</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', background: '#F1F5F9', padding: '0.35rem', borderRadius: '12px' }}>
                        <button onClick={() => setFormData({...formData, type: 'online'})} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', background: formData.type === 'online' ? 'white' : 'transparent', color: formData.type === 'online' ? '#6366F1' : '#64748B', boxShadow: formData.type === 'online' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Online</button>
                        <button onClick={() => setFormData({...formData, type: 'offline'})} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', background: formData.type === 'offline' ? 'white' : 'transparent', color: formData.type === 'offline' ? '#F59E0B' : '#64748B', boxShadow: formData.type === 'offline' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Offline</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic</label>
                        <input type="text" placeholder="e.g. AI Architecture" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Date</label>
                            <input 
                                type="date" 
                                value={formData.start_date} 
                                onChange={e => setFormData({...formData, start_date: e.target.value})} 
                                style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.85rem', width: '100%' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Start</label>
                            <input 
                                type="time" 
                                value={formData.start_time} 
                                onChange={e => setFormData({...formData, start_time: e.target.value})} 
                                style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.85rem', width: '100%' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>Duration (min)</label>
                            <input 
                                type="number" 
                                value={formData.duration_mins} 
                                onChange={e => setFormData({...formData, duration_mins: parseInt(e.target.value) || 0})} 
                                style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.85rem', width: '100%' }} 
                            />
                        </div>
                    </div>

                    {formData.type === 'online' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Google Meet Link</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {generatingLink && <span style={{ fontSize: '0.6rem', color: '#6366F1' }}>Generating...</span>}
                                    <button 
                                        type="button"
                                        onClick={generateLink}
                                        disabled={generatingLink}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                                        title="Regenerate Link"
                                    >
                                        <RefreshCw size={14} className={generatingLink ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </label>
                            <input 
                                type="text" 
                                placeholder={generatingLink ? "Generating link..." : "https://meet.google.com/..."} 
                                value={formData.meet_link || ''} 
                                onChange={e => setFormData({...formData, meet_link: e.target.value})}
                                style={{ 
                                    padding: '0.8rem', 
                                    borderRadius: '10px', 
                                    border: '1px solid #E2E8F0', 
                                    fontSize: '0.85rem', 
                                    outline: 'none', 
                                    background: generatingLink ? '#F8FAFC' : 'white', 
                                    color: '#1E293B',
                                    fontWeight: '600'
                                }} 
                            />
                            {authStatus === 'missing' && !generatingLink && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', color: '#F59E0B', margin: 0 }}>
                                        Google account not connected. Using temporary link.
                                    </p>
                                    <button 
                                        onClick={handleConnectGoogle}
                                        style={{ fontSize: '0.7rem', color: '#6366F1', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                                    >
                                        Connect Google Calendar
                                    </button>
                                </div>
                            )}
                            {!formData.meet_link && !generatingLink && (
                                <p style={{ fontSize: '0.7rem', color: '#EF4444', margin: 0, cursor: 'pointer' }} onClick={generateLink}>
                                    Unable to generate Meet link. <u>Please retry.</u>
                                </p>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.85rem' }}>
                            <option value="">Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <select value={formData.batch_id} onChange={e => setFormData({...formData, batch_id: e.target.value})} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.85rem' }}>
                            <option value="">Batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
                        <Button 
                            onClick={() => onSubmit(formData)} 
                            style={{ padding: '0.9rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontWeight: '900', fontSize: '0.95rem' }}
                        >
                            Start Session
                        </Button>
                        <Button 
                            onClick={onClose} 
                            variant="outline" 
                            style={{ padding: '0.8rem', borderRadius: '12px', color: '#64748B', borderColor: '#E2E8F0', fontWeight: '800', fontSize: '0.9rem' }}
                        >
                            Decline Session
                        </Button>
                    </div>
                </div>
            </div>
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AttendanceDashboard;
