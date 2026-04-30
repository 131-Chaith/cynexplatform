import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Calendar, MapPin, BookOpen,
    Award, FileText, PlayCircle, Users, Edit3, Save, X, CheckCircle, GraduationCap, RefreshCw
} from 'lucide-react';

const StudentProfile = () => {
    const { updateCurrentUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [fetchError, setFetchError] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    const UPLOADS_URL = 'http://localhost:5002';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const res = await api.get('/students/profile-full');
            console.log('Profile Data Fetched:', res.data);
            
            if (!res.data || !res.data.user) {
                throw new Error('Incomplete profile data received from server');
            }

            setProfileData(res.data);
            let parsedSkills = [];
            try {
                parsedSkills = res.data.profile?.skills ? JSON.parse(res.data.profile.skills) : [];
            } catch(e) { parsedSkills = []; }
            
            setEditForm({
                name: res.data.user.name || '',
                phone: res.data.profile?.phone || '',
                address: res.data.profile?.address || '',
                dob: res.data.profile?.dob ? res.data.profile.dob.split('T')[0] : '',
                gender: res.data.profile?.gender || 'Male',
                institution: res.data.profile?.institution || '',
                highest_qualification: res.data.profile?.highest_qualification || '',
                year_of_passing: res.data.profile?.year_of_passing || '',
                resume_link: res.data.profile?.resume_link || '',
                skills: parsedSkills,
            });
        } catch (error) {
            console.error('Failed to load profile', error);
            const msg = error.response?.data?.message || error.message;
            setFetchError(msg.includes('b.name') ? 'Database Schema Error: Batch column name mismatch. Fixed on server, please refresh.' : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/students/profile', editForm);
            setSaveMsg('Profile updated successfully!');
            setEditing(false);
            fetchProfile();
        } catch (error) {
            setSaveMsg('Failed to update profile');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(''), 3000);
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploadingPhoto(true);
        try {
            const res = await api.post('/students/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSaveMsg('Photo updated successfully!');
            fetchProfile(); 
        } catch (error) {
            setSaveMsg('Photo upload failed');
        } finally {
            setUploadingPhoto(false);
            setTimeout(() => setSaveMsg(''), 3000);
        }
    };

    const handleUpdateSkills = async (updatedSkills) => {
        try {
            // Send the updated skills array immediately to the backend
            const payload = {
                ...editForm,
                skills: updatedSkills
            };
            await api.put('/students/profile', payload);
            
            // Update local state so it reflects immediately
            setEditForm(prev => ({ ...prev, skills: updatedSkills }));
        } catch (error) {
            console.error("Failed to update skills:", error);
            setSaveMsg('Failed to update skills');
            setTimeout(() => setSaveMsg(''), 3000);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('resume', file);
        setUploadingResume(true);
        try {
            await api.post('/students/profile/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSaveMsg('Resume uploaded successfully!');
            fetchProfile();
        } catch (error) {
            setSaveMsg('Resume upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploadingResume(false);
            setTimeout(() => setSaveMsg(''), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10rem', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#F8FAFC', minHeight: '80vh' }}>
                <div style={{ width: '60px', height: '60px', border: '5px solid #E2E8F0', borderTop: '5px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s ease-in-out infinite' }} />
                <p style={{ color: '#475569', fontWeight: '700', fontSize: '1.25rem' }}>Loading Cynex AI Profile...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (fetchError || !profileData) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1.5rem', margin: '2rem auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <X size={40} strokeWidth={3} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>Profile Synchronization Failed</h2>
                <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {fetchError || "We encountered a technical issue while retrieving your profile. Our engineers have been notified."}
                </p>
                <button 
                    onClick={fetchProfile}
                    style={{ padding: '1rem 3rem', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    const { user, profile, enrolledCourses, stats } = profileData;

    const statCards = [
        { label: 'Active Courses', value: stats.totalCourses, icon: <BookOpen size={22} />, color: '#4F46E5', bg: '#EEF2FF' },
        { label: 'Submissions', value: stats.totalSubmissions, icon: <FileText size={22} />, color: '#D97706', bg: '#FEF3C7' },
        { label: 'Mock Sessions', value: stats.totalTests, icon: <PlayCircle size={22} />, color: '#0891B2', bg: '#E0F2FE' },
        { label: 'Certificates', value: stats.totalCertificates, icon: <Award size={22} />, color: '#16A34A', bg: '#DCFCE7' },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Main Profile Layout */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                {/* Banner Section */}
                <div style={{
                    height: '240px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
                    borderRadius: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    padding: '2rem'
                }}>
                    <div style={{ opacity: 0.1, position: 'absolute', top: '-10%', right: '-5%' }}>
                        <GraduationCap size={300} />
                    </div>
                    <div style={{ position: 'relative', textAlign: 'center', maxWidth: '600px' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: '500', fontStyle: 'italic', marginBottom: '0.8rem', lineHeight: '1.6' }}>
                            "The beautiful thing about learning is that no one can take it away from you."
                        </p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.9, color: '#E0E7FF', fontWeight: '600' }}>— B.B. King</p>
                    </div>
                </div>

                {/* Profile Header Stats Bar */}
                <div style={{
                    marginTop: '-60px',
                    padding: '0 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem 2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        border: '1px solid #F1F5F9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                            {/* Overlapping Avatar */}
                            <div style={{ position: 'relative', width: '130px', height: '130px', marginTop: '-80px' }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    backgroundColor: 'white', border: '5px solid white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '3.5rem', fontWeight: 'bold', overflow: 'hidden',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                }}>
                                    {user.profile_photo ? (
                                        <img 
                                            src={`${UPLOADS_URL}${user.profile_photo}`} 
                                            alt={user.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%', height: '100%', backgroundColor: 'var(--primary)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {(user.name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <label style={{
                                    position: 'absolute', bottom: '8px', right: '8px',
                                    backgroundColor: 'var(--secondary)', color: 'white',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <Edit3 size={16} />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                        onChange={handlePhotoChange} 
                                        disabled={uploadingPhoto}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#1E293B', margin: 0, letterSpacing: '-0.025em' }}>{user.name}</h1>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                    {/* Email and Batch */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748B', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Mail size={16} color="#94A3B8" /> {user.email}
                                        </div>
                                        <span style={{ height: '4px', width: '4px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></span>
                                        <span style={{ 
                                            backgroundColor: '#F0F9FF', color: '#0369A1', 
                                            padding: '0.2rem 0.6rem', borderRadius: '6px', 
                                            fontWeight: '700', fontSize: '0.75rem',
                                            border: '1px solid #E0F2FE'
                                        }}>
                                            {profile.batch_name || 'batch 1'}
                                        </span>
                                    </div>

                                    <span style={{ height: '20px', width: '1px', backgroundColor: '#E2E8F0', margin: '0 0.5rem' }}></span>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {!editing ? (
                                            <>
                                                <button
                                                    onClick={() => {}} 
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.5rem 1rem', backgroundColor: '#F8FAFC',
                                                        color: '#475569', border: '1px solid #E2E8F0', borderRadius: '0.75rem',
                                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <PlayCircle size={14} /> View Profile
                                                </button>
                                                <button
                                                    onClick={() => window.open(profile.resume_link, '_blank')}
                                                    disabled={!profile.resume_link}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.5rem 1rem', backgroundColor: '#F8FAFC',
                                                        color: '#475569', border: '1px solid #E2E8F0', borderRadius: '0.75rem',
                                                        cursor: profile.resume_link ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '0.85rem',
                                                        opacity: profile.resume_link ? 1 : 0.6
                                                    }}
                                                >
                                                    <FileText size={14} /> Resume
                                                </button>
                                                <button
                                                    onClick={() => setEditing(true)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.5rem 1.25rem', backgroundColor: 'var(--primary)',
                                                        color: 'white', border: 'none', borderRadius: '0.75rem',
                                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                                    }}
                                                >
                                                    <Edit3 size={14} /> Edit Profile
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setEditing(false)}
                                                    style={{
                                                        padding: '0.5rem 1rem', backgroundColor: '#F8FAFC',
                                                        color: '#475569', border: '1px solid #E2E8F0',
                                                        borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    style={{
                                                        padding: '0.5rem 1.25rem', backgroundColor: 'var(--secondary)',
                                                        color: 'white', border: 'none', borderRadius: '0.75rem',
                                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                                    }}
                                                >
                                                    {saving ? 'Updating...' : 'Update Profile'}
                                                </button>
                                            </>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                    {saveMsg && (
                        <div style={{
                            padding: '1rem', borderRadius: '0.75rem',
                            backgroundColor: saveMsg.includes('failed') || saveMsg.includes('Failed') ? '#FEF2F2' : '#F0FDF4',
                            color: saveMsg.includes('failed') || saveMsg.includes('Failed') ? '#DC2626' : '#16A34A',
                            border: `1px solid ${saveMsg.includes('failed') || saveMsg.includes('Failed') ? '#FEE2E2' : '#DCFCE7'}`,
                            display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <CheckCircle size={18} /> {saveMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Personal Details Card */}
                    <Card style={{ padding: '2rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={20} color="#10B981" />
                                    Personal Details
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Primary identity and contact information</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: '#DCFCE7' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditing(true)}
                                title="Edit Personal Details"
                                style={{ 
                                    width: '48px', height: '48px', backgroundColor: '#F0FDF4', color: '#16A34A', 
                                    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Edit3 size={22} />
                            </motion.button>
                        </div>

                        {editing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { label: 'Full Name', key: 'name', type: 'text', icon: <User size={16} /> },
                                    { label: 'Phone Number', key: 'phone', type: 'tel', icon: <Phone size={16} /> },
                                    { label: 'Date of Birth', key: 'dob', type: 'date', icon: <Calendar size={16} /> },
                                    { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'], icon: <Users size={16} /> },
                                    { label: 'Current Address', key: 'address', type: 'text', icon: <MapPin size={16} /> },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                            {field.icon} {field.label}
                                        </label>
                                        {field.type === 'select' ? (
                                            <select
                                                value={editForm[field.key]}
                                                onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                style={{ width: '100%', padding: '0.875rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', outline: 'none', backgroundColor: '#F8FAFC', fontSize: '0.95rem' }}
                                            >
                                                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={editForm[field.key] || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                style={{ width: '100%', padding: '0.875rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', outline: 'none', backgroundColor: '#F8FAFC', fontSize: '0.95rem' }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
                                {[
                                    { label: 'FULL NAME', value: user.name, icon: <User size={18} /> },
                                    { label: 'EMAIL ADDRESS', value: user.email, icon: <Mail size={18} /> },
                                    { label: 'STUDENT PHONE', value: profile.phone || 'Not provided', icon: <Phone size={18} /> },
                                    { label: 'DATE OF BIRTH', value: profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not set', icon: <Calendar size={18} /> },
                                    { label: 'GENDER', value: profile.gender || 'Not specified', icon: <Users size={18} /> },
                                    { label: 'CURRENT LOCATION', value: profile.address || 'Not set', icon: <MapPin size={18} /> },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '44px', height: '44px', backgroundColor: '#F8FAFC', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F1F5F9' }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>{item.label}</p>
                                            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334155' }}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Education Card */}
                    <Card style={{ padding: '2rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <GraduationCap size={20} color="#6366F1" />
                                    Academic Profile
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Educational background and qualifications</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: '#DBEAFE' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditing(true)}
                                title="Edit Academic Profile"
                                style={{ 
                                    width: '48px', height: '48px', backgroundColor: '#EFF6FF', color: '#2563EB', 
                                    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Edit3 size={22} />
                            </motion.button>
                        </div>

                        {editing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { label: 'University / Institution', key: 'institution', type: 'text', icon: <Users size={16} /> },
                                    { label: 'Highest Qualification', key: 'highest_qualification', type: 'text', icon: <Award size={16} /> },
                                    { label: 'Year of Passing', key: 'year_of_passing', type: 'text', icon: <Calendar size={16} /> },
                                    { label: 'External Resume URL', key: 'resume_link', type: 'text', icon: <FileText size={16} /> },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                                            {field.icon} {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={editForm[field.key] || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                            style={{ width: '100%', padding: '0.875rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', outline: 'none', backgroundColor: '#F8FAFC', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
                                {[
                                    { label: 'INSTITUTION', value: profile.institution || 'Not updated', icon: <Users size={18} /> },
                                    { label: 'HIGHEST QUALIFICATION', value: profile.highest_qualification || 'Not updated', icon: <Award size={18} /> },
                                    { label: 'YEAR OF PASSING', value: profile.year_of_passing || 'Not set', icon: <Calendar size={18} /> },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '44px', height: '44px', backgroundColor: '#F8FAFC', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F1F5F9' }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>{item.label}</p>
                                            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334155' }}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                    {/* Skills & Experience Card */}
                    <Card style={{ padding: '2rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={20} color="#7C3AED" />
                                    Skills & Experience
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Professional toolkit and career highlights</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: '#F5F3FF' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditing(true)}
                                title="Edit Skills & Experience"
                                style={{ 
                                    width: '48px', height: '48px', backgroundColor: '#F5F3FF', color: '#7C3AED', 
                                    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Edit3 size={22} />
                            </motion.button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Key Skills</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
                                    {editForm.skills && editForm.skills.length > 0 ? editForm.skills.map(skill => (
                                        <span key={skill} style={{ 
                                            padding: '0.5rem 1rem', backgroundColor: '#F3F4F6', 
                                            color: '#374151', borderRadius: '2rem', fontSize: '0.875rem', 
                                            fontWeight: '600', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}>
                                            {skill}
                                            <X size={14} style={{ cursor: 'pointer', color: '#EF4444' }} onClick={() => handleUpdateSkills(editForm.skills.filter(s => s !== skill))} />
                                        </span>
                                    )) : <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>No skills added yet</span>}
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.2rem', borderRadius: '2rem', border: '1px dashed #CBD5E1' }}>
                                        <input 
                                            type="text" 
                                            value={newSkill} 
                                            onChange={(e) => setNewSkill(e.target.value)} 
                                            placeholder="Type a skill..." 
                                            style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.3rem 0.5rem', fontSize: '0.85rem', width: '120px' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newSkill.trim() !== '') {
                                                    e.preventDefault();
                                                    if (!editForm.skills.includes(newSkill.trim())) {
                                                        handleUpdateSkills([...editForm.skills, newSkill.trim()]);
                                                    }
                                                    setNewSkill('');
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                if (newSkill.trim() !== '' && !editForm.skills.includes(newSkill.trim())) {
                                                    handleUpdateSkills([...editForm.skills, newSkill.trim()]);
                                                    setNewSkill('');
                                                }
                                            }}
                                            style={{ padding: '0.3rem 0.6rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Recent Experience</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #E5E7EB' }}>
                                        <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>AI Developer Intern</p>
                                        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Cynex AI Project • 2024</p>
                                    </div>
                                    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #E5E7EB' }}>
                                        <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>Freelance Web Dev</p>
                                        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Self-employed • 2023</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
                        <h3 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <PlayCircle size={20} color="var(--primary)" /> Learning Progress
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Active Courses', value: stats.totalCourses, icon: <BookOpen size={18} />, color: '#4F46E5', bg: '#EEF2FF', progress: 75 },
                                { label: 'Assigned Work', value: stats.totalSubmissions, icon: <FileText size={18} />, color: '#D97706', bg: '#FEF3C7', progress: 60 },
                                { label: 'Mock Assessments', value: stats.totalTests, icon: <PlayCircle size={18} />, color: '#0891B2', bg: '#E0F2FE', progress: 45 },
                                { label: 'Verified Certs', value: stats.totalCertificates, icon: <Award size={18} />, color: '#16A34A', bg: '#DCFCE7', progress: 90 },
                            ].map(stat => (
                                <div key={stat.label} style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: stat.bg, color: stat.color }}>{stat.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>{stat.label}</p>
                                            <p style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1E293B' }}>{stat.value}</p>
                                        </div>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${stat.progress}%`, backgroundColor: stat.color, borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <FileText size={18} color="#64748B" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Resume / CV</p>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1E293B' }}>{profile.resume_link ? 'Resume Uploaded' : 'Not Uploaded'}</span>
                                    </div>
                                    {profile.resume_link ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <a href={profile.resume_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', textDecoration: 'none' }}>
                                                <PlayCircle size={14} /> View
                                            </a>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                                <Edit3 size={14} /> Change
                                                <input type="file" onChange={handleResumeUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx" />
                                            </label>
                                        </div>
                                    ) : (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#4F46E5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                                            <input type="file" onChange={handleResumeUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx" disabled={uploadingResume} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '1.75rem', borderRadius: '1.25rem', textAlign: 'center', background: 'linear-gradient(to bottom, #FFFFFF, #F8FAFC)' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '4px solid #DCFCE7' }}>
                            <CheckCircle size={30} />
                        </div>
                        <h3 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '0.5rem' }}>Verified Student</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Your profile is verified. You have full access to all Cynex AI resources.
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px dashed #E2E8F0' }}>
                            Student since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
