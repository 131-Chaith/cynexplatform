import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BarChart2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AttendanceAnalytics = ({ data }) => {
    // Guard against null/undefined data
    const subjects = data?.subjects || [];
    const monthly = data?.monthly || [];

    // Placeholder data if empty (so charts still render nicely)
    const subjectData = subjects.length > 0 ? subjects : [
        { subject: 'No Data Yet', present_count: 0 }
    ];
    const monthlyData = monthly.length > 0 ? monthly : [
        { month: 'No Data', count: 0 }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Subject-wise Attendance */}
                <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={18} color="#6366F1" /> Subject-wise Attendance
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer minWidth={200} minHeight={200}>
                            <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <Tooltip 
                                    cursor={{ fill: '#F8FAFC' }} 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                                    formatter={(value) => [`${value} Classes`, 'Attended']}
                                />
                                <Bar dataKey="present_count" radius={[6, 6, 0, 0]}>
                                    {subjectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trend */}
                <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} color="#10B981" /> Monthly Attendance Trend
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer minWidth={200} minHeight={200}>
                            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                                    formatter={(value) => [`${value} Classes`, 'Attended']}
                                />
                                <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMonth)" dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Insight Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <InsightCard 
                    label="Best Subject" 
                    value={subjects[0]?.subject || 'N/A'} 
                    subValue={`${subjects[0]?.present_count || 0} classes attended`}
                    color="#10B981"
                    bg="#ECFDF5"
                />
                <InsightCard 
                    label="Needs Improvement" 
                    value={subjects[subjects.length - 1]?.subject || 'N/A'} 
                    subValue={`${subjects[subjects.length - 1]?.present_count || 0} classes attended`}
                    color="#EF4444"
                    bg="#FEF2F2"
                />
                <InsightCard 
                    label="Total Sessions Attended" 
                    value={subjects.reduce((acc, s) => acc + Number(s.present_count || 0), 0)} 
                    subValue="Across all subjects"
                    color="#6366F1"
                    bg="#EEF2FF"
                />
            </div>
        </div>
    );
};

const InsightCard = ({ label, value, subValue, color, bg }) => (
    <motion.div 
        whileHover={{ y: -4 }}
        style={{ padding: '1.5rem', background: bg || 'white', borderRadius: '1.5rem', border: '1px solid #F1F5F9', transition: 'all 0.2s' }}
    >
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.25rem' }}>{value}</p>
        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: color }}>{subValue}</p>
    </motion.div>
);

export default AttendanceAnalytics;
