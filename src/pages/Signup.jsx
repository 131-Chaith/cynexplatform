import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserPlus, GraduationCap, ArrowRight, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await register(formData.name, formData.email, formData.password, 'student');
            if (result.success) {
                alert('Registration completed successfully.');
                navigate('/login');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            width: '100%',
            backgroundColor: '#020617',
            overflow: 'hidden'
        }}>
            {/* Left Side: Image/Branding (Reversed for variety) */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ 
                    flex: '1 1 50%', 
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '4rem',
                    color: 'white'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.9) 0%, rgba(124,58,237,0.9) 100%)',
                        zIndex: 1,
                        mixBlendMode: 'multiply'
                    }}></div>
                    <img 
                        src="/login_side.png" 
                        alt="Education Visual"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '2rem' }}>Start Your <br/>Elite Journey.</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                'Access premium course content',
                                'Real-time progress tracking',
                                'Certified skill assessments',
                                'Direct student-admin synergy'
                            ].map((text, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 + (i * 0.1) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                                >
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={16} color="#FCD34D" />
                                    </div>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side: Form */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ 
                    flex: '1 1 50%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '4rem',
                    backgroundColor: 'white',
                    zIndex: 10
                }}
            >
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}
                    >
                        <div style={{ 
                            width: '40px', height: '40px', 
                            background: 'var(--primary-gradient)', 
                            borderRadius: '10px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: 'white' 
                        }}>
                            <GraduationCap size={24} />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--dark)' }}>Cynex</span>
                    </motion.div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Join the next generation of digital learners.</p>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                backgroundColor: '#FEE2E2',
                                color: '#B91C1C',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.875rem',
                                borderLeft: '4px solid #EF4444'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input
                            label="Full Legal Name"
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. John Doe"
                        />

                        <Input
                            label="Digital Address (Email)"
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="name@example.com"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Secret Key"
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 chars"
                            />

                            <Input
                                label="Verify Key"
                                type="password"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Repeat key"
                            />
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '1rem' }}>
                            <Button 
                                type="submit" 
                                isLoading={loading} 
                                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'var(--primary-gradient)' }}
                            >
                                Register Profile <UserPlus size={18} style={{ marginLeft: '0.5rem' }} />
                            </Button>
                        </motion.div>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                            Sign in to Portal
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
