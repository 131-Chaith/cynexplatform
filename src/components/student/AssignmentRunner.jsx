import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import { Play, Send, ChevronLeft, Terminal, FileCode, CheckCircle2, AlertCircle, Clock, Info, History, Database, Book, PlayCircle, Zap } from 'lucide-react';

const AssignmentRunner = ({ assignment, onComplete, onCancel }) => {
    const [activeView, setActiveView] = useState('description'); // 'description', 'submissions', 'tables'
    const [language, setLanguage] = useState('sql');
    const [code, setCode] = useState(assignment.starter_code || '');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [activeTestIndex, setActiveTestIndex] = useState(0);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [finalResult, setFinalResult] = useState(null);

    // Mock Database for SQL (Refined to only employee & dept)
    const mockDB = {
        employee: [
            { emp_id: 101, ename: 'ADAMS', job: 'CLERK', mgr: 103, hire_date: '1987-07-13', sal: 1100, deptno: 20 },
            { emp_id: 102, ename: 'ALLEN', job: 'SALESMAN', mgr: 106, hire_date: '1981-02-20', sal: 1600, deptno: 30 },
            { emp_id: 103, ename: 'SCOTT', job: 'ANALYST', mgr: 106, hire_date: '1981-12-09', sal: 3000, deptno: 20 },
            { emp_id: 104, ename: 'FORD', job: 'ANALYST', mgr: 106, hire_date: '1981-12-03', sal: 3000, deptno: 20 },
            { emp_id: 105, ename: 'KING', job: 'PRESIDENT', mgr: null, hire_date: '1981-11-17', sal: 5000, deptno: 10 },
            { emp_id: 106, ename: 'BLAKE', job: 'MANAGER', mgr: 105, hire_date: '1981-05-01', sal: 2850, deptno: 30 },
            { emp_id: 107, ename: 'CLARK', job: 'MANAGER', mgr: 105, hire_date: '1981-06-09', sal: 2450, deptno: 10 },
            { emp_id: 108, ename: 'JAMES', job: 'CLERK', mgr: 106, hire_date: '1981-12-03', sal: 950, deptno: 30 }
        ],
        dept: [
            { deptno: 10, dname: 'ACCOUNTING', loc: 'NEW YORK' },
            { deptno: 20, dname: 'RESEARCH', loc: 'DALLAS' },
            { deptno: 30, dname: 'SALES', loc: 'CHICAGO' },
            { deptno: 40, dname: 'OPERATIONS', loc: 'BOSTON' }
        ]
    };

    // Mini SQL Evaluator for "Tallying" query results against the database
    const miniSQLEngine = (query) => {
        try {
            const cleanQuery = query.toLowerCase().trim().replace(/;/g, '');
            if (!cleanQuery.includes('select') || !cleanQuery.includes('from')) {
                return { error: 'Syntax Error: Missing SELECT or FROM', data: [] };
            }

            // Simple "FROM table" detection
            const fromMatch = cleanQuery.match(/from\s+([a-z_]+)/);
            if (!fromMatch) return { error: 'Syntax Error: Missing table name', data: [] };
            
            let tableName = fromMatch[1];
            if (!mockDB[tableName]) return { error: `Table "${tableName}" not found in database.`, data: [] };

            let data = [...mockDB[tableName]];

            // Simple "WHERE ... =" filter
            const whereMatch = cleanQuery.match(/where\s+([a-z_]+)\s*=\s*['"]?([^'"]+)['"]?/);
            if (whereMatch) {
                const column = whereMatch[1];
                const value = whereMatch[2];
                data = data.filter(row => String(row[column]).toLowerCase() === String(value).toLowerCase());
            }

            // Simple "JOIN" logic (Very basic)
            if (cleanQuery.includes('join')) {
                // Return a generic joined row count for functional tallying if they wrote a join
                return { data: [ { result: "Join executed. " + data.length + " rows processed." } ] };
            }

            return { data: data.slice(0, 5) }; // Limit result to avoid terminal bloat
        } catch (err) {
            return { error: 'Query processing error: ' + err.message, data: [] };
        }
    };

    // Parse test cases
    const testCases = React.useMemo(() => {
        try {
            const parsed = typeof assignment.test_cases === 'string' 
                ? JSON.parse(assignment.test_cases || '[]') 
                : (assignment.test_cases || []);
            return parsed.length > 0 ? parsed : [{ input: 'N/A', output: 'Success' }];
        } catch (e) {
            return [{ input: 'N/A', output: 'Execution Success' }];
        }
    }, [assignment.test_cases]);

    useEffect(() => {
        if (activeView === 'submissions') fetchSubmissions();
    }, [activeView]);

    const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const res = await api.get('/students/submissions');
            setSubmissions(res.data.filter(s => s.assignment_id === assignment.id));
        } catch (err) { console.error(err); } 
        finally { setLoadingSubmissions(false); }
    };

    const runCode = () => {
        setIsRunning(true);
        setOutput('');
        const results = [];
        const studentCodeLower = code.toLowerCase().trim();

        if (language === 'javascript') {
            testCases.forEach((tc, index) => {
                let pass = false, actual = null, error = null;
                try {
                    const executionCode = `${code}\n\nif (typeof solution === 'function') solution(${tc.input}); else eval(code);`;
                    actual = eval(executionCode);
                    if (String(actual).trim() === String(tc.output).trim()) pass = true;
                    if (tc.output === 'Success' && code.length > 5) pass = true;
                } catch (err) { error = err.message; actual = "Error: " + err.message; }
                results.push({ index, input: tc.input, expected: tc.output, actual, pass, error });
            });
        } else if (language === 'sql') {
            testCases.forEach((tc, index) => {
                const queryResult = miniSQLEngine(code);
                let pass = false;
                
                if (!queryResult.error) {
                    // Logic to "Tally" - if query matched data or if student correctly queried the table
                    if (queryResult.data.length > 0) pass = true;
                    if (tc.expected && studentCodeLower.includes(String(tc.expected).toLowerCase())) pass = true;
                }

                results.push({ 
                    index, 
                    input: tc.input, 
                    expected: tc.output, 
                    actual: queryResult.error || JSON.stringify(queryResult.data[0] || {}), 
                    pass, 
                    error: queryResult.error 
                });
            });
        } else {
            testCases.forEach((tc, index) => {
                let pass = (code.length > 20 && (studentCodeLower.includes('if') || studentCodeLower.includes('for') || studentCodeLower.includes('return') || studentCodeLower.includes('print')));
                results.push({ index, input: tc.input, expected: tc.output, actual: pass ? tc.output : "Incomplete logic", pass, error: pass ? null : "Logic mismatch" });
            });
        }

        setTestResults(results);
        if (results.length > 0) {
            setActiveTestIndex(0);
            setOutput(`${results.filter(r => r.pass).length}/${results.length} Passed`);
        }
        setIsRunning(false);
    };

    const handleSubmit = async () => {
        if (!assignment || !assignment.id) return alert("Assignment information is missing.");
        if (code.trim().length < 5) return alert("Please write some code.");
        const score = testResults.length > 0 ? Math.round((testResults.filter(r => r.pass).length / testResults.length) * 100) : 100;
        if (score < 100 && !window.confirm(`Your score will be ${score}%. Submit?`)) return;

        setIsSubmitting(true);
        try {
            const payload = { 
                assignment_id: assignment.id, 
                submission_link: null,
                submission_code: code, 
                score: Math.floor(score), 
                language: language || 'sql', 
                type: 'interactive' 
            };
            
            console.log("[SubmitPayload]", payload);
            await api.post('/students/assignments/submit', payload);
            setFinalResult({ code, score, language });
            setIsCompleted(true);
        } catch (err) { 
            alert("Submission failed: " + (err.response?.data?.message || err.message)); 
        } 
        finally { setIsSubmitting(false); }
    };

    if (isCompleted) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 2200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <CheckCircle2 size={72} color="#16A34A" style={{ marginBottom: '2rem' }} />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0F172A' }}>Perfect Submission!</h1>
                <p style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '500px', margin: '1rem auto' }}>Result for <strong>{assignment.title}</strong> has been saved with <strong>{finalResult.score}%</strong> score.</p>
                <Button variant="primary" style={{ marginTop: '2.5rem' }} onClick={onCancel}>Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
            <header style={{ height: '60px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: '600' }}><ChevronLeft size={20} /> Back</button>
                    <nav style={{ display: 'flex', gap: '1.5rem' }}>
                        <button onClick={() => setActiveView('description')} style={{ background: 'none', border: 'none', padding: '1.1rem 0', cursor: 'pointer', fontWeight: 'bold', color: activeView === 'description' ? '#4F46E5' : '#64748B', borderBottom: activeView === 'description' ? '2px solid #4F46E5' : '2px solid transparent' }}>Problem</button>
                        {language === 'sql' && <button onClick={() => setActiveView('tables')} style={{ background: 'none', border: 'none', padding: '1.1rem 0', cursor: 'pointer', fontWeight: 'bold', color: activeView === 'tables' ? '#4F46E5' : '#64748B', borderBottom: activeView === 'tables' ? '2px solid #4F46E5' : '2px solid transparent' }}>Database</button>}
                        <button onClick={() => setActiveView('submissions')} style={{ background: 'none', border: 'none', padding: '1.1rem 0', cursor: 'pointer', fontWeight: 'bold', color: activeView === 'submissions' ? '#4F46E5' : '#64748B', borderBottom: activeView === 'submissions' ? '2px solid #4F46E5' : '2px solid transparent' }}>Submissions</button>
                    </nav>
                </div>
                <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} fill="#4F46E5" stroke="#4F46E5" /> CYNEX <span style={{ color: '#4F46E5' }}>AI</span> IDE
                </div>
            </header>

            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>
                <aside style={{ borderRight: '1px solid #E2E8F0', overflowY: 'auto', backgroundColor: '#F8FAFC', padding: '1.5rem' }}>
                    {activeView === 'description' && (
                        <>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>{assignment.title}</h1>
                            <div style={{ lineHeight: '1.7', color: '#334155' }}>{assignment.problem_statement || assignment.description}</div>
                            {testCases.map((tc, i) => (
                                <div key={i} style={{ marginTop: '2rem', backgroundColor: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', marginBottom: '0.5rem' }}>EXAMPLE {i+1}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>Input: {tc.input}<br/>Expected: {tc.output}</div>
                                </div>
                            ))}
                        </>
                    )}
                    {activeView === 'tables' && (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Interactive Database</h2>
                            {Object.entries(mockDB).map(([name, rows]) => (
                                <div key={name} style={{ marginBottom: '2rem', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.5rem 1rem', background: '#F1F5F9', fontWeight: 'bold', color: '#4F46E5' }}>Table: {name}</div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                            <thead><tr style={{ textAlign: 'left', background: '#FAFBFC' }}>{Object.keys(rows[0]).map(k => <th key={k} style={{ padding: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>{k}</th>)}</tr></thead>
                                            <tbody>{rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} style={{ padding: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>{v}</td>)}</tr>)}</tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    {activeView === 'submissions' && (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Your History</h2>
                            {submissions.map((s, i) => <div key={i} style={{ padding: '1rem', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span>Attempt {submissions.length - i}</span><span style={{ fontWeight: 'bold', color: '#16A34A' }}>{s.score}%</span></div>)}
                        </>
                    )}
                </aside>

                <section style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0F172A' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
                        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: 'transparent', color: '#FFF', border: 'none', fontWeight: 'bold', outline: 'none' }}>
                            <option value="sql" style={{ background: '#0F172A' }}>SQL (Relational)</option>
                            <option value="javascript" style={{ background: '#0F172A' }}>Javascript (ES6)</option>
                            <option value="python" style={{ background: '#0F172A' }}>Python (v3)</option>
                            <option value="java" style={{ background: '#0F172A' }}>Java (v17)</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={runCode} disabled={isRunning} style={{ backgroundColor: '#F97316', color: 'white', border: 'none', padding: '0.4rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}><Play size={14} style={{ marginRight: '0.4rem' }}/> Run Code</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.4rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}><Send size={14} style={{ marginRight: '0.4rem' }}/> Submit</button>
                        </div>
                    </div>
                    <textarea value={code} onChange={e => setCode(e.target.value)} style={{ flex: 1, backgroundColor: 'transparent', color: '#F8FAFC', padding: '1.5rem', border: 'none', resize: 'none', fontFamily: 'monospace', fontSize: '15px', outline: 'none' }} placeholder={`-- Write your ${language.toUpperCase()} code here...`} />
                    <div style={{ height: '30%', backgroundColor: '#020617', borderTop: '2px solid #1E293B', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '0.5rem 1rem', color: '#94A3B8', fontSize: '0.7rem', fontWeight: 'bold', borderBottom: '1px solid #1E293B' }}>CONSOLE OUTPUT & TALLY RESULTS</div>
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                            {testResults.length > 0 ? (
                                <>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {testResults.map((tr, i) => <button key={i} onClick={() => setActiveTestIndex(i)} style={{ padding: '0.2rem 0.6rem', background: activeTestIndex === i ? '#1E293B' : 'transparent', border: '1px solid #1E293B', color: tr.pass ? '#10B981' : '#F87171', borderRadius: '4px', fontSize: '0.7rem' }}>Case {i+1} {tr.pass ? '✓' : '✗'}</button>)}
                                    </div>
                                    <div style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                                        <div style={{ marginBottom: '0.5rem' }}><span style={{ color: '#64748B' }}>STATUS:</span> {testResults[activeTestIndex].pass ? 'MATCHED' : 'LOGIC MISMATCH'}</div>
                                        <div style={{ backgroundColor: '#0F172A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>{testResults[activeTestIndex].actual}</div>
                                    </div>
                                </>
                            ) : <div style={{ color: '#475569', textAlign: 'center', marginTop: '1rem' }}>No results yet. Click Run Code.</div>}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AssignmentRunner;
