import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import api from '../services/api';
import Card from '../components/Card';
import { BookOpen, Award, CheckCircle, Clock, FileText, PlayCircle, ChevronRight, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Assignments from '../components/student/Assignments';
import MockTests from '../components/student/MockTests';
import Certificates from '../components/student/Certificates';
import StudentCourseView from '../components/student/StudentCourseView';

// Import generated image path (simulated as we know the filename)
const HERO_IMAGE = '/student_dashboard_hero_1775205866026.png'; // This will be resolved by Vite if in public or handled manually.
// Actually, since I'm in a browser environment, I should just use the path as is if I can or use a placeholder if it fails.
// For now, I'll use a local path that works in the dev server context or just a beautiful gradient if not found.


const StudentDashboard = () => {
    const { currentUser } = useAuth();
    const { data } = useData();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    // Live data for overview
    const [assignments, setAssignments] = useState([]);
    const [tests, setTests] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [overviewLoading, setOverviewLoading] = useState(true);

    const myCourses = data.courses || [];

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                const [aRes, tRes, sRes, trRes] = await Promise.all([
                    api.get('/students/assignments'),
                    api.get('/students/tests'),
                    api.get('/students/submissions'),
                    api.get('/students/test-results'),
                ]);
                setAssignments(aRes.data);
                setTests(tRes.data);
                setSubmissions(sRes.data);
                setTestResults(trRes.data);
            } catch (err) {
                console.error('Failed to fetch overview data', err);
            } finally {
                setOverviewLoading(false);
            }
        };
        fetchOverviewData();
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BookOpen size={18} /> },
        { id: 'assignments', label: 'Assignments', icon: <FileText size={18} /> },
        { id: 'tests', label: 'Mock Tests', icon: <PlayCircle size={18} /> },
        { id: 'certificates', label: 'Certificates', icon: <Award size={18} /> },
    ];

    if (selectedCourseId) {
        return <StudentCourseView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }

    // Compute pending assignments (not yet submitted)
    const pendingAssignments = assignments.filter(a => !submissions.find(s => s.assignment_id === a.id));
    // Compute available tests (not yet taken)
    const availableTests = tests.filter(t => 
        !testResults.find(r => r.test_id === t.id) && 
        t.questions && t.questions.length > 0
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'assignments': return <Assignments />;
            case 'tests': return <MockTests />;
            case 'certificates': return <Certificates />;
            default: return (
                <>
                    {/* 3D Cyber-Glass Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem', perspective: '1500px' }}>
                        {[ 
                            { title: 'Enrolled Programs', count: myCourses.length, icon: BookOpen, color: '#3B82F6', gradient: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
                            { title: 'Active Assignments', count: pendingAssignments.length, icon: FileText, color: '#F59E0B', gradient: 'linear-gradient(135deg, #78350F, #F59E0B)' },
                            { title: 'Pending Assessments', count: availableTests.length, icon: PlayCircle, color: '#10B981', gradient: 'linear-gradient(135deg, #064E3B, #10B981)' },
                            { title: 'Earned Credentials', count: data.certificates?.length || 0, icon: Sparkles, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #4C1D95, #8B5CF6)' }
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, rotateX: 20, y: 50 }}
                                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                                transition={{ delay: idx * 0.15, type: 'spring', stiffness: 100 }}
                                whileHover={{ 
                                    scale: 1.05, 
                                    rotateY: 10,
                                    rotateX: -5,
                                    boxShadow: `0 35px 60px -15px ${stat.color}66`
                                }}
                                style={{
                                    background: '#0F172A',
                                    borderRadius: '1.5rem',
                                    padding: '2rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: stat.gradient, opacity: 0.1, zIndex: 0 }} />
                                {/* Cyberpunk diagonal stripe */}
                                <div style={{ position: 'absolute', top: '-10%', right: '-30%', width: '100px', height: '150%', background: 'rgba(255,255,255,0.02)', transform: 'rotate(25deg)', zIndex: 1 }} />
                                
                                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${stat.color}44 inset` }}>
                                            <stat.icon size={26} color={stat.color} style={{ filter: `drop-shadow(0 0 5px ${stat.color})` }} />
                                        </div>
                                        <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', lineHeight: 1, letterSpacing: '-0.05em', textShadow: `0 0 20px ${stat.color}88` }}>
                                            {stat.count}
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                                        {stat.title}
                                    </h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Holographic Action Panels */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                        
                        {/* Pending Assignments Holo-Panel */}
                        <motion.div 
                            style={{ background: 'linear-gradient(145deg, #1E293B, #0F172A)', borderRadius: '2rem', padding: '2rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                            whileHover={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)', opacity: 0.8 }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.05em' }}>
                                    <div style={{ width: '8px', height: '24px', background: '#F59E0B', borderRadius: '4px', boxShadow: '0 0 10px #F59E0B' }}/>
                                    ACTION REQUIRED
                                </h3>
                                <button onClick={() => setActiveTab('assignments')} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                                    Queue <ArrowRight size={14} />
                                </button>
                            </div>

                            {pendingAssignments.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <CheckCircle size={48} color="#34D399" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p style={{ color: '#94A3B8', fontWeight: '600' }}>SYS: ALL CLEAR. NO IMPENDING TASKS.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {pendingAssignments.slice(0, 4).map((a, i) => (
                                        <motion.div 
                                            key={a.id} 
                                            initial={{ x: -20, opacity: 0 }} 
                                            animate={{ x: 0, opacity: 1 }} 
                                            transition={{ delay: i * 0.1 }}
                                            style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '2px solid rgba(245, 158, 11, 0.5)', transition: 'background 0.3s' }}
                                            whileHover={{ background: 'rgba(255,255,255,0.08)', x: 10 }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{a.title}</h4>
                                                <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.course_title}</div>
                                            </div>
                                            <div style={{ color: '#FBBF24', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                                <Clock size={12} /> {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'IMMEDIATE'}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Available Tests Holo-Panel */}
                        <motion.div 
                            style={{ background: 'linear-gradient(145deg, #1E293B, #0F172A)', borderRadius: '2rem', padding: '2rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.2)' }}
                            whileHover={{ boxShadow: '0 0 40px rgba(56, 189, 248, 0.15)' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, #38BDF8, transparent)', opacity: 0.8 }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.05em' }}>
                                    <div style={{ width: '8px', height: '24px', background: '#38BDF8', borderRadius: '4px', boxShadow: '0 0 10px #38BDF8' }}/>
                                    SIMULATIONS
                                </h3>
                                <button onClick={() => setActiveTab('tests')} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#BAE6FD', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                                    Terminal <ArrowRight size={14} />
                                </button>
                            </div>

                            {availableTests.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <CheckCircle size={48} color="#34D399" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p style={{ color: '#94A3B8', fontWeight: '600' }}>SYS: ALL SIMULATIONS COMPLETE.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {availableTests.slice(0, 4).map((t, i) => (
                                        <motion.div 
                                            key={t.id} 
                                            initial={{ x: 20, opacity: 0 }} 
                                            animate={{ x: 0, opacity: 1 }} 
                                            transition={{ delay: i * 0.1 }}
                                            style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderRight: '2px solid rgba(56, 189, 248, 0.5)', transition: 'background 0.3s' }}
                                            whileHover={{ background: 'rgba(255,255,255,0.08)', x: -10 }}
                                        >
                                            <div style={{ color: '#38BDF8', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', marginRight: '1rem' }}>
                                                <PlayCircle size={14} fill="#0284C7" color="#BAE6FD" /> START
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                <h4 style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{t.title}</h4>
                                                <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.duration} MIN / {t.type}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Enrolled Courses Grid */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.025em' }}>My Active Programs</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', perspective: '1200px' }}>
                        {myCourses.map((course, idx) => (
                            <motion.div 
                                key={course.id} 
                                initial={{ opacity: 0, rotateY: 15, z: -100 }}
                                animate={{ opacity: 1, rotateY: 0, z: 0 }}
                                transition={{ delay: 0.1 * idx, type: 'spring', stiffness: 100 }}
                                whileHover={{ scale: 1.03, rotateY: -3, rotateX: 3, z: 50, boxShadow: '0 35px 60px -15px rgba(59, 130, 246, 0.4)' }}
                                onClick={() => setSelectedCourseId(course.id)}
                                style={{ 
                                    position: 'relative', 
                                    height: '420px', 
                                    borderRadius: '1.5rem', 
                                    overflow: 'hidden', 
                                    cursor: 'pointer',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                    transformStyle: 'preserve-3d',
                                    background: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Background Image */}
                                {course.thumbnail ? (
                                    <motion.div 
                                        style={{ position: 'absolute', inset: '-10%', backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.7) blur(2px)' }} 
                                        whileHover={{ filter: 'brightness(0.9) blur(0px)', scale: 1.1 }}
                                        transition={{ duration: 0.8 }}
                                    />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}>
                                        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                    </div>
                                )}
                                
                                {/* Overlay Gradient for readability */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)' }} />
                                
                                {/* Content Wrapper (Pushed out in Z-space) */}
                                <div style={{ position: 'absolute', inset: 0, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', transform: 'translateZ(40px)' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '100px', color: '#93C5FD', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FileText size={10} /> {assignments.filter(a => a.course_id === course.id).length} ASSIGNMENTS
                                        </span>
                                        <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(245, 158, 11, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '100px', color: '#FCD34D', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <PlayCircle size={10} /> {tests.filter(t => t.course_id === course.id).length} SIMULATIONS
                                        </span>
                                    </div>
                                    
                                    <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#FFFFFF', marginBottom: '0.75rem', lineHeight: '1.1', textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '-0.025em' }}>{course.title}</h3>
                                    
                                    <p style={{ fontSize: '0.95rem', color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                        {course.description || 'Access terminal to resume interactive labs, complete assignments, and track progression.'}
                                    </p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#38BDF8', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                                        ENGAGE PROTOCOL <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, #38BDF8, transparent)' }} /> <ArrowRight size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {myCourses.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: '1.5rem', border: '5px dashed #E2E8F0' }}>
                                <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <BookOpen size={40} color="#94A3B8" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>No Active Programs</h3>
                                <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: '500' }}>You are not assigned to any courses. Awaiting administrator clearance.</p>
                            </div>
                        )}
                    </div>
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
            {/* Hero Section */}
            <motion.div 
                whileHover={{ scale: 1.01 }}
                style={{
                    position: 'relative',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    marginBottom: '2rem',
                    background: 'var(--primary-gradient)',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2.5rem',
                    color: 'white',
                    boxShadow: 'var(--shadow-premium)'
                }}
            >
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
                    >
                        <Sparkles size={20} className="text-yellow-300" />
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Digital Learning Portal</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', lineHeight: '1.1' }}
                    >
                        Welcome back, <span style={{ color: '#FCD34D' }}>{currentUser.name}</span>!
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '1.5rem' }}
                    >
                        Your learning journey continues. You have <strong>{pendingAssignments.length}</strong> pending tasks to complete today.
                    </motion.p>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCourseId(myCourses[0]?.id)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'white',
                            color: 'var(--primary)',
                            borderRadius: '0.75rem',
                            fontWeight: '700',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                    >
                        Learn Now <ArrowRight size={18} />
                    </motion.button>
                </div>
                
                {/* Hero Illustration */}
                <div style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '0',
                    height: '100%',
                    width: '45%',
                    zIndex: 1,
                    pointerEvents: 'none'
                }}>
                    <img 
                        src={`/student_dashboard_hero_1775205866026.png`} // Using the generated filename
                        alt="Learning Illustration"
                        onError={(e) => e.target.style.display = 'none'} // Fallback if image not moved yet
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex', gap: '0.5rem', marginBottom: '2rem',
                overflowX: 'auto', paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '0.5rem 0.5rem 0 0',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? 'var(--white)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-light)',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
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

export default StudentDashboard;
