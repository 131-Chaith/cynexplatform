import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    GraduationCap,
    Video,
    FileText,
    MessageSquare,
    Layers,
    ClipboardList,
    Bell,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    QrCode,
    BarChart,
    PieChart,
    Zap
} from 'lucide-react';

const DashboardLayout = () => {
    const { currentUser, isAdmin, isSuperAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const allAdminItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin', roles: ['admin', 'super_admin'] },
        { icon: <Users size={20} />, label: 'Students', path: '/admin/students', roles: ['admin', 'super_admin'] },
        { icon: <Users size={20} />, label: 'Batches', path: '/admin/batches', roles: ['admin', 'super_admin'] },
        { icon: <BookOpen size={20} />, label: 'Courses', path: '/admin/courses', roles: ['admin', 'super_admin'] },
        { icon: <Layers size={20} />, label: 'Modules', path: '/admin/modules', roles: ['admin', 'super_admin'] },
        { icon: <Video size={20} />, label: 'Videos', path: '/admin/videos', roles: ['admin', 'super_admin'] },
        { 
            icon: <ClipboardList size={20} />, 
            label: 'Attendance', 
            path: '/admin/attendance', 
            roles: ['admin', 'super_admin']
        },
        { icon: <FileText size={20} />, label: 'Certificates', path: '/admin/certificates', roles: ['admin', 'super_admin'] },
        { icon: <MessageSquare size={20} />, label: 'Announcements', path: '/admin/announcements', roles: ['super_admin'] },
        { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings', roles: ['super_admin'] },
        { icon: <FileText size={20} />, label: 'Projects', path: '/admin/projects', roles: ['super_admin'] },
        { icon: <FileText size={20} />, label: 'Assessments', path: '/admin/assessments', roles: ['super_admin'] },
    ];

    const studentItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/student' },
        { icon: <BookOpen size={20} />, label: 'My Courses', path: '/student/courses' },
        { icon: <Video size={20} />, label: 'Classes', path: '/student/classes' },
        { icon: <FileText size={20} />, label: 'Assignments', path: '/student/assignments' },
        { icon: <MessageSquare size={20} />, label: 'Mock Tests', path: '/student/mock-tests' },
        { 
            icon: <ClipboardList size={20} />, 
            label: 'Attendance', 
            path: '/student/attendance'
        },
        { icon: <GraduationCap size={20} />, label: 'Certificates', path: '/student/certificates' },
        { icon: <Users size={20} />, label: 'Profile', path: '/student/profile' },
    ];

    const menuItems = isAdmin ? allAdminItems.filter(item => {
        if (isSuperAdmin) return true;
        return item.roles.includes('admin');
    }) : studentItems;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            {/* Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ width: sidebarOpen ? '280px' : '80px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    backgroundColor: '#fff',
                    borderRight: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 50,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
                }}
            >
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <motion.div 
                        whileHover={{ rotate: 15 }}
                        style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}
                    >
                        <GraduationCap size={24} />
                    </motion.div>
                    {sidebarOpen && (
                        <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ fontWeight: '800', fontSize: '1.25rem', color: '#0F172A', whiteSpace: 'nowrap' }}
                        >
                            Cynex AI
                        </motion.span>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const [isOpen, setIsOpen] = useState(isActive);

                        return (
                            <div key={item.path}>
                                <motion.button
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (item.subItems) {
                                            setIsOpen(!isOpen);
                                        } else {
                                            navigate(item.path);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                        gap: '1rem',
                                        width: '100%',
                                        padding: '0.875rem',
                                        marginBottom: '0.25rem',
                                        borderRadius: '0.75rem',
                                        border: 'none',
                                        backgroundColor: (isActive && !item.subItems) ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : '#64748B',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? '700' : '500',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ color: isActive ? 'var(--primary)' : '#94A3B8' }}>{item.icon}</div>
                                    {sidebarOpen && (
                                        <>
                                            <span style={{ flex: 1 }}>{item.label}</span>
                                            {item.subItems && (
                                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                                                    <ChevronDown size={16} />
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </motion.button>

                                {item.subItems && sidebarOpen && (
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden', paddingLeft: '2.5rem' }}
                                            >
                                                {item.subItems.map(sub => {
                                                    const isSubActive = location.pathname === sub.path;
                                                    return (
                                                        <button
                                                            key={sub.path}
                                                            onClick={() => navigate(sub.path)}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                padding: '0.6rem 0.8rem',
                                                                textAlign: 'left',
                                                                background: 'none',
                                                                border: 'none',
                                                                borderRadius: '0.5rem',
                                                                fontSize: '0.8rem',
                                                                color: isSubActive ? 'var(--primary)' : '#94A3B8',
                                                                fontWeight: isSubActive ? '700' : '500',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {sub.label}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <motion.button
                        whileHover={{ backgroundColor: '#FEF2F2' }}
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            gap: '1rem',
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span>Logout</span>}
                    </motion.button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: sidebarOpen ? '280px' : '80px',
                transition: 'margin-left 0.3s ease',
                backgroundColor: '#F8FAFC',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <header style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    padding: '1rem 2rem',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    height: '70px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748B', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </motion.button>

                        <div style={{ position: 'relative', display: 'none' /* Future use */ }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '300px', backgroundColor: '#f1f5f9', border: '1px solid transparent', fontSize: '0.875rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <motion.button whileHover={{ y: -2 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', position: 'relative' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
                        </motion.button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid #f1f5f9' }}>
                            <div style={{ textAlign: 'right', display: sidebarOpen ? 'block' : 'none' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                                    {currentUser?.name || currentUser?.email}
                                </p>
                                <p style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isAdmin ? 'Administrator' : 'Student'}
                                </p>
                            </div>
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    background: 'var(--primary-gradient)',
                                    padding: '2px',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'white',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    overflow: 'hidden'
                                }}>
                                    {currentUser?.profile_photo ? (
                                        <img 
                                            src={`http://localhost:5002${currentUser.profile_photo}`} 
                                            alt="" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    ) : (
                                        (currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '2rem', flex: 1 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
