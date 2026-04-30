import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const AttendanceCalendar = ({ data = [], upcoming = [], live = [] }) => {
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

    const getDayInfo = (day) => {
        if (!day) return null;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const historyRecord = data.find(r => r.join_time?.startsWith(dateStr));
        const liveSession = live.find(s => s.start_time?.startsWith(dateStr));
        const upcomingSession = upcoming.find(s => s.start_time?.startsWith(dateStr));

        return {
            status: historyRecord?.status || (day < today.getDate() && !historyRecord ? 'absent' : null),
            isLive: !!liveSession,
            isUpcoming: !!upcomingSession,
            session: liveSession || upcomingSession
        };
    };

    return (
        <div style={{ background: 'white', borderRadius: '2rem', padding: '2rem', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarIcon size={20} color="#6366F1" /> {months[currentMonth]} {currentYear}
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                {days.map(d => <div key={d} style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                {calendarDays.map((day, idx) => {
                    const info = getDayInfo(day);
                    const isToday = day === today.getDate();
                    
                    return (
                        <motion.div 
                            key={idx}
                            whileHover={day ? { scale: 1.05, y: -5 } : {}}
                            style={{ 
                                aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                borderRadius: '16px', fontSize: '0.9rem', fontWeight: '800',
                                background: !day ? 'transparent' : (isToday ? '#6366F1' : '#F8FAFC'),
                                border: (info?.isLive) ? '2px solid #EF4444' : 'none',
                                color: !day ? 'transparent' : (isToday ? 'white' : '#475569'),
                                position: 'relative',
                                cursor: day ? 'pointer' : 'default',
                                boxShadow: (info?.isLive || info?.isUpcoming) ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                            }}
                        >
                            {day}
                            {day && (
                                <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '8px' }}>
                                    {info.status && (
                                        <div style={{ 
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: info.status === 'present' ? '#10B981' : (info.status === 'late' ? '#F59E0B' : '#EF4444')
                                        }}></div>
                                    )}
                                    {info.isLive && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></div>}
                                    {info.isUpcoming && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366F1' }}></div>}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <LegendItem color="#10B981" label="Present" />
                <LegendItem color="#EF4444" label="Absent" />
                <LegendItem color="#F59E0B" label="Late" />
                <LegendItem color="#EF4444" label="Live" ring />
                <LegendItem color="#6366F1" label="Scheduled" />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label, ring }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
        <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', background: color,
            border: ring ? '2px solid white' : 'none',
            boxShadow: ring ? `0 0 0 1px ${color}` : 'none'
        }}></div>
        <span style={{ color: '#64748B' }}>{label}</span>
    </div>
);

export default AttendanceCalendar;
