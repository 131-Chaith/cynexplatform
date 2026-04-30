import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import api from '../services/api';
import StudentCourseView from '../components/student/StudentCourseView';
import { BookOpen, PlayCircle, Clock, ArrowRight, CheckCircle, PlusCircle } from 'lucide-react';
import Button from '../components/Button';

const StudentCourses = () => {
    const { enrollCourse } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-courses'); // 'my-courses' or 'catalog'

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const res = await api.get('courses/all-catalog');
            setCatalog(res.data || []);
        } catch (error) {
            console.error("Failed to fetch catalog", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const myCourses = catalog.filter(c => c.is_enrolled);
    const availableCourses = catalog.filter(c => !c.is_enrolled);

    const handleEnroll = async (e, courseId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to enroll in this course?")) {
            try {
                await enrollCourse(courseId);
                await fetchCatalog();
                alert("Successfully enrolled!");
            } catch (err) {
                alert("Enrollment failed: " + err.message);
            }
        }
    };

    const [imageErrors, setImageErrors] = useState({});

    const handleImageError = (id) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    if (selectedCourseId) {
        return <StudentCourseView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
        >
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                        Course Center
                    </h1>
                    <p style={{ color: 'var(--text-light)' }}>
                        Manage your learning journey and discover new programs.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', background: '#F1F5F9', padding: '0.5rem', borderRadius: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('my-courses')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                            background: activeTab === 'my-courses' ? 'white' : 'transparent',
                            color: activeTab === 'my-courses' ? '#2563EB' : '#64748B',
                            boxShadow: activeTab === 'my-courses' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        My Courses ({myCourses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                            background: activeTab === 'catalog' ? 'white' : 'transparent',
                            color: activeTab === 'catalog' ? '#2563EB' : '#64748B',
                            boxShadow: activeTab === 'catalog' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Available Courses ({availableCourses.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563EB', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#64748B' }}>Loading courses...</p>
                </div>
            ) : (
                <motion.div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}
                    variants={container}
                >
                    {(activeTab === 'my-courses' ? myCourses : availableCourses).map(course => (
                        <motion.div
                            key={course.id}
                            variants={item}
                            whileHover={{
                                scale: 1.02,
                                rotateY: 5,
                                rotateX: -5,
                                z: 20,
                                boxShadow: '0 30px 60px -15px rgba(37, 99, 235, 0.3)'
                            }}
                            style={{ perspective: '1000px', cursor: 'pointer' }}
                            onClick={() => setSelectedCourseId(course.id)}
                        >
                            <div style={{
                                position: 'relative',
                                height: '350px',
                                borderRadius: '2rem',
                                overflow: 'hidden',
                                backgroundColor: '#0F172A',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transformStyle: 'preserve-3d'
                            }}>
                                {/* Background Image / Gradient */}
                                {course.thumbnail && !imageErrors[course.id] ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        onError={() => handleImageError(course.id)}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            width: '100%', height: '100%',
                                            objectFit: 'cover',
                                            opacity: 0.6,
                                            transition: 'opacity 0.4s ease'
                                        }}
                                    />
                                ) : null}

                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'linear-gradient(135deg, #1E1B4B 0%, #0369A1 100%)',
                                    opacity: 0.8,
                                    display: (!course.thumbnail || imageErrors[course.id]) ? 'block' : 'none'
                                }} />

                                {/* Dark Overlay for better text readability */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0) 100%)'
                                }} />

                                {/* Floating Top Badge */}
                                <div style={{
                                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '2rem',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    color: 'white', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em'
                                }}>
                                    <Clock size={14} color="#38BDF8" /> {course.duration || 'FLEXIBLE'}
                                </div>

                                {/* Center Play Icon that appears on hover (managed via CSS usually, but we'll show it subtly) */}
                                <div className="course-play-btn" style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%, -60%)',
                                    width: '64px', height: '64px',
                                    background: 'rgba(56, 189, 248, 0.2)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(56, 189, 248, 0.4)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#38BDF8',
                                    opacity: 0.8,
                                    boxShadow: '0 0 30px rgba(56, 189, 248, 0.3)'
                                }}>
                                    <PlayCircle size={32} />
                                </div>

                                {/* Main Content Area (Glassmorphic Pane at Bottom) */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '1.5rem',
                                    transform: 'translateZ(30px)' // 3D floating effect
                                }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{
                                            padding: '0.3rem 0.6rem',
                                            background: 'rgba(56, 189, 248, 0.15)',
                                            borderRadius: '0.5rem',
                                            color: '#38BDF8',
                                            fontSize: '0.65rem',
                                            fontWeight: '900',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase'
                                        }}>
                                            PROGRAM
                                        </div>
                                    </div>

                                    <h3 style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '900',
                                        color: 'white',
                                        marginBottom: '0.5rem',
                                        lineHeight: '1.2',
                                        letterSpacing: '-0.02em',
                                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                                    }}>
                                        {course.title}
                                    </h3>

                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: '#94A3B8',
                                        marginBottom: '1.5rem',
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {course.description || 'Dive into this comprehensive learning journey tailored for excellence.'}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <BookOpen size={14} color="#94A3B8" />
                                            </div>
                                        </div>
                                        {course.is_enrolled ? (
                                            <div style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                RESUME <ArrowRight size={14} />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => handleEnroll(e, course.id)}
                                                style={{
                                                    background: '#10B981', color: 'white', border: 'none',
                                                    padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
                                                    fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    cursor: 'pointer', zIndex: 10
                                                }}
                                            >
                                                <PlusCircle size={16} /> ENROLL NOW
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {activeTab === 'my-courses' && myCourses.length === 0 && (
                        <motion.div variants={item} style={{
                            gridColumn: '1 / -1',
                            padding: '5rem 2rem',
                            textAlign: 'center',
                            backgroundColor: '#F8FAFC',
                            borderRadius: '2rem',
                            border: '2px dashed #E2E8F0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem',
                                color: '#2563EB'
                            }}>
                                <BookOpen size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.75rem' }}>
                                Begin Your Journey
                            </h3>
                            <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                You are not currently enrolled in any courses. Browse the catalog to unlock your personalized curriculum.
                            </p>
                            <Button onClick={() => setActiveTab('catalog')}>Browse Catalog</Button>
                        </motion.div>
                    )}

                    {activeTab === 'catalog' && availableCourses.length === 0 && (
                        <motion.div variants={item} style={{ gridColumn: '1 / -1', padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}>
                            <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 1.5rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.75rem' }}>All Caught Up!</h3>
                            <p style={{ color: '#64748B' }}>You are enrolled in all available courses.</p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default StudentCourses;
