import React from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Card';
import Button from '../Button';
import { PlayCircle, CheckCircle, XCircle } from 'lucide-react';

const CertificateApprovals = () => {
    const { data, approveCertificate, rejectCertificate } = useData();

    // Filter only pending requests
    const pendingRequests = (data.certificateRequests || []).filter(req => req.status === 'pending');

    const getCourseName = (courseId) => {
        const courses = data.courses || [];
        // Fallback for mock courses if they aren't in the global data yet (since we didn't fully implement course management)
        const mockCourses = [
            { id: 1, title: 'Web Development Bootcamp' },
            { id: 2, title: 'Advanced React Patterns' },
            { id: 3, title: 'Backend with Node.js' }
        ];
        const course = courses.find(c => c.id === courseId) || mockCourses.find(c => c.id === courseId);
        return course ? course.title : `Course #${courseId}`;
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Certificate Approvals
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Review student video submissions before issuing certificates.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingRequests.map(req => (
                    <Card key={req.id} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '120px',
                            height: '80px',
                            backgroundColor: 'var(--dark)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }} onClick={() => window.location.href = `/video-player?url=${req.video_link || req.videoLink}&back=/admin/certificates`}>
                            <PlayCircle size={32} color="white" />
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)' }}>
                                {req.student_name || req.studentName || 'Unknown Student'}
                            </h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                Requested for <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{getCourseName(req.course_id || req.courseId)}</span>
                            </p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                Submitted on: {new Date(req.request_date || req.requestDate).toLocaleDateString()}
                            </p>
                            {(req.video_link || req.videoLink) && (
                                <a href={`/video-player?url=${req.video_link || req.videoLink}&back=/admin/certificates`} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>
                                    View Video Submission
                                </a>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" size="small" onClick={async () => {
                                const success = await approveCertificate(req.id);
                                if (success) alert("Certificate approved and issued!");
                            }}>
                                <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Approve
                            </Button>
                            <Button variant="danger" size="small" onClick={async () => {
                                const reason = window.prompt("Enter instructions/reason for rejection:");
                                if (reason !== null) {
                                    const success = await rejectCertificate(req.id, reason);
                                    if (success) alert("Certificate request rejected. Instructions sent to student.");
                                }
                            }}>
                                <XCircle size={16} style={{ marginRight: '0.5rem' }} /> Reject
                            </Button>
                        </div>
                    </Card>
                ))}

                {pendingRequests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--light)', borderRadius: '0.5rem' }}>
                        <p style={{ color: 'var(--text-light)' }}>No pending approvals at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateApprovals;
