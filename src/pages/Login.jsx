import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogIn, GraduationCap, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                const user = JSON.parse(localStorage.getItem('user'));
                navigate(user.role === 'admin' ? '/admin' : '/student');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred during login');
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
            {/* Left Side: Form */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}
                    >
                        <div style={{ 
                            width: '40px', height: '40px', 
                            background: 'var(--primary-gradient)', 
                            borderRadius: '10px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: 'white' 
                        }}>
                            <GraduationCap size={24} />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--dark)' }}>Cynex Portal</span>
                    </motion.div>

                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>Experience Excellence</h2>
                    <p style={{ color: '#6B7280', marginBottom: '2rem' }}>Please enter your credentials to access your personalized learning portal.</p>

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

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Input
                                label="Identity"
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email or Username"
                                autoComplete="username"
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Input
                                label="Security Key"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Your Secure Password"
                                autoComplete="current-password"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    type="button"
                                    onClick={() => { setEmail('admin@gmail.com'); setPassword('admin123'); }}
                                    style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(37, 99, 235, 0.05)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Admin Demo
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    type="button"
                                    onClick={() => { setEmail('student@gmail.com'); setPassword('student123'); }}
                                    style={{ fontSize: '0.75rem', color: 'var(--secondary)', background: 'rgba(16, 185, 129, 0.05)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Student Demo
                                </motion.button>
                            </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                                type="submit" 
                                isLoading={loading} 
                                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', height: 'auto', fontSize: '1rem', background: 'var(--primary-gradient)' }}
                            >
                                Authenticate Profile <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                            </Button>
                        </motion.div>
                    </form>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
                        Don't have an elite account?{' '}
                        <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                            Initialize Registration
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Image/Branding */}
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
                    justifyContent: 'flex-end',
                    padding: '4rem',
                    color: 'white'
                }}
            >
                {/* Background Image */}
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
                        background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.95) 100%)',
                        zIndex: 1
                    }}></div>
                    <img 
                        src="/login_side.png" 
                        alt="Portal Visualization"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                {/* Content Overlay */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Sparkles size={24} style={{ color: '#FCD34D' }} />
                            <span style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next-Gen Learning API</span>
                        </div>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1' }}>Unlock Your <br/>Full Potential.</h2>
                        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)', maxWidth: '500px' }}>
                            Join thousands of students mastering complex skills with our AI-driven educational framework.
                        </p>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-10%',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.05)',
                        zIndex: 1
                    }}
                ></motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
