import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import TestRunner from './TestRunner';
import { Video, ChevronLeft, Clock, Calendar, BookOpen, FileText, CheckSquare, ChevronDown, ChevronRight, Upload, X } from 'lucide-react';

const StudentCourseView = ({ courseId, onBack }) => {
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('classes');
    const [expandedModules, setExpandedModules] = useState({});
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const [videoErrors, setVideoErrors] = useState({}); // tracks videos that failed to load

    // Test Runner state
    const [activeTest, setActiveTest] = useState(null);

    // Assignment submission modal state
    const [submissionModal, setSubmissionModal] = useState({ isOpen: false, assignmentId: null, assignmentTitle: '' });
    const [submissionLink, setSubmissionLink] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Attendance and Certificates Data
    const [attendanceData, setAttendanceData] = useState([]);
    const [certificateData, setCertificateData] = useState(null);
    const [certModalOpen, setCertModalOpen] = useState(false);
    const [videoLink, setVideoLink] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/courses/${courseId}/details`);
                setCourseData(res.data);
                if (res.data.classes && res.data.classes.length > 0) {
                    setActiveVideo(res.data.classes[0]);
                }
                
                // Fetch attendance specific to this course
                try {
                    const attRes = await api.get('/attendance/history/my');
                    const courseAtt = attRes.data.filter(a => a.course_id === courseId);
                    setAttendanceData(courseAtt);
                } catch (e) { console.error(e); }
                
                // Fetch certificates specific to this course
                try {
                    const certRes = await api.get('/students/certificates');
                    const courseCert = certRes.data.find(c => c.course_id === courseId);
                    setCertificateData(courseCert || null);
                } catch (e) { console.error(e); }

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch course details", error);
                setLoading(false);
            }
        };
        fetchDetails();
    }, [courseId]);

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/live\/|\/shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Build a clean YouTube embed URL — no origin= to avoid blocking in dev/localhost
    const buildEmbedUrl = (url, autoplay = false) => {
        const id = getYoutubeId(url);
        if (!id) return null;
        return `https://www.youtube.com/embed/${id}?rel=0&origin=${window.location.origin}&enablejsapi=1${autoplay ? '&autoplay=1' : ''}`;
    };

    // Renders a YouTube video iframe. YouTube itself handles private access denial
    // and will show "Video unavailable" when the logged-in Google account doesn't have access.
    const renderYoutubeEmbed = (url, videoKey, autoplay = false) => {
        const embedUrl = buildEmbedUrl(url, autoplay);
        if (!embedUrl) return (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#1e293b', borderRadius: '0.5rem', color: '#94a3b8' }}>
                <Video size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem' }}>Invalid video URL.</p>
            </div>
        );
        return (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, backgroundColor: '#000', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <iframe
                    id={videoKey}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={embedUrl}
                    title={videoKey}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        );
    };

    // Merge course-level + all module-level assignments into one deduplicated list
    const allAssignments = useMemo(() => {
        if (!courseData) return [];
        const seen = new Set();
        const result = [];
        // Course-level assignments
        (courseData.courseAssignments || []).forEach(a => {
            if (!seen.has(a.id)) { seen.add(a.id); result.push({ ...a, source: 'Course' }); }
        });
        // Module-level assignments
        (courseData.modules || []).forEach(mod => {
            (mod.assignments || []).forEach(a => {
                if (!seen.has(a.id)) { seen.add(a.id); result.push({ ...a, module_title: mod.title, source: mod.title }); }
            });
        });
        return result;
    }, [courseData]);

    // Merge course-level + all module-level tests into one deduplicated list
    const allTests = useMemo(() => {
        if (!courseData) return [];
        const seen = new Set();
        const result = [];
        // Course-level tests
        (courseData.courseTests || []).forEach(t => {
            if (!seen.has(t.id)) { seen.add(t.id); result.push({ ...t, source: 'Course' }); }
        });
        // Module-level tests
        (courseData.modules || []).forEach(mod => {
            (mod.tests || []).forEach(t => {
                if (!seen.has(t.id)) { seen.add(t.id); result.push({ ...t, module_title: mod.title, source: mod.title }); }
            });
        });
        return result.filter(t => t.questions && t.questions.length > 0);
    }, [courseData]);

    const openSubmitModal = (assignment) => {
        setSubmissionModal({ isOpen: true, assignmentId: assignment.id, assignmentTitle: assignment.title });
        setSubmissionLink('');
    };

    const handleConfirmSubmit = async () => {
        if (!submissionLink.trim()) return alert('Please enter a submission link');
        setSubmitting(true);
        try {
            await api.post('/students/assignments/submit', {
                assignment_id: submissionModal.assignmentId,
                submission_link: submissionLink
            });
            setSubmissionModal({ isOpen: false, assignmentId: null, assignmentTitle: '' });
            alert('Assignment submitted successfully!');
        } catch (error) {
            alert('Failed to submit: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTestComplete = async (score, total, answers) => {
        try {
            await api.post('/students/tests/submit', {
                test_id: activeTest.id,
                score,
                total_questions: total,
                answers
            });
            setActiveTest(null);
            alert(`Test submitted! Score: ${score}/${total}`);
        } catch (error) {
            console.error('Failed to submit test result', error);
            alert('Failed to save result');
        }
    };

    const handleRequestCertificate = async () => {
        if (!videoLink.trim()) return alert("Please provide a video link.");
        try {
            setSubmitting(true);
            await api.post('/students/certificates/request', { course_id: courseId, video_link: videoLink });
            alert("Certificate requested successfully!");
            setCertModalOpen(false);
            setVideoLink('');
            // refresh cert status
            const certRes = await api.get('/students/certificates');
            setCertificateData(certRes.data.find(c => c.course_id === courseId) || null);
        } catch (error) {
            alert("Failed to request certificate: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading course content...</div>;
    if (!courseData) return <div className="p-8 text-center">Course not found.</div>;

    const { course, classes, modules } = courseData;

    // Calculate attendance metrics
    const totalSessions = attendanceData.length;
    const presentSessions = attendanceData.filter(a => a.status === 'present').length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // If a test is active, show the TestRunner
    if (activeTest) {
        return (
            <TestRunner
                test={activeTest}
                onComplete={handleTestComplete}
                onCancel={() => setActiveTest(null)}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <Button variant="ghost" onClick={onBack} style={{ marginBottom: '1rem' }}>
                <ChevronLeft size={20} style={{ marginRight: '0.5rem' }} /> Back to My Courses
            </Button>

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{course.title}</h1>
                <p style={{ color: 'var(--text-light)' }}>{course.description}</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                {[
                    { key: 'classes', label: `Classes (${classes.length})` },
                    { key: 'modules', label: `Modules (${modules.length})` },
                    { key: 'assignments', label: `Assignments (${allAssignments.length})` },
                    { key: 'tests', label: `Tests (${allTests.length})` },
                    { key: 'attendance', label: `Attendance (${attendancePercentage}%)` },
                    { key: 'certificates', label: `Certificate` },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-light)',
                            fontWeight: activeTab === tab.key ? '600' : '500',
                            background: 'none',
                            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── CLASSES TAB ─────────────────────────────── */}
            {activeTab === 'classes' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                    {/* Video Player */}
                    <div>
                        {activeVideo ? (
                            <div style={{ marginBottom: '1.5rem' }}>
                                {renderYoutubeEmbed(activeVideo.video_url, `class-${activeVideo.unique_id}`)}
                                
                                {/* YouTube Private Video Sign-in Info Banner */}
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.08))',
                                    border: '1px solid rgba(56,189,248,0.2)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem'
                                }}>
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔑</span>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.15rem' }}>
                                            Private Video Access
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5' }}>
                                            If you see "Video unavailable — this video is private", you must be <strong style={{ color: '#94a3b8' }}>signed in to YouTube</strong> with the email address your instructor used to share access. Open <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>youtube.com</a> in this same browser, sign in with your invited email, then reload this page.
                                        </p>
                                    </div>
                                </div>

                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', color: 'var(--text)' }}>
                                    {activeVideo.title}
                                </h2>
                                <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                    {activeVideo.schedule ? `Scheduled: ${new Date(activeVideo.schedule).toLocaleDateString()}` : ''}
                                </p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '2px dashed #d1d5db' }}>
                                <Video size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ color: '#374151' }}>No Class Selected</h3>
                                <p style={{ color: '#6b7280' }}>Select a class from the list to watch.</p>
                            </div>
                        )}
                    </div>

                    {/* Class List */}
                    <Card style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Class List ({classes.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {classes.map((cls, index) => (
                                <div
                                    key={cls.unique_id}
                                    onClick={() => setActiveVideo(cls)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: activeVideo?.unique_id === cls.unique_id ? 'var(--primary-light)' : 'var(--light)',
                                        color: activeVideo?.unique_id === cls.unique_id ? 'var(--primary)' : 'var(--text)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderLeft: activeVideo?.unique_id === cls.unique_id ? '4px solid var(--primary)' : '4px solid transparent'
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.7, marginBottom: '0.25rem' }}>
                                        {cls.type === 'video' ? '🎬 Video' : `Class ${index + 1}`}
                                    </div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{cls.title}</h4>
                                    {cls.schedule && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            <Calendar size={12} /> {new Date(cls.schedule).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {classes.length === 0 && <p style={{ color: 'var(--text-light)' }}>No classes or videos added yet.</p>}
                        </div>
                    </Card>
                </div>
            )}

            {/* ── MODULES TAB ─────────────────────────────── */}
            {activeTab === 'modules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {modules.map(module => (
                        <Card key={module.id} style={{ padding: '0' }}>
                            <div
                                onClick={() => toggleModule(module.id)}
                                style={{
                                    padding: '1.5rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: expandedModules[module.id] ? 'var(--light)' : 'white'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '0.375rem', color: '#4f46e5' }}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>{module.title}</h3>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{module.description}</p>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            <span>📹 {module.videos?.length || 0} videos</span>
                                            <span>📝 {module.assignments?.length || 0} assignments</span>
                                            <span>✅ {module.tests?.length || 0} tests</span>
                                        </div>
                                    </div>
                                </div>
                                {expandedModules[module.id] ? <ChevronDown /> : <ChevronRight />}
                            </div>

                            {expandedModules[module.id] && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>

                                    {/* Module Videos */}
                                    {module.videos && module.videos.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Video size={18} /> Videos
                                            </h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {module.videos.map(video => (
                                                    <div key={video.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '600' }}>{video.title}</div>
                                                                {video.duration && <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Duration: {video.duration}</div>}
                                                            </div>
                                                            <Button size="sm" onClick={() => setPlayingVideoId(playingVideoId === video.id ? null : video.id)}>
                                                                {playingVideoId === video.id ? 'Close' : 'Watch'}
                                                            </Button>
                                                        </div>
                                                        {playingVideoId === video.id && (
                                                            renderYoutubeEmbed(video.youtube_url, `module-video-${video.id}`, true)
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Module Assignments */}
                                    {module.assignments && module.assignments.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FileText size={18} /> Assignments
                                            </h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {module.assignments.map(asm => (
                                                    <div key={asm.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{asm.title}</div>
                                                            {asm.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>{asm.description}</div>}
                                                            {asm.due_date && <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Due: {new Date(asm.due_date).toLocaleDateString()}</div>}
                                                        </div>
                                                        <Button size="sm" onClick={() => openSubmitModal(asm)}>
                                                            <Upload size={14} style={{ marginRight: '0.25rem' }} /> Submit
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Module Tests */}
                                    {module.tests && module.tests.length > 0 && (
                                        <div>
                                            <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckSquare size={18} /> Mock Tests
                                            </h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {module.tests.map(test => (
                                                    <div key={test.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{test.title}</div>
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                                                <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                                {test.duration} mins &bull; {test.total_marks} marks &bull; {test.questions?.length || 0} questions
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            disabled={!test.questions?.length}
                                                            onClick={() => setActiveTest(test)}
                                                        >
                                                            {test.questions?.length ? 'Start Test' : 'No Questions'}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(!module.assignments?.length && !module.tests?.length && !module.videos?.length) && (
                                        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No content in this module yet.</p>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                    {modules.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No modules found for this course.</p>}
                </div>
            )}

            {/* ── ASSIGNMENTS TAB ─────────────────────────────── */}
            {activeTab === 'assignments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {allAssignments.length > 0 ? allAssignments.map(asm => (
                        <Card key={asm.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{asm.title}</h3>
                                        {asm.source && (
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '9999px', fontWeight: '600' }}>
                                                {asm.source}
                                            </span>
                                        )}
                                    </div>
                                    {asm.description && <p style={{ color: 'var(--text-light)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{asm.description}</p>}
                                    {asm.due_date && <p style={{ fontSize: '0.875rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Due: {new Date(asm.due_date).toLocaleDateString()}</p>}
                                </div>
                                <Button onClick={() => openSubmitModal(asm)} style={{ marginLeft: '1rem', flexShrink: 0 }}>
                                    <Upload size={16} style={{ marginRight: '0.5rem' }} /> Submit
                                </Button>
                            </div>
                        </Card>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
                            <FileText size={48} color="var(--gray)" style={{ marginBottom: '1rem' }} />
                            <h3>No assignments yet</h3>
                            <p style={{ color: 'var(--text-light)' }}>Assignments will appear here once added by your instructor.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── TESTS TAB ─────────────────────────────── */}
            {activeTab === 'tests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {allTests.length > 0 ? allTests.map(test => (
                        <Card key={test.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{test.title}</h3>
                                        {test.source && (
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '9999px', fontWeight: '600' }}>
                                                {test.source}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Type: {test.type || 'MCQ'}</p>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text)', marginTop: '0.5rem' }}>
                                        <span><Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />{test.duration} mins</span>
                                        <span>Marks: {test.total_marks}</span>
                                        <span>Questions: {test.questions?.length || 0}</span>
                                    </div>
                                </div>
                                <Button
                                    disabled={!test.questions?.length}
                                    onClick={() => setActiveTest(test)}
                                    style={{ marginLeft: '1rem', flexShrink: 0 }}
                                >
                                    {test.questions?.length ? 'Start Test' : 'No Questions Yet'}
                                </Button>
                            </div>
                        </Card>
                    )) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '4rem 2rem', 
                            backgroundColor: 'var(--white)', 
                            borderRadius: '1rem',
                            border: '2px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
                        }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: '#fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <CheckSquare size={36} color="#d97706" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>No tests yet</h3>
                            <p style={{ color: 'var(--text-light)', maxWidth: '300px', margin: '0.5rem auto 0' }}>
                                Tests will appear here once added by your instructor. Check back soon for new assessments.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── SUBMISSION MODAL ─────────────────────────────── */}
            {submissionModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <Card style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={() => setSubmissionModal({ isOpen: false, assignmentId: null, assignmentTitle: '' })}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Submit Assignment</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{submissionModal.assignmentTitle}</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text)' }}>
                                Project / GitHub Link
                            </label>
                            <Input
                                placeholder="https://github.com/your-username/project"
                                value={submissionLink}
                                onChange={(e) => setSubmissionLink(e.target.value)}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                Paste a link to your GitHub repo or hosted project.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="ghost" onClick={() => setSubmissionModal({ isOpen: false, assignmentId: null, assignmentTitle: '' })}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirmSubmit} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── ATTENDANCE TAB ─────────────────────────────── */}
            {activeTab === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1E3A8A' }}>Attendance Overview</h2>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Total Sessions</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>{totalSessions}</p>
                            </div>
                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Present</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>{presentSessions}</p>
                            </div>
                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Percentage</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: attendancePercentage >= 75 ? '#10B981' : '#EF4444' }}>{attendancePercentage}%</p>
                            </div>
                        </div>
                    </Card>

                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '1rem' }}>Session History</h3>
                    {attendanceData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {attendanceData.map(record => (
                                <Card key={record.id} style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: '600' }}>{record.topic}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{new Date(record.join_time).toLocaleString()}</p>
                                    </div>
                                    <span style={{ 
                                        padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                                        backgroundColor: record.status === 'present' ? '#D1FAE5' : (record.status === 'partial' ? '#FEF3C7' : '#FEE2E2'),
                                        color: record.status === 'present' ? '#059669' : (record.status === 'partial' ? '#D97706' : '#DC2626')
                                    }}>
                                        {record.status}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748B' }}>No attendance records found for this course.</p>
                    )}
                </div>
            )}

            {/* ── CERTIFICATES TAB ─────────────────────────────── */}
            {activeTab === 'certificates' && (
                <div>
                    <Card style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <span style={{ fontSize: '2rem' }}>🎓</span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Course Completion Certificate</h2>
                        
                        {certificateData ? (
                            <div>
                                <p style={{ color: '#64748B', marginBottom: '1rem' }}>
                                    Status: <strong style={{ color: certificateData.status === 'approved' ? '#10B981' : (certificateData.status === 'rejected' ? '#EF4444' : '#F59E0B') }}>{certificateData.status.toUpperCase()}</strong>
                                </p>
                                {certificateData.status === 'rejected' && certificateData.admin_feedback && (
                                    <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', color: '#991B1B', textAlign: 'left' }}>
                                        <strong>Rejection Reason:</strong> {certificateData.admin_feedback}
                                    </div>
                                )}
                                {certificateData.status === 'approved' && (
                                    <Button variant="primary">Download Certificate</Button>
                                )}
                                {certificateData.status === 'rejected' && (
                                    <Button onClick={() => setCertModalOpen(true)}>Request Again</Button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>
                                    You have not requested a certificate for this course yet. Once you complete all modules, mock tests, and assignments, you can request your certificate.
                                </p>
                                <Button onClick={() => setCertModalOpen(true)}>Request Certificate</Button>
                            </div>
                        )}
                    </Card>

                    {certModalOpen && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <Card style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                                <button
                                    onClick={() => setCertModalOpen(false)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                                >
                                    <X size={24} />
                                </button>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Request Certificate</h2>
                                <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Upload a short video introducing our institute, your trainer, and your review of the course.</p>
                                
                                <Input 
                                    label="Video Link (Google Drive / YouTube)" 
                                    placeholder="https://..."
                                    value={videoLink}
                                    onChange={(e) => setVideoLink(e.target.value)}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                    <Button variant="ghost" onClick={() => setCertModalOpen(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleRequestCertificate} disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

};

export default StudentCourseView;
