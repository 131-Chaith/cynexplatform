import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import Button from '../Button';
import { Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const TestRunner = ({ test, onComplete, onCancel }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(test.duration * 60); // Convert mins to seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use real questions from DB (test.questions is already parsed JSON array)
    // Normalize structure to handle variations (text/question, options as object/array)
    const questions = useMemo(() => {
        if (!test.questions || !Array.isArray(test.questions)) return [];
        return test.questions.map(q => {
            const normalized = { ...q };

            // 1. Normalize Question Text
            normalized.text = q.text || q.question || "No question text";

            // 2. Normalize Options (can be array or object like {A: '...', B: '...'})
            if (q.options && !Array.isArray(q.options) && typeof q.options === 'object') {
                const keys = Object.keys(q.options).sort(); // Sort to ensure A, B, C, D order
                normalized.options = keys.map(key => q.options[key]);

                // 3. Normalize Correct Answer Index if it's a string key like 'A'
                if (q.correctIndex === undefined && q.answer) {
                    normalized.correctIndex = keys.indexOf(q.answer);
                }
            } else {
                normalized.options = Array.isArray(q.options) ? q.options : [];
            }

            return normalized;
        });
    }, [test.questions]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionSelect = (optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Calculate Score
        let score = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correctIndex) {
                score++;
            }
        });

        // Simulate delay
        setTimeout(() => {
            onComplete(score, questions.length, answers);
        }, 1000);
    };

    if (questions.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                <h3>No questions found for this test.</h3>
                <Button onClick={onCancel} style={{ marginTop: '1rem' }}>Go Back</Button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <Card style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>{test.title}</h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: timeLeft < 60 ? 'var(--danger)' : 'var(--text)',
                    fontWeight: 'bold', fontSize: '1.25rem'
                }}>
                    <Clock size={24} /> {formatTime(timeLeft)}
                </div>
            </Card>

            {/* Question Card */}
            <Card style={{ marginBottom: '1.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--gray-light)', marginBottom: '1.5rem', borderRadius: '2px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '1.5rem' }}>
                    {currentQuestion.text}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            style={{
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: answers[currentQuestionIndex] === idx ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                backgroundColor: answers[currentQuestionIndex] === idx ? 'var(--primary-light)' : 'var(--white)',
                                color: answers[currentQuestionIndex] === idx ? 'var(--primary)' : 'var(--text)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                fontWeight: answers[currentQuestionIndex] === idx ? '600' : '400',
                                display: 'flex', alignItems: 'center', gap: '0.75rem'
                            }}
                        >
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                border: answers[currentQuestionIndex] === idx ? '5px solid var(--primary)' : '2px solid var(--gray)',
                                flexShrink: 0
                            }} />
                            {option}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        <ChevronLeft size={18} style={{ marginRight: '0.25rem' }} /> Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Test'}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next <ChevronRight size={18} style={{ marginLeft: '0.25rem' }} />
                        </Button>
                    )}
                </div>
            </Card>

            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Cancel Test
                </button>
            </div>
        </div>
    );
};

export default TestRunner;
