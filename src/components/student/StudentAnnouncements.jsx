import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import { Bell, Calendar, User, Megaphone, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
        
        // Auto-sync every 30 seconds to reflect new broadcasts
        const interval = setInterval(fetchAnnouncements, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('announcements/student');
            setAnnouncements(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <Bell size={32} style={{ color: '#2563eb' }} /> Announcements
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Stay updated with the latest system broadcasts and squadron updates.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Clock size={48} style={{ color: '#94a3b8' }} />
                    </motion.div>
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Syncing with command center...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: '#f8fafc', borderRadius: '2rem', border: '2px dashed #e2e8f0' }}>
                    <Megaphone size={64} style={{ color: '#cbd5e1', marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#64748b' }}>All clear! No new announcements.</h3>
                    <p style={{ color: '#94a3b8' }}>We'll notify you when there's something new to share.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {announcements.map((ann, i) => (
                            <motion.div
                                key={ann.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card style={{ padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                    {/* Accent Bar */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#2563eb' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {ann.target_type === 'all' ? 'System Broadcast' : 'Direct Message'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>
                                                    <Calendar size={14} /> {new Date(ann.publish_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>{ann.title}</h2>
                                        </div>
                                    </div>

                                    <div style={{ color: '#475569', lineHeight: '1.7', fontSize: '1rem', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
                                        {ann.message}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                <User size={18} />
                                            </div>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <span style={{ color: '#94a3b8', fontWeight: '500' }}>Posted by </span>
                                                <span style={{ color: '#1e293b', fontWeight: '700' }}>{ann.author_name}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                                            <Clock size={14} /> {new Date(ann.publish_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StudentAnnouncements;
