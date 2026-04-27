import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const AttendanceCalendar = ({ data }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= getDaysInMonth(currentMonth, currentYear); i++) calendarDays.push(i);

    const getStatusForDay = (day) => {
        if (!day) return null;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = data.find(r => r.join_time.startsWith(dateStr));
        return record?.status || 'absent'; // Simple logic: if no record, assume absent for past days
    };

    return (
        <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarIcon size={20} color="#6366F1" /> {months[currentMonth]} {currentYear}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
                    <button style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                {days.map(d => <div key={d} style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                {calendarDays.map((day, idx) => {
                    const status = getStatusForDay(day);
                    const isToday = day === today.getDate();
                    
                    return (
                        <motion.div 
                            key={idx}
                            whileHover={day ? { scale: 1.1 } : {}}
                            style={{ 
                                aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700',
                                background: !day ? 'transparent' : (isToday ? '#EEF2FF' : '#F8FAFC'),
                                border: isToday ? '2px solid #6366F1' : 'none',
                                color: !day ? 'transparent' : (isToday ? '#6366F1' : '#475569'),
                                position: 'relative'
                            }}
                        >
                            {day}
                            {day && (
                                <div style={{ 
                                    position: 'absolute', bottom: '6px', width: '6px', height: '6px', borderRadius: '50%',
                                    background: status === 'present' ? '#10B981' : (status === 'late' ? '#F59E0B' : (day < today.getDate() ? '#EF4444' : 'transparent'))
                                }}></div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                <LegendItem color="#10B981" label="Present" />
                <LegendItem color="#EF4444" label="Absent" />
                <LegendItem color="#F59E0B" label="Late" />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
        <span style={{ color: '#64748B' }}>{label}</span>
    </div>
);

export default AttendanceCalendar;
