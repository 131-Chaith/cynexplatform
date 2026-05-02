import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { 
    Settings, Users, Bell, Palette, Shield, Globe, 
    ChevronRight, Save, Plus, Trash2, Lock, UserPlus, 
    RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [batches, setBatches] = useState([]);
    
    // Module Data State
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [globalSettings, setGlobalSettings] = useState({
        institutionName: 'Cynex Academy',
        theme: 'dark',
        meetLinkAutoGenerate: true,
        examReminders: true,
        resultAnnounce: true,
        attendanceAlert: true,
        twoFactorAuth: false
    });

    // Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', batch_id: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, logsRes, batchesRes, settingsRes] = await Promise.all([
                api.get('admin/all-users'),
                api.get('admin/audit-logs'),
                api.get('batches'),
                api.get('admin/settings')
            ]);
            setUsers(usersRes.data);
            setAuditLogs(logsRes.data);
            setBatches(batchesRes.data);
            if (settingsRes.data) setGlobalSettings(prev => ({ ...prev, ...settingsRes.data }));
        } catch (error) {
            console.error("Failed to fetch settings data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.post('admin/settings', globalSettings);
            alert("System settings synchronized successfully.");
            fetchAllData();
        } catch (error) {
            alert("Synchronization failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddUser = async () => {
        try {
            await api.post('admin/users', newUser);
            alert("Operative added to directory.");
            setShowUserModal(false);
            setNewUser({ name: '', email: '', role: 'student', batch_id: '' });
            fetchAllData();
        } catch (error) {
            alert("Failed to add user.");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Terminate operative access?")) return;
        try {
            await api.delete(`admin/users/${id}`);
            fetchAllData();
        } catch (error) {
            alert("Termination failed.");
        }
    };

    const handleToggleLock = async (user) => {
        try {
            await api.put(`admin/users/${user.id}/lock`, { locked: !user.locked });
            fetchAllData();
        } catch (error) {
            alert("Protocol override failed.");
        }
    };

    const tabs = [
        { id: 'users', label: 'User Management', icon: <Users size={18} />, category: 'Core' },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, category: 'Communication' },
        { id: 'uiux', label: 'UI/UX Customization', icon: <Palette size={18} />, category: 'Design' },
        { id: 'security', label: 'Security & Privacy', icon: <Shield size={18} />, category: 'System' },
        { id: 'system', label: 'System & Integration', icon: <Globe size={18} />, category: 'System' },
    ];

    const categories = ['Core', 'Communication', 'Design', 'System'];

    // Common styles for consistent elegance
    const cardStyle = {
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        padding: '1.5rem',
        background: '#ffffff'
    };

    // --- Sub-components for Modules ---
    const UserModule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Identity Directory</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage system operatives and access protocols.</p>
                </div>
                <Button variant="primary" onClick={() => setShowUserModal(true)} style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>
                    <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Add Operative
                </Button>
            </div>
            
            <div style={{ ...cardStyle, padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operative</th>
                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol (Role)</th>
                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Squadron (Batch)</th>
                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>{u.email}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{ 
                                        padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.02em',
                                        backgroundColor: u.role === 'admin' ? '#fee2e2' : u.role === 'moderator' ? '#fef3c7' : '#dcfce7',
                                        color: u.role === 'admin' ? '#991b1b' : u.role === 'moderator' ? '#92400e' : '#166534',
                                        border: `1px solid ${u.role === 'admin' ? '#fca5a5' : u.role === 'moderator' ? '#fcd34d' : '#86efac'}`
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>
                                    {batches.find(b => b.id === u.batch_id)?.batch_name || 'Global Access'}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <button onClick={() => handleToggleLock(u)} style={{ border: 'none', background: u.locked ? '#fee2e2' : '#e0e7ff', color: u.locked ? '#ef4444' : '#6366f1', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', marginRight: '0.5rem', transition: 'all 0.2s' }}>
                                        <Lock size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteUser(u.id)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const NotificationModule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Comm-Link Protocols</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure automated dispatch sequences.</p>
            </div>
            <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { id: 'examReminders', label: 'Exam Temporal Reminders', desc: 'Auto-dispatch via Email, SMS, Push' },
                        { id: 'resultAnnounce', label: 'Result Dissemination', desc: 'Broadcast results immediately on publish' },
                        { id: 'attendanceAlert', label: 'Attendance Variance Alerts', desc: 'Notify on absence/anomaly' }
                    ].map(n => (
                        <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>{n.label}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{n.desc}</div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={globalSettings[n.id]} 
                                onChange={(e) => setGlobalSettings({...globalSettings, [n.id]: e.target.checked})} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const UIUXModule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Interface Calibration</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Adjust visual aesthetics and branding elements.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ ...cardStyle }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '1.25rem', color: '#1e293b' }}>Theme Protocol</h4>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div 
                            onClick={() => setGlobalSettings({...globalSettings, theme: 'light'})}
                            style={{ flex: 1, height: '100px', background: '#ffffff', border: globalSettings.theme === 'light' ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: globalSettings.theme === 'light' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none', transition: 'all 0.2s' }}
                        >
                            <span style={{ fontWeight: '800', color: '#1e293b', letterSpacing: '0.05em' }}>LIGHT</span>
                        </div>
                        <div 
                            onClick={() => setGlobalSettings({...globalSettings, theme: 'dark'})}
                            style={{ flex: 1, height: '100px', background: '#0f172a', border: globalSettings.theme === 'dark' ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: globalSettings.theme === 'dark' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none', transition: 'all 0.2s' }}
                        >
                            <span style={{ fontWeight: '800', color: '#ffffff', letterSpacing: '0.05em' }}>DARK</span>
                        </div>
                    </div>
                </div>

                <div style={{ ...cardStyle }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '1.25rem', color: '#1e293b' }}>Branding Assets</h4>
                    <Input label="Institution Designation" value={globalSettings.institutionName} onChange={(e) => setGlobalSettings({...globalSettings, institutionName: e.target.value})} />
                    <div style={{ marginTop: '1.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Primary Logo Asset</label>
                        <input type="file" id="logo-upload" style={{ display: 'none' }} onChange={() => alert("Logo update staged.")} />
                        <label htmlFor="logo-upload" style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-border-primary">
                            <Plus size={24} style={{ color: '#94a3b8' }} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const SecurityModule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Defense & Integrity</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Monitor access logs and configure security layers.</p>
            </div>
            <div style={{ ...cardStyle }}>
                <h4 style={{ fontWeight: '800', marginBottom: '1.25rem', color: '#1e293b' }}>Audit Logs (Last 100 Cycles)</h4>
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    {auditLogs.map(log => (
                        <div key={log.id} style={{ display: 'flex', gap: '1.25rem', padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', alignItems: 'center' }}>
                            <span style={{ color: '#6366f1', fontWeight: '800', minWidth: '80px' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                            <span style={{ fontWeight: '800', color: '#1e293b', minWidth: '120px' }}>{log.user_name}</span>
                            <span style={{ color: '#475569', flex: 1 }}>{log.action}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>{log.module}</span>
                        </div>
                    ))}
                    {auditLogs.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No logs recorded yet.</div>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ ...cardStyle, background: '#fef2f2', borderColor: '#fecaca' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                        <div style={{ background: '#fee2e2', padding: '0.5rem', borderRadius: '8px' }}><Lock size={20} /></div>
                        <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Two-Factor Protocol</div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: '1rem 0 1.5rem 0', lineHeight: '1.5' }}>Enforce multi-stage authentication for all Administrative units to prevent unauthorized breaches.</p>
                    <Button 
                        variant={globalSettings.twoFactorAuth ? "outline" : "danger"} 
                        onClick={() => {
                            setGlobalSettings({...globalSettings, twoFactorAuth: !globalSettings.twoFactorAuth});
                            alert(globalSettings.twoFactorAuth ? "2FA Protocol Deactivated." : "2FA Protocol Staged for Activation.");
                        }}
                        style={{ width: '100%', borderRadius: '8px', fontWeight: '800' }}
                    >
                        {globalSettings.twoFactorAuth ? 'Deactivate 2FA' : 'Activate 2FA Requirement'}
                    </Button>
                </div>

                <div style={{ ...cardStyle }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: '#fee2e2', padding: '0.5rem', borderRadius: '8px', color: '#ef4444' }}><AlertCircle size={20} /></div>
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>Operative Restriction</div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '1rem 0 1.5rem 0', lineHeight: '1.5' }}>Manage blocklists and restrict access to specific IP ranges or individual operative accounts.</p>
                    <Button variant="outline" onClick={() => alert("Restriction Hub Initializing...")} style={{ width: '100%', borderRadius: '8px', fontWeight: '800' }}>Open Restriction Hub</Button>
                </div>
            </div>
        </div>
    );

    const SystemModule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>System Sync & Integration</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage API keys, backups, and external connections.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ ...cardStyle }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>External API Keys</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Input label="Google Cloud Engine" type="password" placeholder="••••••••••••••••" />
                        <Input label="SharePoint Asset Link" type="text" placeholder="https://..." />
                        <Input label="Vercel Deployment Webhook" type="text" placeholder="https://..." />
                    </div>
                </div>

                <div style={{ ...cardStyle }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>Data Management</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Button 
                            onClick={() => alert("System Backup Sequence Initiated.")}
                            style={{ justifyContent: 'flex-start', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}
                        >
                            <RefreshCw size={18} style={{ marginRight: '0.75rem', color: '#6366f1' }} /> Execute System Backup
                        </Button>
                        <Button 
                            onClick={() => alert("Restoration Archive Browsing...")}
                            style={{ justifyContent: 'flex-start', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}
                        >
                            <RefreshCw size={18} style={{ marginRight: '0.75rem', color: '#6366f1' }} /> Restore from Archive
                        </Button>
                        <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#dcfce7', padding: '0.25rem', borderRadius: '50%' }}><CheckCircle size={16} style={{ color: '#166534' }} /></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '800' }}>System Status: Optimal</div>
                                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>Current Version: v2.4.0 (Stable)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'users': return <UserModule />;
            case 'notifications': return <NotificationModule />;
            case 'uiux': return <UIUXModule />;
            case 'security': return <SecurityModule />;
            case 'system': return <SystemModule />;
            default: return <UserModule />;
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ color: '#6366f1' }}>
                <RefreshCw size={48} />
            </motion.div>
        </div>
    );

    return (
        <div style={{ display: 'flex', gap: '2.5rem', minHeight: 'calc(100vh - 150px)', padding: '1rem' }}>
            
            {/* Sidebar Navigation */}
            <div style={{ width: '280px', flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: '2rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Settings</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage system architecture and configure core administrative parameters.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {categories.map(cat => (
                            <div key={cat} style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '1rem' }}>
                                    {cat}
                                </div>
                                {tabs.filter(t => t.category === cat).map(tab => (
                                    <motion.button
                                        key={tab.id}
                                        whileHover={{ x: 4, backgroundColor: activeTab === tab.id ? undefined : '#f8fafc' }}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.875rem 1rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: activeTab === tab.id ? 'linear-gradient(135deg, #4F46E5, #9333EA)' : 'transparent',
                                            color: activeTab === tab.id ? '#ffffff' : '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: '700',
                                            fontSize: '0.9rem',
                                            boxShadow: activeTab === tab.id ? '0 4px 15px rgba(79, 70, 229, 0.25)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {tab.icon}
                                            {tab.label}
                                        </div>
                                        {activeTab === tab.id && <ChevronRight size={16} />}
                                    </motion.button>
                                ))}
                            </div>
                        ))}
                    </div>

                    <Button 
                        onClick={handleSaveSettings}
                        disabled={saving}
                        style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '10px', fontWeight: '900', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    >
                        <Save size={18} style={{ marginRight: '0.5rem' }} /> {saving ? 'Syncing Data...' : 'Commit Changes'}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showUserModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ background: '#ffffff', padding: '2.5rem', borderRadius: '12px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>Onboard Operative</h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Enter credentials to initialize a new system user.</p>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <Input label="Full Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Jane Doe" />
                                <Input label="Email Protocol" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="jane@example.com" />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>Access Role</label>
                                    <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ padding: '0.875rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', color: '#0f172a', outline: 'none', transition: 'border 0.2s' }}>
                                        <option value="student">STUDENT</option>
                                        <option value="moderator">MODERATOR</option>
                                        <option value="admin">ADMINISTRATOR</option>
                                    </select>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>Squadron Assignment</label>
                                    <select value={newUser.batch_id} onChange={(e) => setNewUser({...newUser, batch_id: e.target.value})} style={{ padding: '0.875rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', color: '#0f172a', outline: 'none', transition: 'border 0.2s' }}>
                                        <option value="">Global / Unassigned</option>
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                                    </select>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <Button variant="outline" onClick={() => setShowUserModal(false)} style={{ flex: 1, borderRadius: '10px', fontWeight: '800' }}>Cancel</Button>
                                    <Button onClick={handleAddUser} style={{ flex: 1, background: 'linear-gradient(135deg, #4F46E5, #9333EA)', borderRadius: '10px', fontWeight: '800', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>Initialize Profile</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                input[type="checkbox"] {
                    appearance: none;
                    width: 44px;
                    height: 24px;
                    background: #cbd5e1;
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                input[type="checkbox"]:checked {
                    background: linear-gradient(135deg, #4F46E5, #9333EA);
                }
                input[type="checkbox"]::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    top: 2px;
                    left: 2px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                input[type="checkbox"]:checked::after {
                    left: 22px;
                }
                .table-row-hover:hover {
                    background-color: #f8fafc;
                }
                .hover-border-primary:hover {
                    border-color: #6366f1 !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default AdminSettings;
