import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import {
    Youtube, Link2, CheckCircle, AlertTriangle, Loader2,
    Play, Star, ChevronDown, ChevronRight, SquareCheck, Square,
    Upload, X, Shield, RefreshCw, LogOut, Info, ListVideo
} from 'lucide-react';

const YoutubePlaylistImport = ({ courses, modules, onImportComplete, onClose }) => {
    // Auth state
    const [authStatus, setAuthStatus] = useState(null); // null=loading, true=connected, false=disconnected
    const [authLoading, setAuthLoading] = useState(false);

    // Playlist fetch state
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [fetching, setFetching] = useState(false);
    const [playlistData, setPlaylistData] = useState(null);
    const [fetchError, setFetchError] = useState('');

    // Selection state
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Assignment state
    const [targetCourseId, setTargetCourseId] = useState('');
    const [targetModuleId, setTargetModuleId] = useState('');
    const [filteredModules, setFilteredModules] = useState([]);

    // Import state
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // ── Check Auth Status on Mount ─────────────────────────────────────────
    useEffect(() => {
        checkAuthStatus();
        // Check for OAuth callback result in URL
        const params = new URLSearchParams(window.location.search);
        const ytAuth = params.get('youtube_auth');
        if (ytAuth === 'success') {
            checkAuthStatus();
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // ── Filter modules when course changes ────────────────────────────────
    useEffect(() => {
        if (targetCourseId) {
            setFilteredModules((modules || []).filter(m => String(m.course_id) === String(targetCourseId)));
        } else {
            setFilteredModules([]);
        }
        setTargetModuleId('');
    }, [targetCourseId, modules]);

    const checkAuthStatus = async () => {
        try {
            const res = await api.get('/youtube/status');
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
        if (!window.confirm('Disconnect your Google account? You will need to re-authenticate to import playlists.')) return;
        try {
            await api.delete('/youtube/disconnect');
            setAuthStatus(false);
            setPlaylistData(null);
            setSelectedVideos(new Set());
        } catch (e) {
            alert('Failed to disconnect: ' + e.message);
        }
    };

    const handleFetchPlaylist = async () => {
        if (!playlistUrl.trim()) return;
        setFetching(true);
        setPlaylistData(null);
        setFetchError('');
        setSelectedVideos(new Set());
        setSelectAll(false);

        try {
            const res = await api.get('/youtube/playlist', { params: { url: playlistUrl.trim() } });
            setPlaylistData(res.data);
            // Auto-select all by default
            const allIds = new Set(res.data.videos.map(v => v.videoId));
            setSelectedVideos(allIds);
            setSelectAll(true);
        } catch (e) {
            setFetchError(e.response?.data?.message || e.message);
        } finally {
            setFetching(false);
        }
    };

    const toggleVideo = (videoId) => {
        setSelectedVideos(prev => {
            const next = new Set(prev);
            if (next.has(videoId)) next.delete(videoId);
            else next.add(videoId);
            return next;
        });
    };

    const handleToggleAll = () => {
        if (selectAll) {
            setSelectedVideos(new Set());
            setSelectAll(false);
        } else {
            setSelectedVideos(new Set(playlistData.videos.map(v => v.videoId)));
            setSelectAll(true);
        }
    };

    useEffect(() => {
        if (!playlistData) return;
        setSelectAll(selectedVideos.size === playlistData.videos.length);
    }, [selectedVideos, playlistData]);

    const handleImport = async () => {
        if (!targetCourseId) return alert('Please select a target course first');
        if (selectedVideos.size === 0) return alert('Please select at least one video');

        setImporting(true);
        setImportResult(null);

        const selectedList = playlistData.videos.filter(v => selectedVideos.has(v.videoId));

        try {
            const res = await api.post('/youtube/import', {
                playlistId: playlistData.playlistId,
                playlistTitle: playlistData.playlistTitle,
                courseId: targetCourseId,
                moduleId: targetModuleId || null,
                videos: selectedList
            });
            setImportResult({ success: true, message: res.data.message, count: res.data.count });
            if (onImportComplete) onImportComplete();
        } catch (e) {
            setImportResult({ success: false, message: e.response?.data?.message || e.message });
        } finally {
            setImporting(false);
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
            width: '100%', maxWidth: '900px',
            maxHeight: '90vh', overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)'
        },
        header: {
            padding: '1.75rem 2rem',
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
            letterSpacing: '0.03em'
        }),
        ghostBtn: {
            padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem',
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
                        <div style={{ width: '38px', height: '38px', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <Youtube size={20} color="#f87171" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f8fafc' }}>Import YouTube Playlist</h2>
                            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Bulk-import videos from your private or public YouTube playlists</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={S.body}>
                    {/* ── STEP 1: Google Auth ─────────────────────────────── */}
                    <div style={S.section}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={16} color="#38bdf8" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc' }}>Google Account</span>
                                {authStatus === null && <Loader2 size={14} color="#64748b" style={{ animation: 'spin 1s linear infinite' }} />}
                                {authStatus === true && <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800', color: '#4ade80' }}>● CONNECTED</span>}
                                {authStatus === false && <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800', color: '#f87171' }}>● DISCONNECTED</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {authStatus === false && (
                                    <button style={S.btn('#4ade80')} onClick={handleConnect} disabled={authLoading}>
                                        {authLoading ? <Loader2 size={14} /> : <Shield size={14} />}
                                        {authLoading ? 'Redirecting...' : 'Connect Google Account'}
                                    </button>
                                )}
                                {authStatus === true && (
                                    <>
                                        <button style={S.ghostBtn} onClick={checkAuthStatus}><RefreshCw size={13} /> Refresh</button>
                                        <button style={{ ...S.ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }} onClick={handleDisconnect}><LogOut size={13} /> Disconnect</button>
                                    </>
                                )}
                            </div>
                        </div>
                        {authStatus === false && (
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', lineHeight: '1.6' }}>
                                ⚠️ Connect your Google account to import private playlists. You'll be redirected to Google's sign-in page. Your credentials are never stored — only an OAuth token is kept securely.
                            </p>
                        )}
                    </div>

                    {/* ── STEP 2: Paste Playlist URL ────────────────────────── */}
                    <div style={{ ...S.section, opacity: authStatus ? 1 : 0.4, pointerEvents: authStatus ? 'auto' : 'none' }}>
                        <label style={S.label}><ListVideo size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Playlist URL or ID</label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                style={S.input}
                                placeholder="https://www.youtube.com/playlist?list=PL... or paste Playlist ID"
                                value={playlistUrl}
                                onChange={e => { setPlaylistUrl(e.target.value); setPlaylistData(null); setFetchError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleFetchPlaylist()}
                            />
                            <button style={S.btn()} onClick={handleFetchPlaylist} disabled={fetching || !playlistUrl.trim()}>
                                {fetching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                                {fetching ? 'Fetching...' : 'Fetch'}
                            </button>
                        </div>
                        {fetchError && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <p style={{ fontSize: '0.8rem', color: '#f87171' }}>{fetchError}</p>
                            </div>
                        )}
                    </div>

                    {/* ── STEP 3: Playlist Preview ──────────────────────────── */}
                    <AnimatePresence>
                        {playlistData && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Already Imported Warning */}
                                {playlistData.alreadyImported && (
                                    <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <AlertTriangle size={16} color="#fb923c" />
                                        <div>
                                            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fb923c' }}>Playlist Already Imported</p>
                                            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>This playlist was imported on {new Date(playlistData.importedAt).toLocaleDateString()}. Re-importing will add duplicate videos — select carefully or use "Update" flow.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Playlist Info Card */}
                                <div style={{ ...S.section, display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    {playlistData.playlistThumbnail && (
                                        <img src={playlistData.playlistThumbnail} alt="playlist" style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }} />
                                    )}
                                    <div>
                                        <p style={{ fontSize: '1rem', fontWeight: '900', color: '#f8fafc', marginBottom: '0.2rem' }}>{playlistData.playlistTitle}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>🎬 {playlistData.totalVideos} videos found</p>
                                    </div>
                                </div>

                                {/* Video List */}
                                <div style={S.section}>
                                    {/* List Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '800' }} onClick={handleToggleAll}>
                                                {selectAll ? <SquareCheck size={18} /> : <Square size={18} />}
                                                {selectAll ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>
                                            {selectedVideos.size} / {playlistData.totalVideos} selected
                                        </span>
                                    </div>

                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {playlistData.videos.map((video, idx) => {
                                            const isSelected = selectedVideos.has(video.videoId);
                                            return (
                                                <div
                                                    key={video.videoId}
                                                    onClick={() => toggleVideo(video.videoId)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                        padding: '0.6rem 0.75rem', borderRadius: '0.625rem', cursor: 'pointer',
                                                        background: isSelected ? 'rgba(56,189,248,0.08)' : 'rgba(0,0,0,0.2)',
                                                        border: isSelected ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(255,255,255,0.04)',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {isSelected ? <SquareCheck size={16} color="#38bdf8" style={{ flexShrink: 0 }} /> : <Square size={16} color="#475569" style={{ flexShrink: 0 }} />}
                                                    <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: '700', width: '24px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                                                    {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width: '44px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
                                                    <span style={{ fontSize: '0.82rem', color: isSelected ? '#f8fafc' : '#64748b', fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {video.title}
                                                    </span>
                                                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                                                        <Play size={13} />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── STEP 4: Assign + Import ───────────────────── */}
                                <div style={S.section}>
                                    <label style={S.label}>Assign to Course & Module</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ ...S.label, marginBottom: '0.4rem' }}>Course *</label>
                                            <select style={S.select} value={targetCourseId} onChange={e => setTargetCourseId(e.target.value)}>
                                                <option value="">— Select Course —</option>
                                                {(courses || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ ...S.label, marginBottom: '0.4rem' }}>Module (optional)</label>
                                            <select style={{ ...S.select, opacity: filteredModules.length ? 1 : 0.4 }} value={targetModuleId} onChange={e => setTargetModuleId(e.target.value)} disabled={!filteredModules.length}>
                                                <option value="">— Course-level (no module) —</option>
                                                {filteredModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Import Result */}
                                    {importResult && (
                                        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: importResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${importResult.success ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            {importResult.success ? <CheckCircle size={16} color="#4ade80" /> : <AlertTriangle size={16} color="#f87171" />}
                                            <p style={{ fontSize: '0.82rem', fontWeight: '700', color: importResult.success ? '#4ade80' : '#f87171' }}>{importResult.message}</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                                            <Info size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                            Videos will be added in playlist order
                                        </p>
                                        <button
                                            style={{ ...S.btn(selectedVideos.size > 0 && targetCourseId ? '#38bdf8' : '#334155'), opacity: (selectedVideos.size > 0 && targetCourseId && !importing) ? 1 : 0.5 }}
                                            onClick={handleImport}
                                            disabled={!targetCourseId || selectedVideos.size === 0 || importing}
                                        >
                                            {importing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing...</> : <><Upload size={14} /> Import {selectedVideos.size} Video{selectedVideos.size !== 1 ? 's' : ''}</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default YoutubePlaylistImport;
