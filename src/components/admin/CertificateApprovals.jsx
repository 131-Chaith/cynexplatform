import React from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Card';
import Button from '../Button';
import { PlayCircle, CheckCircle, XCircle, Clock, User, Book, Award } from 'lucide-react';

const CertificateApprovals = () => {
    const { data, approveCertificate, rejectCertificate } = useData();
    const [activeTab, setActiveTab] = React.useState('pending');

    // Filter requests based on tab
    const filteredRequests = (data.certificateRequests || []).filter(req => {
        if (activeTab === 'pending') return req.status === 'pending';
        return req.status === 'approved' || req.status === 'rejected';
    });

    const getCourseName = (courseId) => {
        const courses = data.courses || [];
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : `Course #${courseId}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            case 'pending': return '#F59E0B';
            default: return 'var(--text-light)';
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        Certificate Approvals
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', fontWeight: '500' }}>
                        Review student video submissions to verify course completion.
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button 
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                        background: activeTab === 'pending' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'pending' ? 'white' : 'var(--text-light)',
                        fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                    }}
                >
                    Pending ({ (data.certificateRequests || []).filter(r => r.status === 'pending').length })
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                        background: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'history' ? 'white' : 'var(--text-light)',
                        fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: activeTab === 'history' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                    }}
                >
                    History ({ (data.certificateRequests || []).filter(r => r.status !== 'pending').length })
                </button>
            </div>

            {activeTab === 'history' ? (
                <Card style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch</th>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</th>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</th>
                                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.8rem', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(req => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 1rem', fontWeight: '750', color: '#1E293B' }}>{req.student_name}</td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <span style={{ padding: '0.35rem 0.8rem', background: '#EEF2FF', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#4F46E5', border: '1px solid #E0E7FF' }}>
                                                {req.batch_name || 'General'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontWeight: '600', color: '#475569' }}>{req.course_title}</td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: getStatusColor(req.status), fontWeight: '900', fontSize: '0.8rem' }}>
                                                {req.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {req.status.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', color: '#94A3B8', fontSize: '0.85rem', fontWeight: '700' }}>
                                            {new Date(req.request_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            {req.status === 'approved' && (
                                                <button 
                                                    title="View Certificate"
                                                    style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                    onClick={() => alert("Certificate View Protocol Initiated. (Reference ID: " + req.id + ")")}
                                                >
                                                    <Award size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
                                            <Award size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                            <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No historical records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredRequests.map(req => (
                        <Card key={req.id} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem', borderRadius: '1.5rem' }}>
                            <div style={{
                                width: '160px',
                                height: '100px',
                                backgroundColor: '#0F172A',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }} onClick={() => window.location.href = `/video-player?url=${req.video_link || req.videoLink}&back=/admin/certificates`}>
                                <PlayCircle size={36} color="white" style={{ zIndex: 2 }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4))', zIndex: 1 }} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
                                        {req.student_name || req.studentName || 'Unknown Student'}
                                    </h3>
                                    <span style={{ 
                                        padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '900',
                                        background: getStatusColor(req.status) + '15',
                                        color: getStatusColor(req.status),
                                        textTransform: 'uppercase'
                                    }}>
                                        {req.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                                    <Book size={16} color="var(--primary)" />
                                    <span>{getCourseName(req.course_id || req.courseId)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                                    <Clock size={14} />
                                    <span>Requested: {new Date(req.request_date || req.requestDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {req.status === 'pending' ? (
                                    <>
                                        <Button size="small" onClick={async () => {
                                            const success = await approveCertificate(req.id);
                                            if (success) alert("Certificate issued!");
                                        }} style={{ borderRadius: '12px', padding: '0.6rem 1.25rem', fontWeight: '800' }}>
                                            <CheckCircle size={16} style={{ marginRight: '0.4rem' }} /> Approve
                                        </Button>
                                        <Button variant="danger" size="small" onClick={async () => {
                                            const reason = window.prompt("Rejection reason:");
                                            if (reason !== null) {
                                                const success = await rejectCertificate(req.id, reason);
                                                if (success) alert("Request rejected.");
                                            }
                                        }} style={{ borderRadius: '12px', padding: '0.6rem 1.25rem', fontWeight: '800', background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FEE2E2' }}>
                                            <XCircle size={16} style={{ marginRight: '0.4rem' }} /> Reject
                                        </Button>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, fontWeight: '700' }}>
                                            {req.status === 'approved' ? 'Processed' : 'Rejected'}
                                        </p>
                                        {req.admin_feedback && (
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: '0.25rem 0 0', maxWidth: '200px' }}>
                                                "{req.admin_feedback}"
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                    {filteredRequests.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'white', borderRadius: '2rem', border: '2px dashed var(--border-color)' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={32} color="#CBD5E1" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                All caught up!
                            </h3>
                            <p style={{ color: 'var(--text-light)', fontWeight: '600' }}>
                                No pending approval requests at this time.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificateApprovals;
