import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import {
    TableProperties, Link2, CheckCircle, AlertTriangle, Loader2,
    X, Shield, RefreshCw, LogOut, Info, FileSpreadsheet, Download
} from 'lucide-react';

const GoogleSheetsAttendanceSync = ({ classes, onSyncComplete, onClose }) => {
    // Auth state
    const [authStatus, setAuthStatus] = useState(null); // null=loading, true=connected, false=disconnected
    const [authLoading, setAuthLoading] = useState(false);

    // Sync state
    const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    // ── Check Auth Status on Mount ─────────────────────────────────────────
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const res = await api.get('/youtube/status'); // Using the same status check
            setAuthStatus(res.data.connected);
        } catch {
            setAuthStatus(false);
        }
    };

    const handleConnect = async () => {
        setAuthLoading(true);
        try {
            const res = await api.get('/youtube/auth-url');
            window.location.href = res.data.authUrl;
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message;
            alert('Failed to get auth URL: ' + errorMsg);
            setAuthLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect your Google account?')) return;
        try {
            await api.delete('/youtube/disconnect');
            setAuthStatus(false);
        } catch (e) {
            alert('Failed to disconnect: ' + e.message);
        }
    };

    const handleSync = async () => {
        if (!spreadsheetUrl.trim()) return alert('Please enter a Spreadsheet URL or ID');
        if (!selectedClassId) return alert('Please select a class to sync for');

        setSyncing(true);
        setSyncResult(null);

        try {
            const res = await api.post('/attendance/sync-gsheets', {
                class_id: selectedClassId,
                spreadsheet_url: spreadsheetUrl.trim(),
                sheet_name: sheetName.trim() || 'Sheet1'
            });
            setSyncResult({ success: true, message: res.data.message, count: res.data.count });
            if (onSyncComplete) onSyncComplete();
        } catch (e) {
            setSyncResult({ success: false, message: e.response?.data?.message || e.message });
        } finally {
            setSyncing(false);
        }
    };

    // ── STYLES ────────────────────────────────────────────────────────────
    const S = {
        overlay: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        },
        modal: {
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '1.5rem',
            width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)'
        },
        header: {
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            zIndex: 10,
            borderRadius: '1.5rem 1.5rem 0 0'
        },
        body: { padding: '1.75rem 2rem' },
        section: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.25rem'
        },
        label: { fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'block' },
        input: {
            width: '100%', padding: '0.7rem 1rem',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.625rem', color: '#f8fafc', fontSize: '0.9rem',
            outline: 'none', boxSizing: 'border-box'
        },
        select: {
            width: '100%', padding: '0.7rem 1rem',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.625rem', color: '#f8fafc', fontSize: '0.9rem',
            outline: 'none', boxSizing: 'border-box'
        },
        btn: (color = '#38bdf8') => ({
            padding: '0.6rem 1.25rem', borderRadius: '0.625rem', border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: '#0f172a', fontWeight: '800', fontSize: '0.8rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            letterSpacing: '0.03em', transition: 'all 0.2s'
        }),
        ghostBtn: {
            padding: '0.6rem 1rem', borderRadius: '0.625rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }
    };

    return (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <motion.div
                style={S.modal}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
            >
                {/* Header */}
                <div style={S.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '0.625rem', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <FileSpreadsheet size={20} color="#4ade80" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f8fafc' }}>Sync Google Sheets Attendance</h2>
                            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Import attendance from Google Meet spreadsheet data</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={S.body}>
                    {/* Google Auth Status */}
                    <div style={S.section}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={16} color="#38bdf8" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc' }}>Google Status</span>
                                {authStatus === null && <Loader2 size={14} color="#64748b" style={{ animation: 'spin 1s linear infinite' }} />}
                                {authStatus === true && <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800', color: '#4ade80' }}>CONNECTED</span>}
                                {authStatus === false && <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800', color: '#f87171' }}>DISCONNECTED</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {authStatus === false && (
                                    <button style={S.btn('#4ade80')} onClick={handleConnect} disabled={authLoading}>
                                        <Shield size={14} /> Connect
                                    </button>
                                )}
                                {authStatus === true && (
                                    <button style={{ ...S.ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }} onClick={handleDisconnect}>Disconnect</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ opacity: authStatus ? 1 : 0.4, pointerEvents: authStatus ? 'auto' : 'none' }}>
                        {/* Target Class Selection */}
                        <div style={S.section}>
                            <label style={S.label}>Target Class</label>
                            <select 
                                style={S.select} 
                                value={selectedClassId} 
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">— Select Class —</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.title} ({new Date(cls.schedule).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>

                        {/* Spreadsheet Link */}
                        <div style={S.section}>
                            <label style={S.label}>Google Spreadsheet URL / ID</label>
                            <input
                                style={S.input}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={spreadsheetUrl}
                                onChange={e => setSpreadsheetUrl(e.target.value)}
                            />
                            <div style={{ marginTop: '1rem' }}>
                                <label style={S.label}>Sheet Name (Tab)</label>
                                <input
                                    style={S.input}
                                    placeholder="Sheet1"
                                    value={sheetName}
                                    onChange={e => setSheetName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Result Display */}
                        {syncResult && (
                            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: syncResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${syncResult.success ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {syncResult.success ? <CheckCircle size={16} color="#4ade80" /> : <AlertTriangle size={16} color="#f87171" />}
                                <p style={{ fontSize: '0.82rem', fontWeight: '700', color: syncResult.success ? '#4ade80' : '#f87171' }}>{syncResult.message} ({syncResult.count} students marked present)</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button
                                style={{ ...S.btn(), opacity: (spreadsheetUrl && selectedClassId && !syncing) ? 1 : 0.5 }}
                                onClick={handleSync}
                                disabled={!spreadsheetUrl || !selectedClassId || syncing}
                            >
                                {syncing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                                {syncing ? 'Syncing...' : 'Sync Attendance'}
                            </button>
                        </div>
                    </div>

                    {!authStatus && authStatus !== null && (
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem', textAlign: 'center' }}>
                            <Info size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                            Please connect your Google Account first to access spreadsheets.
                        </p>
                    )}
                </div>
            </motion.div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GoogleSheetsAttendanceSync;
