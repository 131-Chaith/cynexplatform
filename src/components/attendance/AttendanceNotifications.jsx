import React from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const AttendanceNotifications = ({ notifications }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={20} color="#6366F1" /> Notifications
                </h3>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366F1', cursor: 'pointer' }}>Mark all as read</span>
            </div>

            {notifications.length > 0 ? notifications.map((notif, idx) => (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    style={{ 
                        padding: '1.25rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #F1F5F9',
                        display: 'flex', gap: '1rem', alignItems: 'flex-start'
                    }}
                >
                    <div style={{ 
                        padding: '0.6rem', borderRadius: '10px', 
                        background: notif.type === 'warning' ? '#FEF2F2' : '#F0F9FF',
                        color: notif.type === 'warning' ? '#EF4444' : '#0284C7'
                    }}>
                        {notif.type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <h4 style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.95rem' }}>{notif.title}</h4>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(notif.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.4' }}>{notif.message}</p>
                    </div>
                </motion.div>
            )) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '1.5rem', border: '2px dashed #E2E8F0' }}>
                    <Bell size={40} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#94A3B8', fontWeight: '700' }}>No new notifications</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceNotifications;
