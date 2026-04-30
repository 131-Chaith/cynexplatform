import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ShieldCheck, AlertCircle, RefreshCw, MapPin, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';

const QRScanner = ({ session, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | scanning | success | error
    const [message, setMessage] = useState('');
    const [gpsData, setGpsData] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(true);
    const scannerRef = React.useRef(null);

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

        // Initialize HTML5 QR Code Scanner
        if (status === 'idle') {
            // Add a small delay to ensure DOM is ready and avoid strict mode double init collision
            const initTimeout = setTimeout(() => {
                if (!document.getElementById("qr-reader")) return;
                
                try {
                    const scanner = new Html5QrcodeScanner(
                        "qr-reader",
                        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
                        /* verbose= */ false
                    );
                    scannerRef.current = scanner;
                    
                    scanner.render(
                        (decodedText) => {
                            if (scannerRef.current) {
                                scannerRef.current.clear().catch(e => console.log(e));
                                scannerRef.current = null;
                            }
                            handleScan(decodedText);
                        },
                        () => {} // ignore errors
                    );
                } catch (err) {
                    console.log("Scanner init error:", err);
                }
            }, 300);

            return () => {
                clearTimeout(initTimeout);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(e => console.log(e));
                    scannerRef.current = null;
                }
            };
        }
    }, [status]);

    const handleScan = async (qrText) => {
        if (!qrText || loading || status === 'success') return;

        try {
            setLoading(true);
            setStatus('scanning');
            setMessage('Verifying with security engine...');

            // Perform Secure Scan with JWT-AES validation
            const payload = {
                qrToken: qrText, 
                gpsData: gpsData,
                deviceInfo: `${navigator.platform} - ${navigator.userAgent.substring(0, 80)}`
            };

            const response = await api.post('attendance/verify', payload);

            if (response.data.status === 'success') {
                setStatus('success');
                setMessage(response.data.message || 'Attendance verified and recorded successfully!');
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                }, 2500);
            } else {
                setStatus('error');
                setMessage(response.data.message || 'Verification failed.');
            }

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
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)',
                            border: '1px solid #C7D2FE', borderRadius: '10px',
                            padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4338CA'
                        }}>
                            <ShieldCheck size={12} />
                            JWT-AES Secured • One-Use Token
                        </div>

                        {session && session.qr_token && (
                            <div style={{ marginBottom: '1rem', background: 'white', padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #6366F1' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6366F1', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Demo Mode: QR Code</p>
                                <QRCodeSVG value={session.qr_token} size={120} />
                                <button 
                                    onClick={() => handleScan(session.qr_token)}
                                    style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}
                                >
                                    Auto-Scan (Simulate)
                                </button>
                            </div>
                        )}

                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.25rem', marginBottom: '0.75rem', background: '#F1F5F9', border: '2px solid #E2E8F0', minHeight: '150px' }}>
                            <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>

                            {/* Clean Scanning Overlay UI */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '220px', pointerEvents: 'none', zIndex: 5 }}>
                                {/* Corner decorations */}
                                <div style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTop: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderRadius: '4px 0 0 0' }} />
                                <div style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTop: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderRadius: '0 4px 0 0' }} />
                                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottom: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderRadius: '0 0 0 4px' }} />
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottom: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderRadius: '0 0 4px 0' }} />
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: gpsData ? '#10B981' : gpsLoading ? '#F59E0B' : '#94A3B8', fontSize: '0.75rem', fontWeight: '700' }}>
                                <MapPin size={12} />
                                {gpsLoading ? 'Acquiring GPS Signal...' : gpsData ? `GPS Sync: ${gpsData.lat.toFixed(2)}, ${gpsData.lng.toFixed(2)}` : 'GPS Optional'}
                            </div>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', margin: 0 }}>
                            Hold the instructor's QR code up to your camera to scan.
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
