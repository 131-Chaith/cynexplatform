import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import Card from '../components/Card';
import StudentCourseView from '../components/student/StudentCourseView';
import { BookOpen, PlayCircle, Clock, ArrowRight } from 'lucide-react';

const StudentCourses = () => {
    const { data } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    // data.courses is already filtered by the backend for the logged-in student
    const myCourses = data.courses || [];

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
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    My Courses
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Continue where you left off.
                </p>
            </div>

            <motion.div 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}
                variants={container}
            >
                {myCourses.map(course => (
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
                            {course.thumbnail ? (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundImage: `url(${course.thumbnail})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: 0.6,
                                    transition: 'opacity 0.4s ease'
                                }} />
                            ) : (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'linear-gradient(135deg, #1E1B4B 0%, #0369A1 100%)',
                                    opacity: 0.8
                                }} />
                            )}
                            
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
                                        <span style={{ color: '#CBD5E1', fontSize: '0.8rem', fontWeight: '600' }}>{course.modules?.length || 0} Modules</span>
                                    </div>
                                    <div style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        RESUME <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {myCourses.length === 0 && (
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
                        <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
                            You are not currently enrolled in any courses. Connect with your administrator to unlock your personalized curriculum.
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default StudentCourses;
