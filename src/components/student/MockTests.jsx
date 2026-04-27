import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import TestRunner from './TestRunner';
import { PlayCircle, Clock, CheckCircle, Code, BookOpen, ArrowRight } from 'lucide-react';

const MockTests = () => {
    const [tests, setTests] = useState([]);
    const [myResults, setMyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');
    const [activeTest, setActiveTest] = useState(null);
    const [viewingResult, setViewingResult] = useState(null);
    const [isAnswersModalOpen, setIsAnswersModalOpen] = useState(false);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const [testsRes, resultsRes] = await Promise.all([
                api.get('/students/tests'),
                api.get('/students/test-results')
            ]);
            setTests(testsRes.data);
            setMyResults(resultsRes.data);
        } catch (error) {
            console.error('Failed to fetch tests', error);
        } finally {
            setLoading(false);
        }
    };

    // Merge test data with results
    const myTests = tests.map(test => {
        const result = myResults.find(r => r.test_id === test.id);
        if (result) {
            return {
                ...test,
                status: 'completed',
                score: result.score,
                total_questions_attempted: result.total_questions,
                completed_at: result.completed_at
            };
        }
        return { ...test, status: 'available' };
    });

    const filteredTests = myTests.filter(t =>
        activeTab === 'available' 
            ? (t.status === 'available' && t.questions?.length > 0) 
            : t.status === 'completed'
    );

    const handleTestComplete = async (score, total, answers) => {
        try {
            const response = await api.post('/students/tests/submit', {
                test_id: activeTest.id,
                score,
                total_questions: total,
                answers
            });

            // Get the newly created result
            const [testsRes, resultsRes] = await Promise.all([
                api.get('/students/tests'),
                api.get('/students/test-results')
            ]);

            setTests(testsRes.data);
            setMyResults(resultsRes.data);

            // Find the result we just submitted to show in summary
            const latestResult = resultsRes.data.find(r => r.test_id === activeTest.id);
            if (latestResult) {
                setViewingResult(latestResult);
                setIsAnswersModalOpen(true);
            }

            setActiveTest(null);
            setActiveTab('completed');
        } catch (error) {
            console.error('Failed to submit result', error);
            alert('Failed to save test result');
        }
    };

    if (activeTest) {
        return (
            <TestRunner
                test={activeTest}
                onComplete={handleTestComplete}
                onCancel={() => setActiveTest(null)}
            />
        );
    }

    if (loading) return <p>Loading mock tests...</p>;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Mock Tests
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Practice and evaluate your skills for enrolled courses.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['available', 'completed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-light)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'available' ? 'Available' : 'Completed'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'available' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr', gap: '1.5rem' }}>
                {activeTab === 'available' ? (
                    filteredTests.map(test => (
                        <Card 
                            key={test.id} 
                            style={{ 
                                padding: 0, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                height: '100%',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid #F1F5F9',
                                background: test.type === 'Coding' ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        color: test.type === 'Coding' ? '#4F46E5' : '#059669'
                                    }}>
                                        {test.type === 'Coding' ? <Code size={20} /> : <BookOpen size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: '800', 
                                            textTransform: 'uppercase', 
                                            color: test.type === 'Coding' ? '#4F46E5' : '#059669',
                                            letterSpacing: '0.05em',
                                            lineHeight: '1'
                                        }}>
                                            {test.type || 'MCQ'} Challenge
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ 
                                    fontSize: '1.25rem', 
                                    fontWeight: '900', 
                                    color: '#1E293B', 
                                    marginBottom: '0.75rem',
                                    lineHeight: '1.3',
                                    letterSpacing: '-0.025em'
                                }}>
                                    {test.title}
                                </h3>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    fontSize: '0.85rem', 
                                    color: '#64748B', 
                                    marginBottom: '1.5rem',
                                    fontWeight: '500'
                                }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.6rem', 
                                        backgroundColor: '#F1F5F9', 
                                        borderRadius: '6px',
                                        color: '#475569'
                                    }}>
                                        {test.course_title}
                                    </span>
                                    {test.module_title && (
                                        <>
                                            <span style={{ opacity: 0.5 }}>•</span>
                                            <span style={{ color: '#94A3B8' }}>{test.module_title}</span>
                                        </>
                                    )}
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr', 
                                    gap: '1rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Limit</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: '800' }}>
                                            <Clock size={14} style={{ color: '#6366F1' }} />
                                            <span>{test.duration} mins</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Scope</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: '800' }}>
                                            <PlayCircle size={14} style={{ color: '#F59E0B' }} />
                                            <span>{test.questions?.length || 0} Questions</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    style={{ 
                                        width: '100%', 
                                        marginTop: 'auto',
                                        borderRadius: '1rem',
                                        padding: '1rem',
                                        fontWeight: '900',
                                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
                                    }}
                                    onClick={() => setActiveTest(test)}
                                    disabled={!test.questions?.length}
                                >
                                    {test.questions?.length ? (
                                        <>
                                            BEGIN ASSESSMENT
                                            <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                                        </>
                                    ) : 'No Questions Yet'}
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--light)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem' }}>Student</th>
                                        <th style={{ padding: '1rem' }}>Test Title</th>
                                        <th style={{ padding: '1rem' }}>Course</th>
                                        <th style={{ padding: '1rem' }}>Module</th>
                                        <th style={{ padding: '1rem' }}>Score</th>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myResults.map(result => {
                                        const rawAnswers = typeof result.answers === 'string' ? JSON.parse(result.answers) : (result.answers || {});
                                        const rawQuestions = typeof result.questions === 'string' ? JSON.parse(result.questions) : (result.questions || []);
                                        const totalQ = result.total_questions || rawQuestions.length;
                                        const correctQ = result.score;

                                        // Robust calculation of answered count
                                        // If data is missing (old tests), assume at least 'score' were answered
                                        const answeredCountFromData = Object.keys(rawAnswers).length;
                                        const answeredQ = Math.max(answeredCountFromData, correctQ);

                                        const incorrectQ = Math.max(0, answeredQ - correctQ);
                                        const skippedQ = Math.max(0, totalQ - answeredQ);

                                        return (
                                            <tr key={result.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{result.student_name || 'My Score'}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600' }}>{result.test_title}</td>
                                                <td style={{ padding: '1rem' }}>{result.course_title}</td>
                                                <td style={{ padding: '1rem' }}>{result.module_title || 'Direct'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '1rem',
                                                            backgroundColor: (result.score / totalQ) >= 0.5 ? '#DEF7EC' : '#FDE8E8',
                                                            color: (result.score / totalQ) >= 0.5 ? '#03543F' : '#9B1C1C',
                                                            fontWeight: 'bold',
                                                            textAlign: 'center',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {result.score} / {totalQ}
                                                        </span>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            {incorrectQ > 0 && <span title="Incorrect" style={{ color: '#E02424' }}>✖ {incorrectQ}</span>}
                                                            {skippedQ > 0 && <span title="Skipped" style={{ color: '#6B7280' }}>⚪ {skippedQ}</span>}
                                                            {skippedQ === 0 && incorrectQ === 0 && <span style={{ color: '#059669' }}>Perfect!</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                                    {new Date(result.completed_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setViewingResult(result);
                                                            setIsAnswersModalOpen(true);
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {myResults.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                                No completed tests yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'available' && filteredTests.length === 0 && (
                    <div style={{ 
                        gridColumn: '1 / -1', 
                        textAlign: 'center', 
                        padding: '5rem 2rem', 
                        backgroundColor: 'var(--white)',
                        borderRadius: '1rem',
                        border: '2px dashed var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        marginTop: '1rem'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)'
                        }}>
                            <BookOpen size={40} color="var(--primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.75rem' }}>No Tests Available</h3>
                        <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
                            You're all caught up! There are currently no mock tests assigned to your enrolled courses. Check back later for new assessments.
                        </p>
                    </div>
                )}
            </div>

            {/* Answers Modal */}
            {isAnswersModalOpen && viewingResult && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)' }}>{viewingResult.test_title}</h3>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        backgroundColor: (viewingResult.score / viewingResult.total_questions) >= 0.5 ? '#DEF7EC' : '#FDE8E8',
                                        color: (viewingResult.score / viewingResult.total_questions) >= 0.5 ? '#03543F' : '#9B1C1C',
                                    }}>
                                        {(viewingResult.score / viewingResult.total_questions) >= 0.5 ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                    <span>{viewingResult.course_title}</span>
                                    {viewingResult.module_title && <span>• {viewingResult.module_title}</span>}
                                    <span>• {new Date(viewingResult.completed_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--primary)', lineHeight: '1', marginBottom: '0.25rem' }}>
                                    {Math.round((viewingResult.score / (viewingResult.total_questions || (viewingResult.questions?.length || 1))) * 100)}%
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {viewingResult.score} Correct of {viewingResult.total_questions || viewingResult.questions?.length}
                                </div>
                                {(() => {
                                    const rawAns = typeof viewingResult.answers === 'string' ? JSON.parse(viewingResult.answers) : (viewingResult.answers || {});
                                    const totalQ = viewingResult.total_questions || (viewingResult.questions?.length || 0);

                                    // Robust count
                                    const answeredCountFromData = Object.keys(rawAns).length;
                                    const answered = Math.max(answeredCountFromData, viewingResult.score);

                                    const wrong = Math.max(0, answered - viewingResult.score);
                                    const skipped = Math.max(0, totalQ - answered);

                                    return (
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end', fontSize: '0.75rem' }}>
                                            {wrong > 0 && <span style={{ color: '#E02424', fontWeight: 'bold' }}>✖ {wrong} Wrong</span>}
                                            {skipped > 0 && <span style={{ color: '#6B7280', fontWeight: 'bold' }}>⚪ {skipped} Skipped</span>}
                                            {wrong === 0 && skipped === 0 && <span style={{ color: '#10B981', fontWeight: 'bold' }}>Perfect Score!</span>}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {(() => {
                                const rawQuestions = typeof viewingResult.questions === 'string' ? JSON.parse(viewingResult.questions) : viewingResult.questions;
                                const studentAnswers = typeof viewingResult.answers === 'string' ? JSON.parse(viewingResult.answers) : (viewingResult.answers || {});

                                // Normalize questions same way as TestRunner
                                const normalizedQuestions = (rawQuestions || []).map(q => {
                                    const normalized = { ...q };
                                    normalized.text = q.text || q.question || "No question text";

                                    if (q.options && !Array.isArray(q.options) && typeof q.options === 'object') {
                                        const keys = Object.keys(q.options).sort();
                                        normalized.options = keys.map(key => q.options[key]);
                                        if (q.correctIndex === undefined && q.answer) {
                                            normalized.correctIndex = keys.indexOf(q.answer);
                                        }
                                    } else {
                                        normalized.options = Array.isArray(q.options) ? q.options : [];
                                    }
                                    return normalized;
                                });

                                return normalizedQuestions.map((q, qIdx) => {
                                    const studentChoice = studentAnswers[qIdx];
                                    const correctChoice = q.correctIndex;
                                    const isCorrect = studentChoice === correctChoice;
                                    const isAnswered = studentChoice !== undefined;

                                    // Dynamic styling for the question card based on status
                                    let cardBg = '#F0FDF4'; // Success Green
                                    let cardBorder = '#BBF7D0';
                                    let statusText = 'Correct';
                                    let statusBg = '#DEF7EC';
                                    let statusColor = '#03543F';

                                    if (!isAnswered) {
                                        cardBg = '#F9FAFB'; // Neutral Grey for Not Answered
                                        cardBorder = '#E5E7EB';
                                        statusText = 'Not Answered';
                                        statusBg = '#F3F4F6';
                                        statusColor = '#6B7280';
                                    } else if (!isCorrect) {
                                        cardBg = '#FEF2F2'; // Subtle Red for Wrong Answer
                                        cardBorder = '#FCA5A5';
                                        statusText = 'Wrong';
                                        statusBg = '#FDE8E8';
                                        statusColor = '#9B1C1C';
                                    }

                                    return (
                                        <div key={qIdx} style={{
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: `2px solid ${cardBorder}`,
                                            backgroundColor: cardBg,
                                            position: 'relative',
                                            marginBottom: '1rem',
                                            transition: 'all 0.2s ease-in-out'
                                        }}>
                                            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                                                <span style={{
                                                    color: statusColor,
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800',
                                                    backgroundColor: statusBg,
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '1rem',
                                                    textTransform: 'uppercase',
                                                    border: `1px solid ${cardBorder}`,
                                                    letterSpacing: '0.025em'
                                                }}>
                                                    {statusText}
                                                </span>
                                            </div>

                                            <h4 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '1.5rem', paddingRight: '7rem', display: 'flex', gap: '0.5rem', color: 'var(--text)', lineHeight: '1.4' }}>
                                                <span style={{ color: 'var(--text-light)', opacity: 0.6 }}>{qIdx + 1}.</span>
                                                {q.text}
                                            </h4>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {(q.options || []).map((opt, oIdx) => {
                                                    let bgColor = 'white';
                                                    let borderColor = 'var(--border-color)';
                                                    let label = null;
                                                    let labelColor = 'var(--text-light)';

                                                    const isSelected = oIdx === studentChoice;
                                                    const isCorrectAns = oIdx === correctChoice;

                                                    if (isCorrectAns) {
                                                        bgColor = '#DEF7EC';
                                                        borderColor = '#10B981';
                                                        label = 'Correct Answer';
                                                        labelColor = '#03543F';
                                                    } else if (isSelected && !isCorrect) {
                                                        bgColor = '#FDE8E8';
                                                        borderColor = '#EF4444';
                                                        label = 'Your Incorrect Answer';
                                                        labelColor = '#9B1C1C';
                                                    }

                                                    if (isSelected && isCorrectAns) {
                                                        label = 'Correct / Your Answer';
                                                    }

                                                    return (
                                                        <div key={oIdx} style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '0.5rem',
                                                            border: `1px solid ${borderColor}`,
                                                            backgroundColor: bgColor,
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <span style={{ fontWeight: isSelected || isCorrectAns ? '600' : '400' }}>{opt}</span>
                                                            {label && <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: labelColor }}>{label}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <Button onClick={() => setIsAnswersModalOpen(false)} style={{ width: '100%' }}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '95%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
};

export default MockTests;
