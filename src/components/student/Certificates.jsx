import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Award, Video, UploadCloud, CheckCircle, AlertCircle, X, Clock } from 'lucide-react';

const Certificates = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [myCertificates, setMyCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [videoLink, setVideoLink] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const fileInputRef = useRef(null);

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
        if (cert) return { ...course, status: 'issued', issue_date: cert.issued_at || cert.created_at };

        const req = myRequests.find(r => r.course_id === course.id);
        if (req) return { ...course, status: req.status === 'rejected' ? 'rejected' : 'pending', request_date: req.created_at };

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
        if (!videoFile && !videoLink) return alert('Please provide a video link or upload a file.');
        if (videoLink === 'mock_video_upload.mp4' && !videoFile) {
            // Special handle for simulate if we want to bypass duration check
        }
        
        setLoading(true);
        const formData = new FormData();
        formData.append('course_id', selectedCourseId);
        
        if (videoFile) {
            formData.append('video', videoFile);
        } else if (videoLink) {
            formData.append('video_link', videoLink);
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

    if (loading) return <p>Loading certificates...</p>;

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
                                        <Button variant="primary" style={{ width: '100%', borderRadius: '12px', fontWeight: '800', backgroundColor: '#1E1B4B' }}
                                            onClick={() => alert('PDF generation in progress...')}>
                                            VIEW CERTIFICATE
                                        </Button>
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
                                            border: '1px solid #FEE2E2'
                                        }}>
                                            <AlertCircle size={16} /> SUBMISSION REJECTED
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
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <Card style={{ width: '100%', maxWidth: '500px', margin: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowRequestModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Request Certificate</h2>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', display: 'flex', gap: '1rem' }}>
                            <Video color="var(--primary)" size={32} style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.25rem' }}>Video Verification Required</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                                    Please record a short video sharing your learning experience to unlock your certificate.
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text)' }}>
                                Video URL / File Name
                            </label>
                            <Input
                                placeholder="https://drive.google.com/..."
                                value={videoLink}
                                onChange={(e) => {
                                    setVideoLink(e.target.value);
                                    if (videoFile) setVideoFile(null); // Clear file if user types manually
                                }}
                            />
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <Button size="small" variant="outline" onClick={() => fileInputRef.current.click()}>
                                    <UploadCloud size={14} style={{ marginRight: '0.4rem' }} /> Import from gallery
                                </Button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="video/*" 
                                    onChange={handleFileChange} 
                                />
                                <Button size="small" variant="ghost" onClick={() => setVideoLink('mock_video_upload.mp4')}>
                                    Simulate
                                </Button>
                            </div>
                            {videoFile && (
                                <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem' }}>
                                    ✓ Ready to upload: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                            <Button onClick={handleSubmitRequest}>Submit Request</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Certificates;
