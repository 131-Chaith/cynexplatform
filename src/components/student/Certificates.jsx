import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Award, Video, UploadCloud, CheckCircle, AlertCircle, X, Clock, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../context/AuthContext';

const Certificates = () => {
    const { currentUser } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [myCertificates, setMyCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null); // Track which cert is downloading
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [videoLink, setVideoLink] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const fileInputRef = useRef(null);
    const certificateTemplateRef = useRef(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [coursesRes, certsRes, requestsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/students/certificates'),
                api.get('/students/certificates/requests')
            ]);
            setEnrolledCourses(coursesRes.data);
            setMyCertificates(certsRes.data);
            setMyRequests(requestsRes.data);
        } catch (error) {
            console.error('Failed to fetch certificate data', error);
        } finally {
            setLoading(false);
        }
    };

    // Build the course status by merging enrollments, certs, and requests
    const coursesWithStatus = enrolledCourses.map(course => {
        const cert = myCertificates.find(c => c.course_id === course.id);
        if (cert) return { ...course, status: 'issued', issue_date: cert.issue_date || cert.issued_at || cert.created_at || new Date().toISOString() };

        const req = myRequests.find(r => r.course_id === course.id);
        if (req) return { ...course, status: req.status === 'rejected' ? 'rejected' : 'pending', request_date: req.created_at, admin_feedback: req.admin_feedback };

        return { ...course, status: 'available' };
    });

    const handleOpenRequest = (courseId) => {
        setSelectedCourseId(courseId);
        setVideoLink('');
        setVideoFile(null);
        setShowRequestModal(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check video duration
            try {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    const durationInSeconds = video.duration;
                    window.URL.revokeObjectURL(video.src);
                    
                    if (durationInSeconds < 30) {
                        alert('Video length should be minimum 30 seconds. Your video is only ' + durationInSeconds.toFixed(1) + 's.');
                        setVideoFile(null);
                        setVideoLink('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    } else {
                        setVideoFile(file);
                        setVideoLink(file.name);
                    }
                };
                video.src = URL.createObjectURL(file);
            } catch (err) {
                console.error("Video duration check failed:", err);
                // Fallback to allowing selection if check fails
                setVideoFile(file);
                setVideoLink(file.name);
            }
        }
    };

    const handleSubmitRequest = async () => {
        if (!videoFile) return alert('Please upload a video before submitting.');
        if (videoLink === 'mock_video_upload.mp4' && !videoFile) {
            // Special handle for simulate if we want to bypass duration check
        }
        
        setLoading(true);
        const formData = new FormData();
        formData.append('course_id', selectedCourseId);
        
        if (videoFile) {
            formData.append('video', videoFile);
        }

        try {
            await api.post('/students/certificates/request', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowRequestModal(false);
            setSelectedCourseId(null);
            setVideoFile(null);
            alert('Certificate request submitted! Waiting for admin approval.');
            fetchAll();
        } catch (error) {
            console.error('Failed to request certificate', error);
            alert('Failed to submit request: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (cert) => {
        setDownloading(cert.id);
        try {
            // Give time for the hidden template to render with correct data
            setTimeout(async () => {
                const element = document.getElementById(`cert-template-${cert.id}`);
                if (!element) {
                    console.error("Template not found");
                    setDownloading(null);
                    return;
                }

                const canvas = await html2canvas(element, {
                    scale: 3, // High quality
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width / 3, canvas.height / 3]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
                pdf.save(`Certificate_${cert.title.replace(/\s+/g, '_')}.pdf`);
                setDownloading(null);
            }, 100);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
            setDownloading(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #6366F1', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Certificates
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    View earned certificates and request new ones for your enrolled courses.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {coursesWithStatus.map(cert => (
                    <Card key={cert.id} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                        <div style={{
                            height: '200px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: cert.status === 'issued'
                                ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)'
                                : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative background for issued certificates */}
                            {cert.status === 'issued' && (
                                <>
                                    <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                    <div style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.1 }}>
                                        <Award size={120} color="white" />
                                    </div>
                                </>
                            )}
                            
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '24px',
                                backgroundColor: cert.status === 'issued' ? 'rgba(255, 255, 255, 0.1)' : 'white',
                                backdropFilter: cert.status === 'issued' ? 'blur(10px)' : 'none',
                                border: cert.status === 'issued' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: cert.status === 'issued' ? '#FBBF24' : '#94A3B8',
                                zIndex: 1,
                                boxShadow: cert.status === 'issued' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Award size={cert.status === 'issued' ? 40 : 32} />
                            </div>

                            {cert.status === 'issued' && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10B981',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Verified
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: '900', 
                                color: '#1E293B', 
                                marginBottom: '0.5rem',
                                letterSpacing: '-0.025em'
                            }}>
                                {cert.title}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                {cert.description || 'Master the complete syllabus and pass the final evaluation to receive your industry-recognized certification.'}
                            </p>

                            <div style={{ marginTop: 'auto' }}>
                                {cert.status === 'issued' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <CheckCircle size={14} style={{ color: '#10B981' }} />
                                            <span>Awarded on {new Date(cert.issue_date).toLocaleDateString()}</span>
                                        </div>
                                        <Button 
                                            variant="primary" 
                                            style={{ 
                                                width: '100%', 
                                                borderRadius: '12px', 
                                                fontWeight: '800', 
                                                backgroundColor: '#1E1B4B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                            disabled={downloading === cert.id}
                                            onClick={() => handleDownloadPDF(cert)}
                                        >
                                            {downloading === cert.id ? (
                                                <>
                                                    <div className="spinner-mini" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                    GENERATING...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={18} />
                                                    DOWNLOAD PDF
                                                </>
                                            )}
                                        </Button>
                                        
                                        {/* Hidden Template for PDF Generation */}
                                        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                                            <div 
                                                id={`cert-template-${cert.id}`}
                                                style={{
                                                    width: '1000px',
                                                    height: '700px',
                                                    padding: '40px',
                                                    background: 'white',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontFamily: "'Inter', sans-serif",
                                                    color: '#1E293B',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {/* Fancy Border */}
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px solid #1E1B4B', pointerEvents: 'none' }} />
                                                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '1px solid #6366F1', opacity: 0.3, pointerEvents: 'none' }} />
                                                
                                                {/* Background Watermark */}
                                                <div style={{ position: 'absolute', opacity: 0.03, zIndex: 0 }}>
                                                    <Award size={400} color="#1E1B4B" />
                                                </div>

                                                {/* Content */}
                                                <div style={{ zIndex: 1, textAlign: 'center', width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                                        <div style={{ width: '50px', height: '50px', background: '#1E1B4B', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                            <Award size={30} />
                                                        </div>
                                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E1B4B', letterSpacing: '2px' }}>CYNEX AI ACADEMY</h2>
                                                    </div>

                                                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#1E293B', margin: '1rem 0' }}>CERTIFICATE</h1>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748B', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '3rem' }}>OF APPRECIATION</h3>

                                                    <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '1rem' }}>This is to certify that</p>
                                                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#6366F1', textDecoration: 'underline', marginBottom: '1.5rem' }}>
                                                        {currentUser?.name?.toUpperCase() || 'VALUED STUDENT'}
                                                    </h2>

                                                    <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                                                        has successfully completed the comprehensive training program in <br/>
                                                        <strong style={{ color: '#1E1B4B', fontSize: '1.5rem' }}>{cert.title}</strong><br/>
                                                        demonstrating exceptional proficiency and dedication to the field of AI and modern technology.
                                                    </p>

                                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', marginTop: '2rem' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ width: '200px', borderBottom: '1px solid #CBD5E1', marginBottom: '0.5rem' }}></div>
                                                            <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '700' }}>DATE OF ISSUE</p>
                                                            <p style={{ fontSize: '1rem', color: '#1E293B', fontWeight: '800' }}>{new Date(cert.issue_date).toLocaleDateString()}</p>
                                                        </div>
                                                        
                                                        <div style={{ position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', opacity: 0.8 }}>
                                                                <ShieldCheck size={80} color="#6366F1" />
                                                            </div>
                                                            <div style={{ width: '150px', height: '150px', border: '4px double #E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <p style={{ fontSize: '0.7rem', fontWeight: '900', color: '#6366F1' }}>VERIFIED</p>
                                                                    <p style={{ fontSize: '0.6rem', color: '#94A3B8' }}>{cert.id.toString().padStart(8, '0')}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ width: '200px', borderBottom: '1px solid #CBD5E1', marginBottom: '0.5rem' }}>
                                                                <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.5rem', color: '#1E1B4B' }}>Cynex Admin</span>
                                                            </div>
                                                            <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '700' }}>DIRECTOR OF EDUCATION</p>
                                                            <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>CYNEX AI TECHNOLOGIES</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Corner Accents */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '150px', height: '150px', background: 'linear-gradient(135deg, #1E1B4B 0%, transparent 70%)', opacity: 0.1 }} />
                                                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '150px', height: '150px', background: 'linear-gradient(315deg, #6366F1 0%, transparent 70%)', opacity: 0.1 }} />
                                            </div>
                                        </div>
                                    </div>
                                ) : cert.status === 'pending' ? (
                                    <div style={{
                                        padding: '1rem', borderRadius: '12px',
                                        backgroundColor: '#FFFBEB', color: '#D97706',
                                        textAlign: 'center', fontSize: '0.85rem',
                                        fontWeight: '700',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        border: '1px solid #FEF3C7'
                                    }}>
                                        <Clock size={16} /> VERIFICATION IN PROGRESS
                                    </div>
                                ) : cert.status === 'rejected' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{
                                            padding: '0.75rem', borderRadius: '12px',
                                            backgroundColor: '#FEF2F2', color: '#EF4444',
                                            textAlign: 'center', fontSize: '0.85rem',
                                            fontWeight: '700',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            border: '1px solid #FEE2E2',
                                            flexDirection: 'column'
                                        }}>
                                            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom: '0.5rem'}}><AlertCircle size={16} /> SUBMISSION REJECTED</div>
                                            {cert.admin_feedback && (
                                                <div style={{ 
                                                    fontSize: '0.8rem', 
                                                    fontWeight:'500', 
                                                    backgroundColor: 'rgba(0,0,0,0.03)', 
                                                    padding: '0.75rem', 
                                                    borderRadius: '8px',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    borderLeft: '4px solid #EF4444'
                                                }}>
                                                    <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#B91C1C' }}>Instructions from Admin:</strong>
                                                    {cert.admin_feedback}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="primary" style={{ width: '100%', borderRadius: '12px', fontWeight: '800' }} onClick={() => handleOpenRequest(cert.id)}>
                                            REBUILD & RE-SUBMIT
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="primary" style={{ width: '100%', borderRadius: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' }} onClick={() => handleOpenRequest(cert.id)}>
                                        CLAIM CERTIFICATE
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {coursesWithStatus.length === 0 && (
                    <div style={{ 
                        gridColumn: '1 / -1', 
                        textAlign: 'center', 
                        padding: '5rem 2rem', 
                        backgroundColor: '#F8FAFC',
                        borderRadius: '2rem',
                        border: '2px dashed #E2E8F0',
                        color: '#64748B'
                    }}>
                        <Award size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.5rem' }}>No Certificates Ready</h3>
                        <p style={{ maxWidth: '400px', margin: '0 auto' }}>Enroll in courses and complete all requirements to begin earning your certifications.</p>
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)', padding: '1.5rem'
                }}>
                    <Card style={{ 
                        width: '100%', 
                        maxWidth: '550px', 
                        backgroundColor: '#ffffff',
                        borderRadius: '2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        padding: '3rem 2.5rem',
                        textAlign: 'center',
                        border: 'none'
                    }}>
                        <button
                            onClick={() => setShowRequestModal(false)}
                            style={{ 
                                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                                border: 'none', background: 'rgba(0,0,0,0.05)', 
                                cursor: 'pointer', color: '#000000',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ 
                            width: '64px', height: '64px', backgroundColor: '#F3F4F6', 
                            borderRadius: '1.25rem', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', color: '#3B82F6', margin: '0 auto 1.5rem'
                        }}>
                            <Video size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#000000', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
                            Request Certificate
                        </h2>
                        
                        <p style={{ color: '#4B5563', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                            To verify your achievements, please upload a short video (min 30s) introducing yourself and sharing your experience with the course.
                        </p>

                        <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#000000', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Verification Media
                            </label>
                            
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                style={{ 
                                    border: '2px dashed #E5E7EB', 
                                    borderRadius: '1.25rem', 
                                    padding: '2rem', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: '#F9FAFB'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <UploadCloud size={32} color={videoFile ? "#10B981" : "#9CA3AF"} />
                                    <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '600' }}>
                                        {videoFile ? videoFile.name : "Click to select or drag video file"}
                                    </span>
                                    {videoFile && (
                                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '700' }}>
                                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB - READY
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="video/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button 
                                variant="ghost" 
                                style={{ flex: 1, height: '3.5rem', borderRadius: '1rem', fontWeight: '700', color: '#6B7280' }}
                                onClick={() => setShowRequestModal(false)}
                            >
                                Cancel
                            </Button>
                            <button 
                                onClick={handleSubmitRequest}
                                style={{ 
                                    flex: 2,
                                    height: '3.5rem',
                                    borderRadius: '1rem',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                                    color: '#ffffff',
                                    fontWeight: '800',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Submit Request
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Certificates;
