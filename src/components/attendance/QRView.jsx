import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Users, Maximize2, Minimize2,
    RefreshCw, ShieldCheck, AlertTriangle, Wifi, Lock
} from 'lucide-react';
import api from '../../services/api';

const QRView = ({ sessionId, topic }) => {
    const [qrToken, setQrToken] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const REFRESH_INTERVAL = 30; // seconds between QR refresh

    const refreshData = useCallback(async () => {
        try {
            setRefreshing(true);
            const [tokenRes, countRes] = await Promise.all([
                api.get(`attendance/sessions/${sessionId}/token`),
                api.get(`attendance/sessions/${sessionId}/count`)
            ]);
            setQrToken(tokenRes.data.token);
            setAttendanceCount(countRes.data.count);
            setTimeLeft(REFRESH_INTERVAL);
            setLastRefreshed(new Date());
            setLoading(false);
        } catch (error) {
            console.error("Failed to refresh QR data:", error);
        } finally {
            setRefreshing(false);
        }
    }, [sessionId]);

    useEffect(() => {
        refreshData();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    refreshData();
                    return REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [sessionId, refreshData]);

    const timerPercent = (timeLeft / REFRESH_INTERVAL) * 100;
    const timerColor = timeLeft > 15 ? '#10B981' : timeLeft > 8 ? '#F59E0B' : '#EF4444';

    if (isFullscreen) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
                zIndex: 9999, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
                {/* Close Button */}
                <button
                    onClick={() => setIsFullscreen(false)}
                    style={{
                        position: 'absolute', top: '2rem', right: '2rem',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.85rem', fontWeight: '700'
                    }}
                >
                    <Minimize2 size={18} /> Exit Projector Mode
                </button>

                {/* Live Indicator */}
                <div style={{
                    position: 'absolute', top: '2rem', left: '2rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '12px', padding: '0.5rem 1rem'
                }}>
                    <motion.div
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}
                    />
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#10B981' }}>LIVE SESSION</span>
                </div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        {topic}
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#94A3B8', fontWeight: '500' }}>
                        Open Cynex AI Portal → Attendance → QR Scan
                    </p>
                </motion.div>

                {/* QR Code */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={qrToken}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            padding: '2.5rem', background: 'white', borderRadius: '2.5rem',
                            position: 'relative', boxShadow: '0 0 120px rgba(99, 102, 241, 0.25)',
                            marginBottom: '3rem'
                        }}
                    >
                        {loading || refreshing ? (
                            <div style={{ width: 400, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <RefreshCw size={60} color="#6366F1" />
                                </motion.div>
                                <p style={{ color: '#64748B', fontWeight: '700', fontSize: '1.1rem' }}>Generating secure token...</p>
                            </div>
                        ) : (
                            <QRCodeSVG value={qrToken} size={400} level="H" includeMargin={true} />
                        )}

                        {/* Timer Badge */}
                        <div style={{
                            position: 'absolute', bottom: '-20px', right: '-20px',
                            width: '70px', height: '70px', borderRadius: '50%',
                            background: timerColor, color: 'white',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '900', border: '5px solid white',
                            fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            {timeLeft}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <FStat icon={<Users size={28} />} label="Students Scanned" value={attendanceCount} />
                    <FStat icon={<Clock size={28} />} label="Next Refresh" value={`${timeLeft}s`} color={timerColor} />
                    <FStat icon={<ShieldCheck size={28} />} label="Security" value="JWT-AES-256" color="#10B981" />
                    <FStat icon={<Lock size={28} />} label="Anti-Replay" value="Enabled" color="#8B5CF6" />
                </div>

                {/* Bottom security info */}
                <div style={{
                    position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#475569', fontSize: '0.8rem'
                }}>
                    <ShieldCheck size={14} /> JWT token • One-use per student • Auto-expires
                </div>
            </div>
        );
    }

    // Normal (inline) mode
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Security Badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#EEF2FF', color: '#4338CA', padding: '0.4rem 0.8rem',
                borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800'
            }}>
                <ShieldCheck size={13} /> JWT-Signed • Anti-Replay • Auto-Refreshes
            </div>

            {/* Topic */}
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.25rem' }}>{topic}</h2>
                <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Scan via Cynex AI Portal → Attendance → QR Scan</p>
            </div>

            {/* QR Code Container */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={qrToken}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        padding: '1.5rem', background: 'white', borderRadius: '2rem',
                        boxShadow: '0 10px 40px rgba(99,102,241,0.08)', position: 'relative',
                        border: '2px solid #E2E8F0'
                    }}
                >
                    {loading ? (
                        <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={48} style={{ animation: 'qrspin 1s linear infinite', color: '#6366F1' }} />
                        </div>
                    ) : (
                        <QRCodeSVG value={qrToken} size={220} level="H" includeMargin={true} />
                    )}

                    {/* Timer Badge */}
                    <div style={{
                        position: 'absolute', bottom: '-14px', right: '-14px',
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: timerColor, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', border: '4px solid white', fontSize: '1.1rem',
                        transition: 'background 0.5s'
                    }}>
                        {timeLeft}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <SmallStat icon={<Users size={16} />} label="Present" value={attendanceCount} />
                <SmallStat icon={<Clock size={16} />} label="Refresh" value={`${timeLeft}s`} color={timerColor} />
                <SmallStat icon={<Wifi size={16} />} label="Status" value="Live" color="#10B981" />
            </div>

            {/* Projector Mode Button */}
            <button
                onClick={() => setIsFullscreen(true)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                    border: '2px solid #6366F1', background: 'white',
                    color: '#6366F1', fontWeight: '800', cursor: 'pointer',
                    fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.background = '#6366F1'; e.target.style.color = 'white'; }}
                onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.color = '#6366F1'; }}
            >
                <Maximize2 size={16} /> Enter Projector Mode (Fullscreen)
            </button>

            {lastRefreshed && (
                <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </p>
            )}

            <style>{`@keyframes qrspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const FStat = ({ icon, label, value, color }) => (
    <div style={{
        textAlign: 'center', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '1.5rem 2.5rem', borderRadius: '1.5rem', minWidth: '180px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: color || '#94A3B8', marginBottom: '0.75rem' }}>
            {icon}
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{value}</div>
    </div>
);

const SmallStat = ({ icon, label, value, color }) => (
    <div style={{
        textAlign: 'center', background: '#F8FAFC', padding: '0.75rem 1.25rem',
        borderRadius: '1rem', minWidth: '90px', border: '1px solid #F1F5F9'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: color || '#64748B', marginBottom: '0.3rem' }}>
            {icon}
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: color || '#1E293B' }}>{value}</div>
    </div>
);

export default QRView;
