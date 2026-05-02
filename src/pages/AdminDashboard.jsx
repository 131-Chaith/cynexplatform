import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Card from '../components/Card';
import { Users, BookOpen, Video, Award, MessageSquare, Shield, Activity, TrendingUp, Settings, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectApprovals from '../components/admin/ProjectApprovals';
import ContentManagement from '../components/admin/ContentManagement';
import AdminAssessments from '../components/admin/AdminAssessments';
import CertificateApprovals from '../components/admin/CertificateApprovals';
import AdminAttendance from './AttendanceDashboard';
import AdminClasses from '../components/admin/AdminClasses';
import AdminAnnouncements from '../components/admin/AdminAnnouncements';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { data } = useData();
    const { students = [], courses = [], videos = [], certificates = [] } = data;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Users size={18} /> },
        { id: 'content', label: 'Content', icon: <BookOpen size={18} /> },
        { id: 'attendance', label: 'Attendance', icon: <Activity size={18} /> },
        { id: 'classes', label: 'Classes', icon: <Video size={18} /> },
        { id: 'assessments', label: 'Assessments', icon: <BookOpen size={18} /> },
        { id: 'projects', label: 'Projects', icon: <BookOpen size={18} /> },
        { id: 'approvals', label: 'Certificates', icon: <Award size={18} /> },
        { id: 'announcements', label: 'Announcements', icon: <MessageSquare size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'content': return <ContentManagement />;
            case 'attendance': return <AdminAttendance />;
            case 'classes': return <AdminClasses />;
            case 'assessments': return <AdminAssessments />;
            case 'projects': return <ProjectApprovals />;
            case 'approvals': return <CertificateApprovals />;
            case 'announcements': return <AdminAnnouncements />;
            case 'settings': return <AdminSettings />;
            default: return (
                <>
                    {/* Standard Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard 
                            icon={<Users size={24} />} 
                            label="Total Students" 
                            value={students.length} 
                            color="#2563EB"
                            bgColor="rgba(37, 99, 235, 0.1)"
                        />
                        <StatCard 
                            icon={<BookOpen size={24} />} 
                            label="Active Courses" 
                            value={courses.length} 
                            color="#10B981"
                            bgColor="rgba(16, 185, 129, 0.1)"
                        />
                        <StatCard 
                            icon={<Video size={24} />} 
                            label="Media Assets" 
                            value={videos.length} 
                            color="#F59E0B"
                            bgColor="rgba(245, 158, 11, 0.1)"
                        />
                        <StatCard 
                            icon={<Award size={24} />} 
                            label="Certificates" 
                            value={certificates.length} 
                            color="#EF4444"
                            bgColor="rgba(239, 68, 68, 0.1)"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        {/* Recent Students Table */}
                        <Card style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>Recent Registrations</h3>
                                <button 
                                    onClick={() => navigate('/admin/students')}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    View All
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Batch</th>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.slice(0, 5).map((student) => (
                                            <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>{student.name}</td>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <span style={{ padding: '0.2rem 0.5rem', background: 'var(--light)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                        {student.batch_name || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                                    {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', marginBottom: '1.5rem' }}>Quick Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <ActionButton icon={<Plus size={16} />} label="Add Student" onClick={() => navigate('/admin/students')} />
                                <ActionButton icon={<Video size={16} />} label="Launch Session" onClick={() => navigate('/admin/attendance')} />
                                <ActionButton icon={<Megaphone size={16} />} label="Post Notice" onClick={() => navigate('/admin/announcements')} />
                                <ActionButton icon={<Award size={16} />} label="Review Certificates" onClick={() => setActiveTab('approvals')} />
                            </div>
                        </Card>
                    </div>
                </>
            );
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Admin Control Panel</h1>
                <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>Manage your academy operations from one central dashboard.</p>
            </div>

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
                            backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-light)',
                            fontWeight: activeTab === tab.id ? '750' : '600',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                            fontSize: '0.85rem',
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
        </div>
    );
};

const StatCard = ({ icon, label, value, color, bgColor }) => (
    <Card style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: bgColor, borderRadius: '12px', color: color }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>{label}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text)' }}>{value}</h3>
            </div>
        </div>
    </Card>
);

const ActionButton = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'white',
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: 'var(--primary)' }}>{icon}</div>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>{label}</span>
        </div>
        <ChevronRight size={16} color="var(--text-light)" />
    </button>
);

const Plus = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Megaphone = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>;

export default AdminDashboard;
