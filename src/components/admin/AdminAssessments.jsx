import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { FileText, Award, Plus, Trash2, X, ChevronDown, ChevronUp, Calendar, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAssessments = () => {
    const { data } = useData();
    // We fetch modules directly now, assuming useData or a direct call might be better if not in context
    // Actually, let's fetch modules locally since we need filtering
    const [modules, setModules] = useState([]);
    const [activeTab, setActiveTab] = useState('assignments');
    const [selectedModuleId, setSelectedModuleId] = useState('');

    // Data State
    const [assignments, setAssignments] = useState([]);
    const [tests, setTests] = useState([]);
    const [courses, setCourses] = useState([]); // Add courses state
    const [testResults, setTestResults] = useState([]);
    const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [resultsSubTab, setResultsSubTab] = useState('tests'); // 'tests' or 'assignments'

    // Modal State
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [viewingResult, setViewingResult] = useState(null);
    const [isAnswersModalOpen, setIsAnswersModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // View Modal State
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [isViewAssignmentModalOpen, setIsViewAssignmentModalOpen] = useState(false);
    const [viewingTest, setViewingTest] = useState(null);
    const [isViewTestModalOpen, setIsViewTestModalOpen] = useState(false);

    // Forms
    const [assignmentForm, setAssignmentForm] = useState({
        title: '', description: '', due_date: '',
        type: 'standard', problem_statement: '', starter_code: '', expected_output: '',
        difficulty: 'Easy', test_cases: '[]',
        course_id: '', module_id: ''
    });
    const [testForm, setTestForm] = useState({ title: '', duration: '', total_marks: '', type: 'MCQ', questions: [], course_id: '', module_id: '' });

    // For Mock Test Questions
    const [questionsJson, setQuestionsJson] = useState('[]');

    useEffect(() => {
        // Fetch Modules
        const fetchInitialData = async () => {
            try {
                const [modRes, courseRes] = await Promise.all([
                    api.get('modules'),
                    api.get('courses')
                ]);
                setModules(modRes.data);
                setCourses(courseRes.data);
                if (modRes.data.length > 0) {
                    setSelectedModuleId(modRes.data[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedModuleId) {
            fetchModuleContent(selectedModuleId);
        }
    }, [selectedModuleId]);

    const fetchModuleContent = async (moduleId) => {
        setLoadingData(true);
        try {
            const [assRes, testRes, resultsRes, subRes] = await Promise.all([
                api.get(`modules/${moduleId}/assignments`),
                api.get(`modules/${moduleId}/tests`),
                api.get('admin/test-results'),
                api.get('admin/submissions')
            ]);
            setAssignments(assRes.data);
            setTests(testRes.data);
            setTestResults(resultsRes.data);
            setAssignmentSubmissions(subRes.data);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const targetModule = assignmentForm.module_id || selectedModuleId;
            if (!targetModule) {
                alert("Please select a target module.");
                setSubmitting(false);
                return;
            }
            await api.post(`modules/${targetModule}/assignments`, assignmentForm);
            if (targetModule === selectedModuleId) {
                await fetchModuleContent(selectedModuleId);
            }
            setIsAssignmentModalOpen(false);
            setAssignmentForm({
                title: '', description: '', due_date: '',
                type: 'standard', problem_statement: '', starter_code: '', expected_output: '',
                difficulty: 'Easy', test_cases: '[]',
                course_id: '', module_id: ''
            });
            alert("Assignment initialized successfully!");
        } catch (error) {
            alert("Error initializing assignment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assignment?")) return;
        try {
            await api.delete(`admin/delete-assignment/${id}`);
            await fetchModuleContent(selectedModuleId);
            alert("Assignment deleted!");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            alert("Failed to delete assignment: " + errorMsg);
        }
    };

    const handleDeleteTest = async (id) => {
        if (!window.confirm("Are you sure you want to delete this mock test?")) return;
        try {
            await api.delete(`admin/delete-test/${id}`);
            await fetchModuleContent(selectedModuleId);
            alert("Mock test deleted!");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            alert("Failed to delete test: " + errorMsg);
        }
    };

    const handleCreateTest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const targetModule = testForm.module_id || selectedModuleId;
            if (!targetModule) {
                alert("Please select a target module.");
                setSubmitting(false);
                return;
            }

            let parsedQuestions = [];
            try {
                parsedQuestions = JSON.parse(questionsJson);
            } catch (err) {
                alert("Invalid JSON for questions");
                setSubmitting(false);
                return;
            }

            await api.post(`modules/${targetModule}/tests`, {
                ...testForm,
                questions: parsedQuestions
            });
            if (targetModule === selectedModuleId) {
                await fetchModuleContent(selectedModuleId);
            }
            setIsTestModalOpen(false);
            setTestForm({ title: '', duration: '', total_marks: '', type: 'MCQ', questions: [], course_id: '', module_id: '' });
            setQuestionsJson('[]');
            alert("Mock assessment initialized successfully!");
        } catch (error) {
            console.error("Initialize assessment error:", error);
            const msg = error.response?.data?.message || error.message;
            alert(`Failed: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2rem', borderRadius: '1rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#e0f2fe',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.025em',
                    WebkitTextStroke: '1px #bae6fd', // to simulate the glowing light text on white bg from the mockup
                    textShadow: '0px 4px 20px rgba(56, 189, 248, 0.4)'
                }}>
                    Assessments Control
                </h1>
                <p style={{ color: '#64748b', fontWeight: '600', fontSize: '1rem' }}>
                    Deploy and monitor assignments and simulation tests across modules.
                </p>
            </div>

            {/* Module Selector */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#334155', padding: '1.25rem 2rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <label style={{ fontWeight: '800', color: '#bae6fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>ACTIVE MODULE:</label>
                <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #1e293b', minWidth: '300px', background: '#0f172a', color: '#f8fafc', fontWeight: '700', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                >
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {['assignments', 'tests', 'results'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === tab ? '#e0f2fe' : 'transparent',
                            border: 'none',
                            borderRadius: '0.5rem 0.5rem 0 0',
                            borderBottom: activeTab === tab ? '2px solid #38bdf8' : '2px solid transparent',
                            color: activeTab === tab ? '#38bdf8' : '#94a3b8',
                            fontWeight: activeTab === tab ? '900' : '700',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab === 'results' ? 'Scores / Results' : (tab === 'assignments' ? 'Assignments' : 'Mock Tests')}
                    </button>
                ))}
            </div>

            {loadingData ? <p>Loading...</p> : (
                <div style={{ minHeight: '300px' }}>
                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <Button
                                    onClick={() => {
                                        setAssignmentForm({...assignmentForm, module_id: selectedModuleId});
                                        setIsAssignmentModalOpen(true);
                                    }}
                                    style={{ borderRadius: '12px', fontWeight: '900', background: 'linear-gradient(135deg, #4F46E5, #9333EA)', border: 'none', color: '#ffffff', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}
                                >
                                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> INITIALIZE ASSIGNMENT
                                </Button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <AnimatePresence>
                                    {assignments.map(a => (
                                        <motion.div
                                            key={a.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{ scale: 1.01, x: 8 }}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1.5rem',
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '1rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, #38bdf8, #818cf8)' }} />

                                            <div style={{ marginLeft: '1rem' }}>
                                                <h3 style={{ fontWeight: '900', color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.5rem', textShadow: '0 0 15px rgba(56,189,248,0.3)', letterSpacing: '-0.02em' }}>
                                                    {a.title}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <Calendar size={14} color="#38bdf8" />
                                                        TERMINATION: <span style={{ color: '#f8fafc' }}>{new Date(a.due_date).toLocaleDateString()}</span>
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                                        {a.type || 'standard'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(a.id); }}
                                                    style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', color: '#ef4444', height: '40px', width: '40px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewingAssignment(a); setIsViewAssignmentModalOpen(true); }}
                                                    style={{ cursor: 'pointer', height: '40px', width: '40px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '0.5rem', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {assignments.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', border: '1px dashed #1e293b', borderRadius: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                                        <FileText size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p style={{ fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>No active assignments initialized.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                            {activeTab === 'tests' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                        <Button 
                                            onClick={() => {
                                                setTestForm({...testForm, module_id: selectedModuleId});
                                                setIsTestModalOpen(true);
                                            }} 
                                            style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)', color: 'white', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: '900', border: 'none', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}
                                        >
                                            <Plus size={16} style={{ marginRight: '0.5rem' }} /> INITIALIZE MOCK TEST
                                        </Button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                        {tests.map(test => (
                                            <div key={test.id} style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>{test.title}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                                                    <Clock size={14} /> DURATION: {test.duration} MINS
                                                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid rgba(56, 189, 248, 0.2)', textTransform: 'uppercase' }}>{test.type}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleDeleteTest(test.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button onClick={() => { setViewingTest(test); setIsViewTestModalOpen(true); }} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                                        <FileText size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {tests.length === 0 && <p style={{ color: '#64748b' }}>No mock tests found.</p>}
                                    </div>
                                </div>
                            )}
                    {/* Test Results Tab */}
                    {activeTab === 'results' && (
                        <div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <Button 
                                    variant={resultsSubTab === 'tests' ? 'primary' : 'outline'} 
                                    onClick={() => setResultsSubTab('tests')}
                                    style={{ borderRadius: '12px' }}
                                >
                                    Mock Test Results
                                </Button>
                                <Button 
                                    variant={resultsSubTab === 'assignments' ? 'primary' : 'outline'} 
                                    onClick={() => setResultsSubTab('assignments')}
                                    style={{ borderRadius: '12px' }}
                                >
                                    Assignment Submissions
                                </Button>
                            </div>

                            {resultsSubTab === 'tests' && (
                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--light)', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Student</th>
                                                <th style={{ padding: '1rem' }}>Batch</th>
                                                <th style={{ padding: '1rem' }}>Course</th>
                                                <th style={{ padding: '1rem' }}>Module</th>
                                                <th style={{ padding: '1rem' }}>Test</th>
                                                <th style={{ padding: '1rem' }}>Score</th>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                                <th style={{ padding: '1rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {testResults.map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.student_name}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {r.batch_name || 'No Batch'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{r.course_title}</td>
                                                <td style={{ padding: '1rem' }}>{r.module_title || 'Direct'}</td>
                                                <td style={{ padding: '1rem' }}>{r.test_title}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '1rem',
                                                        backgroundColor: (r.score / r.total_questions) >= 0.5 ? '#DEF7EC' : '#FDE8E8',
                                                        color: (r.score / r.total_questions) >= 0.5 ? '#03543F' : '#9B1C1C',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {r.score} / {r.total_questions}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                                    {new Date(r.completed_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setViewingResult(r);
                                                            setIsAnswersModalOpen(true);
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {testResults.length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                                    No test results available yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            )}

                            {resultsSubTab === 'assignments' && (
                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--light)', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Student</th>
                                                <th style={{ padding: '1rem' }}>Batch</th>
                                                <th style={{ padding: '1rem' }}>Course</th>
                                                <th style={{ padding: '1rem' }}>Module</th>
                                                <th style={{ padding: '1rem' }}>Assignment</th>
                                                <th style={{ padding: '1rem' }}>Score/Grade</th>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignmentSubmissions.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.student_name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {s.batch_name || 'No Batch'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{s.course_title}</td>
                                                    <td style={{ padding: '1rem' }}>{s.module_title || 'Direct'}</td>
                                                    <td style={{ padding: '1rem' }}>{s.assignment_title}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: s.grade ? '#16A34A' : (s.score ? '#2563EB' : '#F59E0B') }}>
                                                        {s.grade || (s.score ? `${s.score}/100` : 'Pending')}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                                        {new Date(s.submitted_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {assignmentSubmissions.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                                        No assignment submissions available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Assignment Modal */}
            {isAssignmentModalOpen && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>New Assignment</h3>
                            <button onClick={() => setIsAssignmentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateAssignment}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#475569' }}>Target Module *</label>
                                    <select
                                        value={assignmentForm.module_id}
                                        onChange={e => setAssignmentForm({ ...assignmentForm, module_id: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '600' }}
                                    >
                                        <option value="">-- Select Module --</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#475569' }}>Target Course *</label>
                                    <select
                                        value={assignmentForm.course_id}
                                        onChange={e => setAssignmentForm({ ...assignmentForm, course_id: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '600' }}
                                    >
                                        <option value="">-- Select Course --</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <Input label="Title" value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required />
                            <Input label="Description (Instructions)" value={assignmentForm.description} onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })} textarea required />

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assignment Type</label>
                                <select
                                    value={assignmentForm.type}
                                    onChange={e => setAssignmentForm({ ...assignmentForm, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                                >
                                    <option value="standard">Standard (External Link/Repo)</option>
                                    <option value="interactive">Interactive (Coding Session)</option>
                                </select>
                            </div>

                            {assignmentForm.type === 'interactive' && (
                                <div style={{ border: '1px solid #E0E7FF', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#F8FAFC', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>Coding Configuration</h4>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Difficulty</label>
                                        <select
                                            value={assignmentForm.difficulty}
                                            onChange={e => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>

                                    <Input label="Problem Statement" value={assignmentForm.problem_statement} onChange={e => setAssignmentForm({ ...assignmentForm, problem_statement: e.target.value })} textarea required />
                                    <Input label="Starter Code (Optional)" value={assignmentForm.starter_code} onChange={e => setAssignmentForm({ ...assignmentForm, starter_code: e.target.value })} textarea placeholder="function solution() {\n  // Code here\n}" />
                                    <Input label="Test Cases (JSON List)" value={assignmentForm.test_cases} onChange={e => setAssignmentForm({ ...assignmentForm, test_cases: e.target.value })} textarea placeholder='[{"input": "5, 10", "output": "15"}]' />
                                </div>
                            )}

                            <Input label="Due Date" type="date" value={assignmentForm.due_date} onChange={e => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })} required />
                            <Button type="submit" isLoading={submitting} style={{ width: '100%' }}>Create Assignment</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Modal */}
            {isTestModalOpen && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>New Mock Test</h3>
                            <button onClick={() => setIsTestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTest}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#475569' }}>Target Module *</label>
                                    <select
                                        value={testForm.module_id}
                                        onChange={e => setTestForm({ ...testForm, module_id: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '600' }}
                                    >
                                        <option value="">-- Select Module --</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#475569' }}>Target Course *</label>
                                    <select
                                        value={testForm.course_id}
                                        onChange={e => setTestForm({ ...testForm, course_id: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '600' }}
                                    >
                                        <option value="">-- Select Course --</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <Input label="Title" value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} required />
                            <Input label="Duration (mins)" type="number" value={testForm.duration} onChange={e => setTestForm({ ...testForm, duration: e.target.value })} required />
                            <Input label="Total Marks" type="number" value={testForm.total_marks} onChange={e => setTestForm({ ...testForm, total_marks: e.target.value })} required />
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type</label>
                                <select
                                    value={testForm.type}
                                    onChange={e => setTestForm({ ...testForm, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="Coding">Coding</option>
                                </select>
                            </div>
                            <Input label="Questions (JSON Format)" textarea value={questionsJson} onChange={e => setQuestionsJson(e.target.value)} placeholder='[{"question": "...", "options": [...], "correctIndex": 0}]' />
                            <Button type="submit" isLoading={submitting} style={{ width: '100%' }}>Create Test</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Answers Modal */}
            {isAnswersModalOpen && viewingResult && (
                <div style={modalStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Review: {viewingResult.test_title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                    Student: <strong>{viewingResult.student_name}</strong> | Score: {viewingResult.score} / {viewingResult.total_questions}
                                </p>
                            </div>
                            <button onClick={() => setIsAnswersModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {(() => {
                                // Fetch questions from actual mock_test or result if stored
                                // Based on MockTests logic, we need to handle both course/module tests
                                // But since results are returned via api.get('/admin/test-results'), let's check what's in 'r'
                                // In the students.js, we join test results with mock_tests, so questions should be there if we updated it
                                // Wait, I need to check if /admin/test-results returns questions too.

                                let questions = [];
                                try {
                                    questions = typeof viewingResult.questions === 'string' ? JSON.parse(viewingResult.questions) : (viewingResult.questions || []);
                                } catch (e) { console.error(e); }

                                const studentAnswers = typeof viewingResult.answers === 'string' ? JSON.parse(viewingResult.answers) : (viewingResult.answers || {});

                                if (questions.length === 0) return <p>No questions found for this test result.</p>;

                                return questions.map((q, qIdx) => {
                                    const studentChoice = studentAnswers[qIdx];
                                    const correctChoice = q.correctIndex;
                                    const isCorrect = studentChoice === correctChoice;

                                    return (
                                        <div key={qIdx} style={{ padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: '#F9FAFB' }}>
                                            <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-light)' }}>{qIdx + 1}.</span>
                                                {q.text || q.question}
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {(q.options || []).map((opt, oIdx) => {
                                                    let bgColor = 'white';
                                                    let borderColor = 'var(--border-color)';
                                                    let label = null;

                                                    if (oIdx === correctChoice) {
                                                        bgColor = '#DEF7EC';
                                                        borderColor = '#03543F';
                                                        label = 'Correct Answer';
                                                    }
                                                    if (oIdx === studentChoice && !isCorrect) {
                                                        bgColor = '#FDE8E8';
                                                        borderColor = '#9B1C1C';
                                                        label = "Student's Answer";
                                                    }
                                                    if (oIdx === studentChoice && isCorrect) {
                                                        label = "Student's Answer (Correct)";
                                                    }

                                                    return (
                                                        <div key={oIdx} style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '0.375rem',
                                                            border: `1px solid ${borderColor}`,
                                                            backgroundColor: bgColor,
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span>{opt}</span>
                                                            {label && <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</span>}
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

            {/* View Assignment Modal */}
            {isViewAssignmentModalOpen && viewingAssignment && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Assignment Details</h3>
                            <button onClick={() => setIsViewAssignmentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p><strong>Title:</strong> {viewingAssignment.title}</p>
                            <p><strong>Type:</strong> {viewingAssignment.type || 'Standard'}</p>
                            <p><strong>Description:</strong> {viewingAssignment.description}</p>
                            <p><strong>Due Date:</strong> {new Date(viewingAssignment.due_date).toLocaleDateString()}</p>
                            {viewingAssignment.type === 'interactive' && (
                                <>
                                    <p><strong>Difficulty:</strong> {viewingAssignment.difficulty}</p>
                                    <p><strong>Problem Statement:</strong> {viewingAssignment.problem_statement}</p>
                                    <p><strong>Expected Output:</strong> {viewingAssignment.expected_output}</p>
                                </>
                            )}
                            <Button onClick={() => setIsViewAssignmentModalOpen(false)} style={{ marginTop: '1rem', width: '100%' }}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Test Modal */}
            {isViewTestModalOpen && viewingTest && (
                <div style={modalStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Mock Test Details</h3>
                            <button onClick={() => setIsViewTestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p><strong>Title:</strong> {viewingTest.title}</p>
                            <p><strong>Type:</strong> {viewingTest.type}</p>
                            <p><strong>Duration:</strong> {viewingTest.duration} mins</p>
                            <p><strong>Total Marks:</strong> {viewingTest.total_marks}</p>
                            <div>
                                <strong>Questions:</strong>
                                <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.875rem', maxHeight: '300px' }}>
                                    {typeof viewingTest.questions === 'string' ? viewingTest.questions : JSON.stringify(viewingTest.questions, null, 2)}
                                </pre>
                            </div>
                            <Button onClick={() => setIsViewTestModalOpen(false)} style={{ marginTop: '1rem', width: '100%' }}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
};

export default AdminAssessments;
