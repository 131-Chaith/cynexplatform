import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    QrCode, Users, Clock, RefreshCw, Activity, CheckCircle2, 
    Download, Trash2, Edit3, Shield, BarChart2, ChevronDown, XCircle, Plus, X
} from 'lucide-react';
import api from '../../services/api';
import QRView from './QRView';

const STATUS_STYLES = {
    present:  { bg: '#ECFDF5', color: '#059669', label: 'Present' },
    absent:   { bg: '#FEF2F2', color: '#DC2626', label: 'Absent' },
    partial:  { bg: '#FFFBEB', color: '#D97706', label: 'Partial' },
    excused:  { bg: '#EEF2FF', color: '#6366F1', label: 'Excused' },
};

const OfflineAttendanceManager = ({ userRole }) => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [report, setReport] = useState(null);
    const [overrideRecord, setOverrideRecord] = useState(null);
    const [overrideStatus, setOverrideStatus] = useState('');
    const [overrideRemarks, setOverrideRemarks] = useState('');
    const [overriding, setOverriding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [activeQR, setActiveQR] = useState(null);

    const showMsg = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 4000);
    };

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const [completedRes, activeRes] = await Promise.all([
                api.get('attendance/sessions?type=offline&status=completed'),
                api.get('attendance/sessions?type=offline&status=ongoing')
            ]);
            setSessions([...(activeRes.data || []), ...(completedRes.data || [])]);
        } catch (e) {
            showMsg('Failed to load sessions', 'error');
        } finally { setLoading(false); }
    };

    const fetchReport = async (sessionId) => {
        try {
            const res = await api.get(`attendance/sessions/${sessionId}/report`);
            setReport(res.data);
        } catch (e) { showMsg('Failed to load report', 'error'); }
    };

    useEffect(() => { 
        fetchSessions(); 
        const interval = setInterval(() => {
            // Only poll if not currently loading or pulling
            if (!loading) fetchSessions();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedSession) fetchReport(selectedSession.id);
        else setReport(null);
    }, [selectedSession]);

    const handleOverride = async () => {
        if (!overrideRecord || !overrideStatus) return;
        setOverriding(true);
        try {
            await api.put(`attendance/records/${overrideRecord.id}/override`, {
                status: overrideStatus, remarks: overrideRemarks
            });
            showMsg('Record updated successfully');
            setOverrideRecord(null);
            fetchReport(selectedSession.id);
        } catch (e) {
            showMsg(e.response?.data?.message || 'Override failed', 'error');
        } finally { setOverriding(false); }
    };

    const handleDelete = async (sessionId, e) => {
        if(e) e.stopPropagation();
        if (!window.confirm('Delete this session and ALL its attendance records? This cannot be undone.')) return;
        try {
            await api.delete(`attendance/sessions/${sessionId}`);
            showMsg('Session deleted');
            if (selectedSession?.id === sessionId) setSelectedSession(null);
            fetchSessions();
        } catch (e) { showMsg('Delete failed', 'error'); }
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({});

    const handleEditClick = (session, e) => {
        if(e) e.stopPropagation();
        setEditForm({ ...session });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`attendance/sessions/${editForm.id}`, editForm);
            showMsg('Session updated successfully');
            setIsEditModalOpen(false);
            if (selectedSession?.id === editForm.id) setSelectedSession({ ...selectedSession, ...editForm });
            fetchSessions();
        } catch (e) {
            showMsg('Failed to update session', 'error');
        }
    };

    const handleEndSession = async (sessionId, e) => {
        if(e) e.stopPropagation();
        try {
            await api.post(`attendance/sessions/${sessionId}/stop`);
            showMsg('Session marked as completed');
            fetchSessions();
        } catch (e) { showMsg('Failed to end session', 'error'); }
    };

    const exportCSV = () => {
        if (!report?.records?.length) return;
        
        const headers = ['Student', 'Email', 'Status', 'Time', 'Type', 'Remarks'];
        
        // Helper to escape CSV values
        const csvEscape = (val) => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const rows = report.records.map(r => [
            csvEscape(r.student_name),
            csvEscape(r.student_email),
            csvEscape(r.status),
            csvEscape(r.join_time ? new Date(r.join_time).toLocaleString() : 'N/A'),
            csvEscape(r.attendance_type),
            csvEscape(r.remarks || '')
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_report_${selectedSession.topic.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSessionCard = (s, isActive) => (
        <div key={s.id} style={{ 
            background: 'white', borderRadius: '1.25rem', overflow: 'hidden', 
            border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
            marginBottom: '1.5rem', position: 'relative' 
        }}>
            {/* Card Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <h3 style={{ fontWeight: '800', color: '#1E293B', margin: 0, fontSize: '1.1rem' }}>{s.topic}</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={(e) => handleEditClick(s, e)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }} title="Edit">
                        <Edit3 size={20} />
                    </button>
                    <button onClick={(e) => handleDelete(s.id, e)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }} title="Delete">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>
                            <span>{new Date(s.start_time).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                            <span>|</span>
                            <span>{new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            <span>|</span>
                            <span>{s.duration_mins} min</span>
                            {isActive ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', padding: '0.25rem 0.6rem', background: '#FEF3C7', color: '#D97706', borderRadius: '1rem', fontWeight: '800' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }} />
                                    Active QR Mode
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', padding: '0.25rem 0.6rem', background: '#F1F5F9', color: '#64748B', borderRadius: '1rem', fontWeight: '800' }}>
                                    <CheckCircle2 size={12} />
                                    Completed Class
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', color: '#64748B', fontSize: '0.9rem', fontWeight: '500' }}>
                            <span>{s.course_title}</span>
                            <span>•</span>
                            <span>{s.batch_name || 'All Batches'}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {isActive && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveQR(s); }}
                                    style={{ 
                                        padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none', 
                                        background: '#F59E0B', color: 'white', fontWeight: '800', fontSize: '0.85rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                                    }}
                                >
                                    <QrCode size={18} /> Show QR
                                </button>
                                <button 
                                    onClick={(e) => handleEndSession(s.id, e)}
                                    style={{ 
                                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                        background: 'white', color: '#475569', fontWeight: '700', fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Stop Session
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Clickable area for details */}
                <div 
                    onClick={() => setSelectedSession(s)}
                    style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 0 }} 
                />
            </div>
        </div>
    );

    const activeSessions = sessions.filter(s => s.status === 'ongoing' || s.status === 'active');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Toast */}
            <AnimatePresence>
                {msg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                            padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: '700',
                            background: msg.type === 'error' ? '#FEF2F2' : '#ECFDF5',
                            color: msg.type === 'error' ? '#DC2626' : '#059669',
                            border: `1px solid ${msg.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '400px'
                        }}
                    >{msg.text}</motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {/* Active Sessions */}
                <section>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Current Active QR Classes</h2>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading active sessions...</div>
                    ) : activeSessions.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '1.5rem', border: '2px dashed #E2E8F0' }}>
                            <p style={{ color: '#94A3B8', fontWeight: '600' }}>No active offline classes at the moment.</p>
                        </div>
                    ) : (
                        activeSessions.map(s => renderSessionCard(s, true))
                    )}
                </section>

                {/* Completed Sessions */}
                <section>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>History</h2>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading history...</div>
                    ) : completedSessions.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>No completed sessions found.</div>
                    ) : (
                        completedSessions.map(s => renderSessionCard(s, false))
                    )}
                </section>

                {/* Session Report Modal */}
                <AnimatePresence>
                    {selectedSession && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.98)', zIndex: 1000, overflowY: 'auto', padding: '3rem 2rem' }}>
                            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                    <div>
                                        <button onClick={() => setSelectedSession(null)} style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: 0 }}>
                                            <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} /> Back to Dashboard
                                        </button>
                                        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>{selectedSession.topic}</h2>
                                        <p style={{ color: '#64748B', margin: '0.5rem 0 0', fontWeight: '600' }}>{selectedSession.course_title} • Batch: {selectedSession.batch_name || 'N/A'}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '700' }}>
                                            <Download size={18} /> Export CSV
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {/* Records Table */}
                                    {report?.records && (
                                        <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9' }}>
                                                <h4 style={{ margin: 0, fontWeight: '800', color: '#1E293B' }}>Scanned Student Records</h4>
                                            </div>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                                            {['Student', 'Scan Time', 'Status', 'Security', 'Actions'].map(h => (
                                                                <th key={h} style={{ padding: '1rem', color: '#64748B', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {report.records.map((r, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <p style={{ margin: 0, fontWeight: '700', color: '#1E293B' }}>{r.student_name}</p>
                                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>{r.student_email}</p>
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569' }}>{r.join_time ? new Date(r.join_time).toLocaleTimeString() : 'N/A'}</td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <span style={{ 
                                                                        padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: '800', fontSize: '0.7rem',
                                                                        background: r.status === 'present' ? '#F0FDF4' : '#FEF2F2',
                                                                        color: r.status === 'present' ? '#10B981' : '#EF4444'
                                                                    }}>{r.status.toUpperCase()}</span>
                                                                </td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                                        <Shield size={16} color="#6366F1" title="Token Verified" />
                                                                        {r.gps_lat && <Activity size={16} color="#10B981" title="GPS Logged" />}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <button 
                                                                        onClick={() => { setOverrideRecord(r); setOverrideStatus(r.status); }}
                                                                        style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
                                                                    >Edit</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* QR Gateway Modal */}
                <AnimatePresence>
                    {activeQR && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '600px', padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>QR Gateway: {activeQR.topic}</h3>
                                    <button onClick={() => setActiveQR(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={28} /></button>
                                </div>
                                <QRView sessionId={activeQR.id} topic={activeQR.topic} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals for Edit/Override */}
            <AnimatePresence>
                {overrideRecord && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '1.75rem', padding: '2rem', width: '100%', maxWidth: '440px' }}>
                            <h3 style={{ fontWeight: '900', color: '#1E293B', marginBottom: '0.25rem' }}>Manual Override</h3>
                            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Change status for <strong>{overrideRecord.student_name}</strong></p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {['present', 'absent', 'partial', 'excused'].map(s => (
                                        <button key={s} onClick={() => setOverrideStatus(s)}
                                            style={{ 
                                                padding: '0.6rem 1.25rem', borderRadius: '12px', border: '2px solid',
                                                borderColor: overrideStatus === s ? '#6366F1' : '#E2E8F0',
                                                background: overrideStatus === s ? '#EEF2FF' : 'white',
                                                color: overrideStatus === s ? '#6366F1' : '#64748B',
                                                fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize' 
                                            }}
                                        >{s}</button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setOverrideRecord(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                                    <button onClick={handleOverride} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: '#6366F1', color: 'white', cursor: 'pointer', fontWeight: '800' }}>Save</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isEditModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '1.75rem', padding: '2rem', width: '100%', maxWidth: '440px' }}>
                            <h3 style={{ fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem' }}>Edit Session</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <input type="text" value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} placeholder="Topic" style={{ padding: '0.875rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                <input type="number" value={editForm.duration_mins} onChange={e => setEditForm({...editForm, duration_mins: e.target.value})} placeholder="Duration (min)" style={{ padding: '0.875rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                                    <button onClick={handleSaveEdit} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: '#6366F1', color: 'white', cursor: 'pointer', fontWeight: '800' }}>Save Changes</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OfflineAttendanceManager;
