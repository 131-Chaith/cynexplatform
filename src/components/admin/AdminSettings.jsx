import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import { Settings, Save, Mail, Shield, Building, Key, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const [config, setConfig] = useState({
        instituteName: '',
        instituteAddress: '',
        instituteContact: '',
        academicYear: '2025-2026',
        currentSemester: '1',
        emailTemplates: {
            welcome: 'Welcome to the academy! Your journey begins now.',
            enrollment: 'You have been enrolled in {course}.',
            certificate: 'Congratulations! Your certificate is ready.'
        },
        aiFeatures: {
            quizGen: true,
            grading: false,
            chatbot: true
        },
        apiKeys: {
            google: '',
            youtube: '',
            openai: ''
        },
        rolePermissions: {
            instructorCanApproveCert: false,
            studentCanSelfEnroll: true,
            allowPublicCatalog: true
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            // Merge fetched settings into default config
            setConfig(prev => ({
                ...prev,
                ...res.data
            }));
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/admin/settings', config);
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage('Error saving settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, key, value) => {
        if (section) {
            setConfig(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value
                }
            }));
        } else {
            setConfig(prev => ({ ...prev, [key]: value }));
        }
    };

    if (loading) return <div>Loading Configuration...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Settings size={28} style={{ color: '#6366F1' }} />
                        Settings & Configuration
                    </h2>
                    <p style={{ color: '#64748B', marginTop: '0.5rem' }}>Manage global platform parameters and integrations.</p>
                </div>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            {message && (
                <div style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    marginBottom: '2rem', 
                    backgroundColor: message.includes('Error') ? '#FEF2F2' : '#F0FDF4',
                    color: message.includes('Error') ? '#EF4444' : '#10B981',
                    border: `1px solid ${message.includes('Error') ? '#FEE2E2' : '#DCFCE7'}`,
                    fontWeight: '600'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Institute Profile */}
                <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                        <Building size={20} color="#3B82F6" /> Institute Profile
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Institute Name</label>
                            <input 
                                type="text" 
                                value={config.instituteName} 
                                onChange={(e) => handleChange(null, 'instituteName', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Contact Email / Phone</label>
                            <input 
                                type="text" 
                                value={config.instituteContact} 
                                onChange={(e) => handleChange(null, 'instituteContact', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Address</label>
                            <textarea 
                                value={config.instituteAddress} 
                                onChange={(e) => handleChange(null, 'instituteAddress', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', minHeight: '80px' }} 
                            />
                        </div>
                    </div>
                </Card>

                {/* Academic Configuration */}
                <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                        <Settings size={20} color="#10B981" /> Academic Configuration
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Current Academic Year</label>
                            <input 
                                type="text" 
                                value={config.academicYear} 
                                onChange={(e) => handleChange(null, 'academicYear', e.target.value)}
                                placeholder="e.g. 2025-2026"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Active Semester</label>
                            <select 
                                value={config.currentSemester} 
                                onChange={(e) => handleChange(null, 'currentSemester', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', backgroundColor: 'white' }}
                            >
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                                <option value="summer">Summer</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Email Templates */}
                <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                        <Mail size={20} color="#F59E0B" /> Email Templates
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Welcome Email</label>
                            <textarea 
                                value={config.emailTemplates.welcome} 
                                onChange={(e) => handleChange('emailTemplates', 'welcome', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', minHeight: '80px' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Enrollment Notification</label>
                            <textarea 
                                value={config.emailTemplates.enrollment} 
                                onChange={(e) => handleChange('emailTemplates', 'enrollment', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', minHeight: '80px' }} 
                            />
                        </div>
                    </div>
                </Card>

                {/* AI & Integration Features */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                            <Bot size={20} color="#8B5CF6" /> AI Modules Toggle
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries({
                                quizGen: 'Automated Quiz Generation',
                                grading: 'AI Assisted Grading',
                                chatbot: 'Student Support Chatbot'
                            }).map(([key, label]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: '#334155' }}>{label}</span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={config.aiFeatures[key]}
                                            onChange={(e) => handleChange('aiFeatures', key, e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }} 
                                        />
                                        <span style={{ 
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                                            backgroundColor: config.aiFeatures[key] ? '#10B981' : '#CBD5E1', 
                                            transition: '0.4s', borderRadius: '34px',
                                            display: 'flex', alignItems: 'center'
                                        }}>
                                            <span style={{ 
                                                position: 'absolute', content: '""', height: '18px', width: '18px', 
                                                left: config.aiFeatures[key] ? '28px' : '4px', bottom: '4px', 
                                                backgroundColor: 'white', transition: '0.4s', borderRadius: '50%' 
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                            <Shield size={20} color="#EF4444" /> Role Permissions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries({
                                instructorCanApproveCert: 'Instructors Can Approve Certificates',
                                studentCanSelfEnroll: 'Students Can Self-Enroll',
                                allowPublicCatalog: 'Public Course Catalog Visibility'
                            }).map(([key, label]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: '#334155' }}>{label}</span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={config.rolePermissions[key]}
                                            onChange={(e) => handleChange('rolePermissions', key, e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }} 
                                        />
                                        <span style={{ 
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                                            backgroundColor: config.rolePermissions[key] ? '#3B82F6' : '#CBD5E1', 
                                            transition: '0.4s', borderRadius: '34px',
                                            display: 'flex', alignItems: 'center'
                                        }}>
                                            <span style={{ 
                                                position: 'absolute', content: '""', height: '18px', width: '18px', 
                                                left: config.rolePermissions[key] ? '28px' : '4px', bottom: '4px', 
                                                backgroundColor: 'white', transition: '0.4s', borderRadius: '50%' 
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* API Keys */}
                <Card style={{ borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                        <Key size={20} color="#64748B" /> API Key Management
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Google Cloud API Key</label>
                            <input 
                                type="password" 
                                value={config.apiKeys.google} 
                                onChange={(e) => handleChange('apiKeys', 'google', e.target.value)}
                                placeholder="AIzaSy..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>YouTube API Key</label>
                            <input 
                                type="password" 
                                value={config.apiKeys.youtube} 
                                onChange={(e) => handleChange('apiKeys', 'youtube', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>OpenAI Key (For Chatbots)</label>
                            <input 
                                type="password" 
                                value={config.apiKeys.openai} 
                                onChange={(e) => handleChange('apiKeys', 'openai', e.target.value)}
                                placeholder="sk-..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }} 
                            />
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default AdminSettings;
