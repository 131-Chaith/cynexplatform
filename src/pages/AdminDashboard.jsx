import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/Card';
import { Users, BookOpen, Video, Award, MessageSquare, Shield, Activity, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectApprovals from '../components/admin/ProjectApprovals';
import ContentManagement from '../components/admin/ContentManagement';
import AdminAssessments from '../components/admin/AdminAssessments';
import CertificateApprovals from '../components/admin/CertificateApprovals';


const AdminDashboard = () => {
    const { data } = useData();
    const { students = [], courses = [], videos = [], certificates = [] } = data;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Users size={18} /> },
        { id: 'content', label: 'Content Management', icon: <BookOpen size={18} /> },
        { id: 'assessments', label: 'Assessments', icon: <BookOpen size={18} /> },
        { id: 'projects', label: 'Projects', icon: <BookOpen size={18} /> },
        { id: 'approvals', label: 'Certificates', icon: <Award size={18} /> },
        { id: 'announcements', label: 'Announcements', icon: <MessageSquare size={18} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'content': return <ContentManagement />;
            case 'assessments': return <AdminAssessments />;
            case 'projects': return <ProjectApprovals />;
            case 'approvals': return <CertificateApprovals />;
            case 'announcements': return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Announcements Module Coming Soon</div>;
            default: return (
                <>
                    {/* Stats Grid - Holographic 3D */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '3rem', perspective: '1200px' }}>
                        {/* Students Stat */}
                        <motion.div 
                            initial={{ opacity: 0, rotateX: 20, y: 20 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.1, type: 'spring' }}
                            whileHover={{ scale: 1.05, rotateX: -10, rotateY: 5, z: 30 }}
                            style={{ 
                                background: 'linear-gradient(145deg, #0f172a, #1e293b)', 
                                padding: '1.5rem', 
                                borderRadius: '1.25rem', 
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                boxShadow: '0 20px 40px -10px rgba(56, 189, 248, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', transform: 'translateZ(40px)' }}>
                                <div>
                                    <p style={{ color: '#bae6fd', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Operatives</p>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f8fafc', marginTop: '0.25rem', textShadow: '0 0 20px rgba(56, 189, 248, 0.5)' }}>
                                        {students.length}
                                    </h3>
                                </div>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '0.75rem', color: '#38bdf8' }}>
                                    <Users size={32} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Courses Stat */}
                        <motion.div 
                            initial={{ opacity: 0, rotateX: 20, y: 20 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.2, type: 'spring' }}
                            whileHover={{ scale: 1.05, rotateX: -10, rotateY: 5, z: 30 }}
                            style={{ 
                                background: 'linear-gradient(145deg, #0f172a, #1e293b)', 
                                padding: '1.5rem', 
                                borderRadius: '1.25rem', 
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', transform: 'translateZ(40px)' }}>
                                <div>
                                    <p style={{ color: '#a7f3d0', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Programs</p>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f8fafc', marginTop: '0.25rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                                        {courses.length}
                                    </h3>
                                </div>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '0.75rem', color: '#10b981' }}>
                                    <BookOpen size={32} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Videos Stat */}
                        <motion.div 
                            initial={{ opacity: 0, rotateX: 20, y: 20 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.3, type: 'spring' }}
                            whileHover={{ scale: 1.05, rotateX: -10, rotateY: -5, z: 30 }}
                            style={{ 
                                background: 'linear-gradient(145deg, #0f172a, #1e293b)', 
                                padding: '1.5rem', 
                                borderRadius: '1.25rem', 
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                boxShadow: '0 20px 40px -10px rgba(245, 158, 11, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', transform: 'translateZ(40px)' }}>
                                <div>
                                    <p style={{ color: '#fde68a', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Media Assets</p>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f8fafc', marginTop: '0.25rem', textShadow: '0 0 20px rgba(245, 158, 11, 0.5)' }}>
                                        {videos.length}
                                    </h3>
                                </div>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '0.75rem', color: '#f59e0b' }}>
                                    <Video size={32} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Certificates Stat */}
                        <motion.div 
                            initial={{ opacity: 0, rotateX: 20, y: 20 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.4, type: 'spring' }}
                            whileHover={{ scale: 1.05, rotateX: -10, rotateY: -5, z: 30 }}
                            style={{ 
                                background: 'linear-gradient(145deg, #0f172a, #1e293b)', 
                                padding: '1.5rem', 
                                borderRadius: '1.25rem', 
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                boxShadow: '0 20px 40px -10px rgba(239, 68, 68, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', transform: 'translateZ(40px)' }}>
                                <div>
                                    <p style={{ color: '#fecaca', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued Credentials</p>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f8fafc', marginTop: '0.25rem', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
                                        {certificates.length}
                                    </h3>
                                </div>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '0.75rem', color: '#ef4444' }}>
                                    <Award size={32} />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Recent Registrations Table rebuilt as a Data Terminal */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        style={{
                            background: '#020617',
                            border: '1px solid #1e293b',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Neon accent rail */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Activity size={24} color="#38bdf8" /> Recent Personnel Access
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Live registry of newly instantiated operatives.</p>
                            </div>
                            <button style={{ 
                                color: '#f8fafc', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', 
                                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer',
                            }}>
                                Terminate Feed
                            </button>
                        </div>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem 1rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identity</th>
                                        <th style={{ padding: '0.5rem 1rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comm Link [Email]</th>
                                        <th style={{ padding: '0.5rem 1rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Squadron [Batch]</th>
                                        <th style={{ padding: '0.5rem 1rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.slice(0, 5).map((student, i) => (
                                        <motion.tr 
                                            key={student.id} 
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + (i * 0.1) }}
                                            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', transition: 'all 0.2s' }}
                                        >
                                            <td style={{ padding: '1.25rem 1rem', color: '#f8fafc', fontWeight: '700', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem', borderLeft: '2px solid transparent' }}>
                                                {student.name}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', color: '#94a3b8' }}>{student.email}</td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '0.25rem',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    color: '#34d399',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {student.batch || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontFamily: 'monospace', borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                                                {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'XX-XX-XXXX'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            {students.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', border: '1px dashed #1e293b', borderRadius: '1rem', marginTop: '1rem' }}>
                                    <p style={{ fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No active personnel feeds detected.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            );
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Admin Hero */}
            <motion.div 
                whileHover={{ scale: 1.01 }}
                style={{
                    position: 'relative',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3rem',
                    color: 'white',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(56, 189, 248, 0.15)'
                }}
            >
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Shield size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>Platform Overview</span>
                    </div>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '950', 
                        marginBottom: '0.5rem',
                        color: '#f8fafc',
                        letterSpacing: '-0.025em',
                        textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                    }}>
                        ADMIN CONTROL CENTER
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Activity size={16} /> System Status: Online</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={16} /> 24h Growth: +5%</span>
                    </p>
                </div>
                
                {/* Admin Hero Illustration */}
                <div style={{
                    position: 'absolute',
                    right: '0',
                    top: '0',
                    height: '100%',
                    width: '40%',
                    zIndex: 1,
                    pointerEvents: 'none',
                    opacity: 0.8
                }}>
                    <img 
                        src={`/admin_dashboard_hero_1775205885052.png`} 
                        alt="Admin Analytics"
                        onError={(e) => e.target.style.display = 'none'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '0.5rem 0.5rem 0 0',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                            fontWeight: activeTab === tab.id ? '900' : '700',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <motion.div 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {renderContent()}
            </motion.div>
        </motion.div>
    );
};

export default AdminDashboard;
