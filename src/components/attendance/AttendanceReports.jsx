import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, Filter, RefreshCw, Users, TrendingDown, Award, Clock } from 'lucide-react';
import api from '../../services/api';

const STATUS_STYLE = {
    present: { bg: '#ECFDF5', color: '#059669' },
    absent:  { bg: '#FEF2F2', color: '#DC2626' },
    partial: { bg: '#FFFBEB', color: '#D97706' },
};

const AttendanceReports = () => {
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [cumulative, setCumulative] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        batch_id: '', course_id: '', date_from: '', date_to: ''
    });

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [b, c] = await Promise.all([api.get('batches'), api.get('courses')]);
                setBatches(b.data || []);
                setCourses(c.data || []);
            } catch (e) {}
        };
        fetchMeta();
        fetchCumulative();
    }, []);

    const fetchCumulative = async (params = {}) => {
        setLoading(true);
        try {
            const res = await api.get('attendance/reports/cumulative', { params });
            setCumulative(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleFilter = () => {
        const params = {};
        if (filters.batch_id) params.batch_id = filters.batch_id;
        if (filters.course_id) params.course_id = filters.course_id;
        fetchCumulative(params);
    };

    const handleExportCSV = async () => {
        try {
            const params = {};
            if (filters.batch_id) params.batch_id = filters.batch_id;
            if (filters.course_id) params.course_id = filters.course_id;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;

            const res = await api.get('attendance/reports/export-advanced', { params });
            const data = res.data;
            if (!data?.length) { alert('No records to export.'); return; }

            const headers = Object.keys(data[0]);
            const rows = data.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (e) { alert('Export failed: ' + e.message); }
    };

    const atRisk = cumulative.filter(r => (r.attendance_percentage || 0) < 75);
    const avg = cumulative.length
        ? Math.round(cumulative.reduce((a, r) => a + Number(r.attendance_percentage || 0), 0) / cumulative.length)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', margin: '0 0 0.25rem' }}>Attendance Reports</h3>
                    <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>Cumulative per-student/batch reports • Export to CSV/PDF</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleExportCSV}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                        <FileSpreadsheet size={16} /> Export CSV
                    </button>
                    <button onClick={() => alert('PDF export available in production build.')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                        <FileText size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Filter size={16} color="#6366F1" />
                    <span style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.85rem' }}>Filters</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Batch</label>
                        <select value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} style={selectStyle}>
                            <option value="">All Batches</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Subject / Course</label>
                        <select value={filters.course_id} onChange={e => setFilters(f => ({ ...f, course_id: e.target.value }))} style={selectStyle}>
                            <option value="">All Subjects</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>From Date</label>
                        <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} style={selectStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>To Date</label>
                        <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} style={selectStyle} />
                    </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Filter size={14} /> Apply Filters
                    </button>
                    <button onClick={() => { setFilters({ batch_id: '', course_id: '', date_from: '', date_to: '' }); fetchCumulative(); }}
                        style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Reset
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <SummaryCard icon={<Users size={20} />} label="Total Students" value={cumulative.length} color="#6366F1" bg="#EEF2FF" />
                <SummaryCard icon={<Award size={20} />} label="Avg Attendance" value={`${avg}%`} color="#059669" bg="#ECFDF5" />
                <SummaryCard icon={<TrendingDown size={20} />} label="At Risk (<75%)" value={atRisk.length} color="#DC2626" bg="#FEF2F2" />
                <SummaryCard icon={<Clock size={20} />} label="Report Generated" value={new Date().toLocaleDateString()} color="#0284C7" bg="#F0F9FF" />
            </div>

            {/* Cumulative Table */}
            <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: '900', color: '#1E293B', margin: 0 }}>Per-Student Cumulative Report</h4>
                    <button onClick={() => fetchCumulative()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1' }}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    </button>
                </div>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading reports...</div>
                ) : cumulative.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                        <FileText size={40} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: '700' }}>No data available. Apply filters or pull Meet attendance first.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                    {['Student', 'Batch', 'Course', 'Sessions', 'Present', 'Absent', 'Partial', 'Late', 'Attend%', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '0.875rem 1rem', color: '#64748B', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cumulative.map((r, idx) => {
                                    const pct = Number(r.attendance_percentage || 0);
                                    const atRiskRow = pct < 75;
                                    return (
                                        <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                            style={{ borderBottom: '1px solid #F8FAFC', background: atRiskRow ? '#FFFBEB' : 'white' }}>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <p style={{ fontWeight: '700', color: '#1E293B', margin: 0 }}>{r.student_name}</p>
                                                <p style={{ color: '#94A3B8', fontSize: '0.72rem', margin: 0 }}>{r.student_email}</p>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>{r.batch_name || '—'}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#475569', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.course_title || '—'}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: '700' }}>{r.total_sessions}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#059669', fontWeight: '700' }}>{r.present_count}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#DC2626', fontWeight: '700' }}>{r.absent_count}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#D97706', fontWeight: '700' }}>{r.partial_count}</td>
                                            <td style={{ padding: '0.875rem 1rem', color: '#7C3AED', fontWeight: '700' }}>{r.late_count}</td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '60px', height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#059669' : '#DC2626', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: pct >= 75 ? '#059669' : '#DC2626' }}>{pct}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', background: atRiskRow ? '#FEF2F2' : '#ECFDF5', color: atRiskRow ? '#DC2626' : '#059669' }}>
                                                    {atRiskRow ? '⚠ At Risk' : '✓ Good'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, color, bg }) => (
    <div style={{ background: bg, borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color, padding: '0.6rem', background: 'white', borderRadius: '10px' }}>{icon}</div>
        <div>
            <p style={{ fontSize: '0.7rem', fontWeight: '800', color, textTransform: 'uppercase', margin: '0 0 0.25rem' }}>{label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: '900', color, margin: 0 }}>{value}</p>
        </div>
    </div>
);

const labelStyle = { fontSize: '0.72rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' };
const selectStyle = { width: '100%', padding: '0.7rem 0.875rem', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem', color: '#475569', background: 'white', boxSizing: 'border-box' };

export default AttendanceReports;
