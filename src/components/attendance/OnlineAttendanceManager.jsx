import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Download, RefreshCw, CheckCircle2, XCircle,
    AlertCircle, Clock, Users, Edit3, Trash2, ChevronDown,
    Shield, Activity, BarChart2, FileText
} from 'lucide-react';
import api from '../../services/api';

const STATUS_STYLES = {
    present:  { bg: '#ECFDF5', color: '#059669', label: 'Present' },
    absent:   { bg: '#FEF2F2', color: '#DC2626', label: 'Absent' },
    partial:  { bg: '#FFFBEB', color: '#D97706', label: 'Partial' },
    excused:  { bg: '#EEF2FF', color: '#6366F1', label: 'Excused' },
};

const OnlineAttendanceManager = ({ userRole }) => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [report, setReport] = useState(null);
    const [pulling, setPulling] = useState(false);
    const [pullResult, setPullResult] = useState(null);
    const [overrideRecord, setOverrideRecord] = useState(null);
    const [overrideStatus, setOverrideStatus] = useState('');
    const [overrideRemarks, setOverrideRemarks] = useState('');
    const [overriding, setOverriding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    const showMsg = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 4000);
    };

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get('attendance/sessions?type=online&status=completed');
            setSessions(res.data || []);
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

    useEffect(() => { fetchSessions(); }, []);

    useEffect(() => {
        if (selectedSession) fetchReport(selectedSession.id);
        else setReport(null);
    }, [selectedSession]);

    const handlePullMeet = async () => {
        if (!selectedSession) return;
        setPulling(true);
        setPullResult(null);
        try {
            const res = await api.post(`attendance/sessions/${selectedSession.id}/pull-meet`);
            setPullResult(res.data);
            showMsg(`✅ ${res.data.message}`);
            fetchReport(selectedSession.id);
        } catch (e) {
            showMsg(e.response?.data?.message || 'Pull failed', 'error');
        } finally { setPulling(false); }
    };

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

    const handleDelete = async (sessionId) => {
        if (!window.confirm('Delete this session and ALL its attendance records? This cannot be undone.')) return;
        try {
            await api.delete(`attendance/sessions/${sessionId}`);
            showMsg('Session deleted');
            if (selectedSession?.id === sessionId) setSelectedSession(null);
            fetchSessions();
        } catch (e) { showMsg('Delete failed', 'error'); }
    };

    const exportCSV = () => {
        if (!report?.records?.length) return;
        const headers = ['Student', 'Email', 'Status', 'Duration(min)', 'Attendance%', 'Late Join', 'Type', 'Remarks'];
        const rows = report.records.map(r => [
            r.student_name, r.student_email, r.status,
            r.duration_mins || 0, r.attendance_percentage || 0,
            r.late_flag ? 'Yes' : 'No', r.attendance_type, r.remarks || ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `session_${selectedSession?.id}_report.csv`;
        a.click();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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



            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                {/* Sessions List */}
                <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: '900', color: '#1E293B', margin: 0, fontSize: '0.95rem' }}>Completed Sessions</h3>
                        <button onClick={fetchSessions} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1' }}>
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
                        ) : sessions.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                                No completed online sessions.<br />Stop an active session to see it here.
                            </div>
                        ) : sessions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedSession(s)}
                                style={{
                                    padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid #F8FAFC',
                                    background: selectedSession?.id === s.id ? '#EEF2FF' : 'white',
                                    borderLeft: selectedSession?.id === s.id ? '3px solid #6366F1' : '3px solid transparent'
                                }}
                            >
                                <p style={{ fontWeight: '700', color: '#1E293B', marginBottom: '0.2rem', fontSize: '0.9rem' }}>{s.topic}</p>
                                <p style={{ color: '#64748B', fontSize: '0.75rem', margin: 0 }}>{s.course_title} • {new Date(s.start_time).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!selectedSession ? (
                        <div style={{ background: 'white', borderRadius: '1.5rem', border: '2px dashed #E2E8F0', padding: '4rem', textAlign: 'center' }}>
                            <Video size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#94A3B8', fontWeight: '700' }}>Select a session to view report & pull Meet attendance</p>
                        </div>
                    ) : (
                        <>
                            {/* Action Bar */}
                            <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid #F1F5F9', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: '900', color: '#1E293B', margin: '0 0 0.25rem' }}>{selectedSession.topic}</h3>
                                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.8rem' }}>
                                        {selectedSession.course_title} • {selectedSession.duration_mins} min • Threshold: {selectedSession.threshold_percentage}%
                                    </p>
                                </div>
                                <button
                                    onClick={handlePullMeet}
                                    disabled={pulling}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.75rem 1.25rem', borderRadius: '12px',
                                        background: pulling ? '#E2E8F0' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                        color: pulling ? '#94A3B8' : 'white', border: 'none', cursor: pulling ? 'not-allowed' : 'pointer',
                                        fontWeight: '800', fontSize: '0.85rem'
                                    }}
                                >
                                    {pulling ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={16} />}
                                    {pulling ? 'Pulling...' : 'Pull from Google Meet'}
                                </button>
                                <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                                    <Download size={16} /> Export CSV
                                </button>
                                {userRole === 'admin' && (
                                    <button onClick={() => handleDelete(selectedSession.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                                        <Trash2 size={16} /> Delete Session
                                    </button>
                                )}
                            </div>

                            {/* Pull Result */}
                            {pullResult && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: '1rem', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <Shield size={18} color="#059669" />
                                        <strong style={{ color: '#059669' }}>Google Meet Auto-Pull Complete</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#047857' }}>
                                        <span>📥 New records: <strong>{pullResult.pulled}</strong></span>
                                        <span>🔄 Updated: <strong>{pullResult.overridden}</strong></span>
                                        <span>👥 Total students: <strong>{pullResult.total}</strong></span>
                                        <span>📊 Threshold: <strong>{pullResult.threshold}%</strong></span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Summary Cards */}
                            {report?.summary && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { label: 'Present', value: report.summary.present, color: '#059669', bg: '#ECFDF5' },
                                        { label: 'Absent', value: report.summary.absent, color: '#DC2626', bg: '#FEF2F2' },
                                        { label: 'Partial', value: report.summary.partial, color: '#D97706', bg: '#FFFBEB' },
                                        { label: 'Late Joins', value: report.summary.lateJoins, color: '#7C3AED', bg: '#F5F3FF' },
                                        { label: 'Present Rate', value: `${report.summary.presentPercentage}%`, color: '#0284C7', bg: '#F0F9FF' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: s.bg, borderRadius: '1rem', padding: '1rem', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: s.color, textTransform: 'uppercase', margin: '0 0 0.4rem' }}>{s.label}</p>
                                            <p style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color, margin: 0 }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Records Table */}
                            {report?.records?.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BarChart2 size={18} color="#6366F1" />
                                        <h4 style={{ fontWeight: '900', color: '#1E293B', margin: 0 }}>Per-Student Report</h4>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94A3B8' }}>Click Edit to override a record</span>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                                    {['Student', 'Duration', 'Attend%', 'Status', 'Late Join', 'Type', 'Actions'].map(h => (
                                                        <th key={h} style={{ padding: '0.875rem 1rem', color: '#64748B', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.records.map((r, idx) => {
                                                    const st = STATUS_STYLES[r.status] || STATUS_STYLES.absent;
                                                    return (
                                                        <tr key={r.id || idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                <p style={{ fontWeight: '700', color: '#1E293B', margin: '0 0 0.1rem' }}>{r.student_name}</p>
                                                                <p style={{ color: '#94A3B8', fontSize: '0.72rem', margin: 0 }}>{r.student_email}</p>
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>{r.duration_mins || 0} min</td>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', minWidth: '60px' }}>
                                                                        <div style={{ width: `${r.attendance_percentage || 0}%`, height: '100%', background: '#6366F1', borderRadius: '3px' }} />
                                                                    </div>
                                                                    <span style={{ fontWeight: '700', color: '#1E293B' }}>{r.attendance_percentage || 0}%</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                <span style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.72rem', background: st.bg, color: st.color }}>{st.label}</span>
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                {r.late_flag ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D97706', fontWeight: '700', fontSize: '0.75rem' }}>
                                                                        <Clock size={13} /> Late
                                                                    </span>
                                                                ) : <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>—</span>}
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', background: r.attendance_type === 'manual' ? '#F5F3FF' : '#F0F9FF', color: r.attendance_type === 'manual' ? '#7C3AED' : '#0284C7' }}>
                                                                    {r.attendance_type === 'manual' ? '✏️ Manual' : '🤖 Auto'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                                <button
                                                                    onClick={() => { setOverrideRecord(r); setOverrideStatus(r.status); setOverrideRemarks(''); }}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#6366F1', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                                                                >
                                                                    <Edit3 size={13} /> Override
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Override Modal */}
            <AnimatePresence>
                {overrideRecord && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: '1.75rem', padding: '2rem', width: '100%', maxWidth: '440px' }}>
                            <h3 style={{ fontWeight: '900', color: '#1E293B', marginBottom: '0.25rem' }}>Manual Override</h3>
                            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                <strong>{overrideRecord.student_name}</strong> — current: <span style={{ color: STATUS_STYLES[overrideRecord.status]?.color }}>{overrideRecord.status}</span>
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>New Status</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['present', 'absent', 'partial', 'excused'].map(s => (
                                            <button key={s} onClick={() => setOverrideStatus(s)}
                                                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: `2px solid ${overrideStatus === s ? STATUS_STYLES[s].color : '#E2E8F0'}`, background: overrideStatus === s ? STATUS_STYLES[s].bg : 'white', color: overrideStatus === s ? STATUS_STYLES[s].color : '#64748B', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Remarks (optional)</label>
                                    <textarea value={overrideRemarks} onChange={e => setOverrideRemarks(e.target.value)} placeholder="Reason for override..." rows={3}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', resize: 'none', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setOverrideRecord(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                                    <button onClick={handleOverride} disabled={overriding || !overrideStatus}
                                        style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', cursor: overriding ? 'wait' : 'pointer', fontWeight: '800' }}>
                                        {overriding ? 'Saving...' : 'Save Override'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
    );
};

export default OnlineAttendanceManager;
