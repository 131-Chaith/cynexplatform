import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import AssignmentRunner from './AssignmentRunner';
import { FileText, Upload, CheckCircle, Clock, BookOpen, X, Award, PlayCircle } from 'lucide-react';

const Assignments = () => {
    const [activeTab, setActiveTab] = useState('available');
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [submissionModal, setSubmissionModal] = useState({ isOpen: false, assignmentId: null });
    const [submissionLink, setSubmissionLink] = useState('');
    const [allAssignments, setAllAssignments] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const [assignRes, subRes] = await Promise.all([
                api.get('/students/assignments'),
                api.get('/students/submissions')
            ]);
            setAllAssignments(assignRes.data);
            setMySubmissions(subRes.data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };


    // Merge assignments with submission status
    const myAssignments = useMemo(() => {
        return allAssignments.map(assignment => {
            const submission = mySubmissions.find(s => s.assignment_id === assignment.id);
            if (submission) {
                return {
                    ...assignment,
                    status: submission.grade ? 'graded' : 'submitted',
                    grade: submission.grade,
                    submissionDate: submission.submitted_at,
                    submitted_code: submission.submission_code,
                    submitted_score: submission.score
                };
            }
            return { ...assignment, status: 'available' };
        });
    }, [mySubmissions, allAssignments]);

    const filteredAssignments = myAssignments.filter(a => {
        if (activeTab === 'available') return a.status === 'available';
        if (activeTab === 'completed') return a.status === 'submitted' || a.status === 'graded';
        return true;
    });

    const handleOpenSubmit = (id) => {
        setSubmissionModal({ isOpen: true, assignmentId: id });
        setSubmissionLink('');
    };

    const handleConfirmSubmit = async () => {
        if (!submissionLink.trim()) return alert('Please enter a link');
        try {
            await api.post('/students/assignments/submit', {
                assignment_id: submissionModal.assignmentId,
                submission_link: submissionLink,
                type: 'standard'
            });
            await fetchAssignments();
            setSubmissionModal({ isOpen: false, assignmentId: null });
            alert('Assignment submitted successfully!');
        } catch (error) {
            console.error('Failed to submit assignment', error);
            alert('Failed to submit assignment');
        }
    };

    const handleInteractiveComplete = async (code) => {
        try {
            await api.post('/students/assignments/submit', {
                assignment_id: activeAssignment.id,
                submission_code: code,
                type: 'interactive',
                score: 100 // Default full score for completion
            });
            await fetchAssignments();
            setActiveAssignment(null);
            alert('Interactive assignment submitted!');
        } catch (err) {
            alert('Submission failed');
        }
    };

    if (activeAssignment) {
        return (
            <AssignmentRunner 
                assignment={activeAssignment}
                onComplete={handleInteractiveComplete}
                onCancel={() => setActiveAssignment(null)}
            />
        );
    }

    if (loading && allAssignments.length === 0) return <p>Loading assignments...</p>;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Assignments
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Track and submit your coursework.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('available')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'available' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'available' ? 'var(--primary)' : 'var(--text-light)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Available
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'completed' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'completed' ? 'var(--primary)' : 'var(--text-light)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Completed
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredAssignments.map(assignment => (
                    <Card key={assignment.id} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '1rem', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.6)' }}>
                        <div style={{
                            display: 'flex',
                            gap: '1.5rem',
                            padding: '1.5rem',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: 'transparent'
                        }}>
                             <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                backgroundColor: assignment.status === 'available' ? '#EFF6FF' : (assignment.status === 'graded' ? '#F0FDF4' : '#F8FAFC'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: assignment.status === 'available' ? '#2563EB' : (assignment.status === 'graded' ? '#16A34A' : '#64748B'),
                                flexShrink: 0
                            }}>
                                <FileText size={28} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.025em', textShadow: '0 0 15px rgba(56,189,248,0.3)' }}>{assignment.title}</h3>
                                    <div>
                                        {assignment.status === 'available' && (
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '12px',
                                                backgroundColor: '#EFF6FF',
                                                color: '#2563EB',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.025em',
                                                border: '1px solid #DBEAFE'
                                            }}>
                                                <Clock size={14} /> Available
                                            </span>
                                        )}
                                        {assignment.status === 'submitted' && (
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '12px',
                                                backgroundColor: '#F8FAFC',
                                                color: '#64748B',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.025em',
                                                border: '1px solid #E2E8F0'
                                            }}>
                                                <CheckCircle size={14} /> Submitted
                                            </span>
                                        )}
                                        {assignment.status === 'graded' && (
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '12px',
                                                backgroundColor: '#F0FDF4',
                                                color: '#16A34A',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.025em',
                                                border: '1px solid #DCFCE7'
                                            }}>
                                                <Award size={14} /> {assignment.grade}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ color: '#64748B', fontSize: '0.875rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <BookOpen size={14} style={{ color: '#2563EB' }} /> 
                                        <span>{assignment.course_title}</span>
                                    </div>
                                    {assignment.module_title && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ opacity: 0.5 }}>•</span>
                                            <span style={{ color: '#94A3B8' }}>{assignment.module_title}</span>
                                        </div>
                                    )}
                                    {assignment.due_date && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ opacity: 0.5 }}>•</span>
                                            <Clock size={14} style={{ color: '#F59E0B' }} />
                                            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', backgroundColor: 'transparent' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                {assignment.description}
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                {assignment.status === 'available' && (
                                    <Button variant="primary" style={{ borderRadius: '12px', fontWeight: '800', paddingLeft: '2rem', paddingRight: '2rem' }} onClick={() => setActiveAssignment(assignment)}>
                                        <PlayCircle size={18} style={{ marginRight: '0.5rem' }} /> START ASSIGNMENT
                                    </Button>
                                )}
                                <Button variant="outline" style={{ borderRadius: '12px', fontWeight: '800', border: '1px solid #E2E8F0' }}>VIEW DETAILS</Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredAssignments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                        <p>No assignments found in this category.</p>
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {submissionModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <Card style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={() => setSubmissionModal({ isOpen: false, assignmentId: null })}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Submit Assignment</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text)' }}>
                                Project/Repo Link
                            </label>
                            <Input
                                placeholder="https://github.com/..."
                                value={submissionLink}
                                onChange={(e) => setSubmissionLink(e.target.value)}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                Please provide a link to your GitHub repository or hosted project.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="ghost" onClick={() => setSubmissionModal({ isOpen: false, assignmentId: null })}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirmSubmit}>
                                Submit
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Assignments;
