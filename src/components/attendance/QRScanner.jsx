import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ShieldCheck, AlertCircle, RefreshCw, MapPin, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../../services/api';

const QRScanner = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | scanning | success | error
    const [message, setMessage] = useState('');
    const [gpsData, setGpsData] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(true);

    useEffect(() => {
        // Automatically request GPS on mount for speed
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGpsData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGpsLoading(false);
                },
                (err) => {
                    console.warn("GPS Access Denied:", err);
                    setGpsLoading(false);
                },
                { timeout: 8000 }
            );
        } else {
            setGpsLoading(false);
        }
    }, []);

    const handleScan = async (result) => {
        if (!result || loading || status === 'success') return;

        try {
            setLoading(true);
            setStatus('scanning');
            setMessage('Verifying with security engine...');

            // Get active session for the student first (to know which sessionId to scan for)
            const activeRes = await api.get('attendance/sessions/active');
            const session = activeRes.data?.[0]; // Assume scanning for the first active session found

            if (!session) {
                throw new Error("No active attendance sessions found for your batch.");
            }

            if (session.type !== 'offline') {
                throw new Error("No active QR/offline sessions. Ask your instructor to start an offline class.");
            }

            // Perform Secure Scan
            const payload = {
                sessionId: session.id,
                qrToken: result[0].rawValue, // Yudiel scanner returns array of results
                gpsData: gpsData,
                deviceInfo: `${navigator.platform} - ${navigator.userAgent.substring(0, 80)}`
            };

            await api.post('attendance/scan', payload);

            setStatus('success');
            setMessage('Attendance verified and recorded successfully!');
            setTimeout(() => {
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            }, 2500);

        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || error.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setStatus('idle');
        setMessage('');
        setLoading(false);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <AnimatePresence mode="wait">
                {status === 'idle' || status === 'scanning' ? (
                    <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Security Badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)',
                            border: '1px solid #C7D2FE', borderRadius: '12px',
                            padding: '0.5rem 1rem', marginBottom: '1.25rem', fontSize: '0.75rem', fontWeight: '800', color: '#4338CA'
                        }}>
                            <ShieldCheck size={14} />
                            JWT-AES Secured • One-Use Token • Anti-Replay
                        </div>

                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.5rem', marginBottom: '1.25rem', background: '#F1F5F9', border: '2px solid #E2E8F0' }}>
                            <Scanner
                                onScan={handleScan}
                                styles={{ container: { width: '100%', aspectRatio: '1/1' } }}
                                components={{ audio: false, torch: true }}
                            />

                            {/* Scanning Overlay UI */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '40px solid rgba(0,0,0,0.45)', pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', border: '2px solid #6366F1', borderRadius: '12px' }}>
                                {/* Corner decorations */}
                                <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderRadius: '3px 0 0 0' }} />
                                <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderRadius: '0 3px 0 0' }} />
                                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderRadius: '0 0 0 3px' }} />
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderRadius: '0 0 3px 0' }} />
                                <motion.div
                                    animate={{ top: ['5%', '90%', '5%'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                    style={{ position: 'absolute', width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #6366F1, transparent)', boxShadow: '0 0 8px #6366F1' }}
                                />
                            </div>

                            {loading && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                    <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366F1' }} />
                                    <p style={{ marginTop: '1rem', fontWeight: '800', color: '#1E293B' }}>{message}</p>
                                </div>
                            )}
                        </div>

                        {/* GPS Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: gpsData ? '#10B981' : gpsLoading ? '#F59E0B' : '#94A3B8', fontSize: '0.8rem', fontWeight: '700' }}>
                                <MapPin size={14} />
                                {gpsLoading ? 'Acquiring GPS Signal...' : gpsData ? `GPS Synchronized (${gpsData.lat.toFixed(4)}, ${gpsData.lng.toFixed(4)})` : 'GPS Unavailable (Optional)'}
                            </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '500' }}>
                            Point your camera at the QR code displayed by your instructor
                        </p>

                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            style={{ padding: '2rem', borderRadius: '50%', background: status === 'success' ? '#ECFDF5' : '#FEF2F2', color: status === 'success' ? '#10B981' : '#EF4444' }}
                        >
                            {status === 'success' ? <ShieldCheck size={64} /> : <AlertCircle size={64} />}
                        </motion.div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>
                            {status === 'success' ? '✅ Verified!' : 'Verification Failed'}
                        </h3>
                        <p style={{ color: '#64748B', fontWeight: '500', maxWidth: '300px', lineHeight: '1.5' }}>{message}</p>
                        {status === 'error' && (
                            <button
                                onClick={handleRetry}
                                style={{
                                    padding: '0.75rem 2rem', borderRadius: '14px',
                                    background: '#EF4444', color: 'white',
                                    border: 'none', cursor: 'pointer',
                                    fontWeight: '800', fontSize: '0.9rem'
                                }}
                            >
                                Try Again
                            </button>
                        )}
                        {status === 'success' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.85rem', fontWeight: '700' }}>
                                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Redirecting...
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QRScanner;
