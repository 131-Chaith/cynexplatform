import React from 'react';
import { motion } from 'framer-motion';
import { 
    Video, QrCode, ShieldCheck, BarChart3, Clock, Users, 
    RefreshCw, Download, Layers, CheckCircle2, AlertTriangle, 
    Zap, Lock, Smartphone, Globe, BarChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const AttendanceLanding = () => {
    const navigate = useNavigate();

    return (
        <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Navigation Header */}
            <header style={{ 
                padding: '1.5rem 5%', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #F1F5F9',
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', background: '#2563EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Online Attendance</h1>
                        <p style={{ fontSize: '0.7rem', fontWeight: '600', color: '#2563EB', margin: 0, textTransform: 'uppercase' }}>QR Code Based System</p>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {['Features', 'How It Works', 'Benefits', 'Pricing', 'Contact'].map(item => (
                        <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#2563EB'} onMouseLeave={e => e.target.style.color = '#64748B'}>{item}</a>
                    ))}
                    <Button onClick={() => navigate('/login')} style={{ background: '#2563EB', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '700' }}>Get Started</Button>
                </nav>
            </header>

            <main style={{ padding: '4rem 5%' }}>
                {/* 2.1 Online Attendance Hero */}
                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '6rem' }}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>2.1 Online Attendance</span>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0F172A', margin: '1.5rem 0 0.5rem', letterSpacing: '-0.03em' }}>Google Meet Integration</h2>
                        <p style={{ fontSize: '1.25rem', color: '#64748B', marginBottom: '2.5rem' }}>Real-time attendance tracking with Google Meet</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
                            <FeatureLink icon={<Users size={20} />} text="Automatic attendance tracking during Google Meet sessions" />
                            <FeatureLink icon={<Clock size={20} />} text="Join/Leave tracking with timestamps" />
                            <FeatureLink icon={<ShieldCheck size={20} />} text="QR Code based attendance" />
                            <FeatureLink icon={<BarChart size={20} />} text="Real-time reports and analytics" />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button style={{ background: '#2563EB', padding: '1rem 2rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem' }}>Learn More</Button>
                            <Button variant="outline" style={{ border: '1px solid #E2E8F0', padding: '1rem 2rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem' }}>View Demo</Button>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative' }}>
                        <div style={{ 
                            background: '#F8FAFC', 
                            borderRadius: '2rem', 
                            padding: '1.5rem', 
                            boxShadow: '0 40px 100px -20px rgba(37, 99, 235, 0.15)',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <img src="https://www.gstatic.com/meet/google_meet_primary_horizontal_2020q4_logo_be3fecdc83e2bcc25972a56f697a76c3.svg" alt="Meet" style={{ height: '24px' }} />
                            </div>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#E2E8F0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1000&auto=format&fit=crop" alt="Webcam" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                            </div>
                            
                            {/* Floaties */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }} 
                                transition={{ duration: 4, repeat: Infinity }}
                                style={{ position: 'absolute', top: '10%', left: '-5%', background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid #F1F5F9' }}
                            >
                                <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: '800', margin: 0 }}>Attendance Tracked</p>
                                    <p style={{ fontSize: '0.65rem', color: '#64748B', margin: 0 }}>Live Session Active</p>
                                </div>
                            </motion.div>

                            <div style={{ position: 'absolute', bottom: '15%', right: '-5%', background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', width: '180px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748B', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Scan to Mark Attendance</p>
                                <div style={{ width: '100px', height: '100px', background: '#F8FAFC', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <QrCode size={80} color="#0F172A" />
                                </div>
                                <div style={{ background: '#ECFDF5', color: '#10B981', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <CheckCircle2 size={12} /> Present
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 2.1.1 Feature Breakdown Table */}
                <section style={{ marginBottom: '6rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>2.1.1 Online Attendance - Feature Breakdown</span>
                    </div>
                    <FeatureTable 
                        data={[
                            { icon: <RefreshCw size={18} />, feature: 'Auto Attendance Pull', desc: 'Automatically fetch attendance from Google Meet after session ends', who: 'System Admin' },
                            { icon: <Clock size={18} />, feature: 'Duration Threshold', desc: 'Mark as present/absent based on minimum time spent', who: 'Admin' },
                            { icon: <Users size={18} />, feature: 'Manual Override', desc: 'Instructors can add students or mark them absent after session', who: 'Instructors, Admin' },
                            { icon: <AlertTriangle size={18} />, feature: 'Late Join/Flag', desc: 'Flag students who joined after X minutes of class start', who: 'Admin, Instructors' },
                        ]}
                    />
                </section>

                {/* 2.1.2 Advanced Reporting Table */}
                <section style={{ marginBottom: '6rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>2.1.2 Advanced Reporting & Technical Specifications</span>
                    </div>
                    <FeatureTable 
                        data={[
                            { icon: <BarChart3 size={18} />, feature: 'Attendance Reports', desc: 'Pre-session and post-session reports per student/class', who: 'Instructors, Admins' },
                            { icon: <AlertTriangle size={18} />, feature: 'Delete Unused Records', desc: 'Admin can delete attendance records for a semester', who: 'Admin' },
                            { icon: <Download size={18} />, feature: 'Export', desc: 'Export to Excel/PDF per batch, subject, or date range', who: 'Admin, Instructors' },
                        ]}
                    />
                </section>

                {/* 2.2 Offline Attendance Section */}
                <section style={{ marginBottom: '6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>2.2 Offline Attendance - QR Code System</span>
                            <p style={{ fontSize: '1.25rem', color: '#475569', marginTop: '1.5rem', lineHeight: '1.6' }}>
                                Full physical/digital attendance with participation tracking via QR code-based attendance system that is secure, flexible and tamper-resistant.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
                                <IconCard icon={<Smartphone color="#2563EB" />} title="Instant Check-in" desc="Quick QR scan for instant attendance marking" />
                                <IconCard icon={<ShieldCheck color="#2563EB" />} title="Secure & Tamper-proof" desc="JWT token based security prevents fraud" />
                                <IconCard icon={<Globe color="#2563EB" />} title="Offline Support" desc="Works without internet connection" />
                                <IconCard icon={<BarChart3 color="#2563EB" />} title="Analytics & Reports" desc="Detailed analytics and exportable reports" />
                            </div>
                        </div>

                        <div style={{ background: '#ECFDF5', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #D1FAE5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#059669' }}>
                                <Lock size={24} />
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>QR Code Security</h4>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#065F46', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                Each QR code contains a signed JWT token containing: session_id, class_id, batch_id, issued_at, expiry, and a nonce to prevent replay attacks.
                            </p>
                            <ul style={{ fontSize: '0.85rem', color: '#065F46', paddingLeft: '1.25rem', margin: 0 }}>
                                <li style={{ marginBottom: '0.5rem' }}>Optional: device fingerprinting + GPS check for mobile validation.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 2.2.1 Offline Feature Breakdown */}
                <section style={{ marginBottom: '8rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>2.2.1 Offline Attendance - Feature Breakdown</span>
                    </div>
                    <FeatureTable 
                        data={[
                            { icon: <Layers size={18} />, feature: 'QR Generation', desc: 'Generate unique rotating time-based QR codes per session', who: 'Instructors' },
                            { icon: <Clock size={18} />, feature: 'QR Expiry/Slider', desc: 'Fullscreen QR display for paperless mode', who: 'Instructors' },
                            { icon: <RefreshCw size={18} />, feature: 'Session QR Reuse', desc: 'Students can use multiple sessions (per-day reset mode)', who: 'Students' },
                        ]}
                    />
                </section>

                {/* Why Choose Our System? Section */}
                <section style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '4rem' }}>Why Choose Our System?</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <BenefitCard icon={<Zap color="#2563EB" />} title="Easy to Use" desc="Simple interface for instructors and students" />
                        <BenefitCard icon={<Lock color="#2563EB" />} title="Highly Secure" desc="Advanced security measures and validation" />
                        <BenefitCard icon={<RefreshCw color="#2563EB" />} title="Real-time Tracking" desc="Live attendance tracking and instant updates" />
                        <BenefitCard icon={<BarChart color="#2563EB" />} title="Comprehensive Reports" desc="Detailed analytics and customizable reports" />
                        <BenefitCard icon={<Smartphone color="#2563EB" />} title="Scalable Solution" desc="Built to scale with your institution's needs" />
                    </div>
                </section>
            </main>

            <footer style={{ padding: '4rem 5%', borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>&copy; 2026 Online Attendance System. All rights reserved.</p>
            </footer>
        </div>
    );
};

// --- Helper Components ---

const FeatureLink = ({ icon, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color: '#2563EB' }}>{icon}</div>
        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#475569' }}>{text}</span>
    </div>
);

const FeatureTable = ({ data }) => (
    <div style={{ overflowX: 'auto', borderRadius: '1rem', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                    <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>Feature</th>
                    <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>Description</th>
                    <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>Who Can Use</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: '#2563EB' }}>{item.icon}</div>
                                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.feature}</span>
                            </div>
                        </td>
                        <td style={{ padding: '1.25rem', color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5' }}>{item.desc}</td>
                        <td style={{ padding: '1.25rem', color: '#475569', fontSize: '0.9rem', fontWeight: '600' }}>{item.who}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const IconCard = ({ icon, title, desc }) => (
    <div style={{ display: 'flex', gap: '1.25rem' }}>
        <div style={{ padding: '0.75rem', background: '#F0F7FF', borderRadius: '12px', flexShrink: 0, height: 'fit-content' }}>{icon}</div>
        <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '800' }}>{title}</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>{desc}</p>
        </div>
    </div>
);

const BenefitCard = ({ icon, title, desc }) => (
    <div style={{ padding: '2rem', background: '#F8FAFC', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid #F1F5F9', transition: 'transform 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)' }}>{icon}</div>
        </div>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: '800' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5' }}>{desc}</p>
    </div>
);

export default AttendanceLanding;
