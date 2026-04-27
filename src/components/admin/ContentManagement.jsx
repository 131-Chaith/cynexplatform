import React, { useState } from 'react';
import AdminCourses from './AdminCourses';
import AdminVideos from './AdminVideos';

const ContentManagement = () => {
    const [activeTab, setActiveTab] = useState('courses');

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Content Management
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Manage courses, videos, and learning materials.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('courses')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'courses' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-light)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Courses
                </button>

                <button
                    onClick={() => setActiveTab('videos')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'videos' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'videos' ? 'var(--primary)' : 'var(--text-light)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Videos
                </button>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'courses' && <AdminCourses />}

                {activeTab === 'videos' && <AdminVideos />}
            </div>
        </div>
    );
};

export default ContentManagement;

