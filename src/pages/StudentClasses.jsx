import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import { Video, Calendar, BookOpen, PlayCircle, ExternalLink, Search, Filter } from 'lucide-react';

const StudentClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [activeVideo, setActiveVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/students/classes');
            setClasses(res.data);
            if (res.data.length > 0) {
                setActiveVideo(res.data[0]);
                // Default to the first course available
                setSelectedCourse(res.data[0].course_title || 'all');
            }
        } catch (error) {
            console.error('Failed to fetch classes', error);
        } finally {
            setLoading(false);
        }
    };

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/live\/|\/shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getYoutubeThumbnail = (url) => {
        const id = getYoutubeId(url);
        return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    };

    // Unique courses for filter
    const courses = ['all', ...new Set(classes.map(c => c.course_title).filter(Boolean))];

    const filtered = classes.filter(cls => {
        const matchesSearch = cls.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.course_title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse = selectedCourse === 'all' || cls.course_title === selectedCourse;
        return matchesSearch && matchesCourse;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid var(--primary-light)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-light)' }}>Loading your classes...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    My Classes
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Watch recorded sessions from your enrolled courses.
                </p>
            </div>

            {classes.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    backgroundColor: 'white', borderRadius: '1rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', backgroundColor: 'var(--primary-light)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Video size={36} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.75rem' }}>
                        No Classes Yet
                    </h3>
                    <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto' }}>
                        Your instructor hasn't added any class sessions yet. Check back soon or visit "My Courses" to explore your enrolled courses.
                    </p>
                </div>
            ) : (
                <>
                    {/* Video Modal (Popup) */}
                    {isModalOpen && activeVideo && (
                        <div style={{
                            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
                            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem', backdropFilter: 'blur(8px)'
                        }}>
                            <div style={{ width: '100%', maxWidth: '1000px', position: 'relative' }}>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        position: 'absolute', top: '-3rem', right: '0',
                                        backgroundColor: 'white', border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.2rem', color: '#000'
                                    }}
                                >
                                    ✕
                                </button>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
                                    <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                        src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.video_url)}?rel=0&autoplay=1&origin=${window.location.origin}&enablejsapi=1`}
                                        title={activeVideo.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                                <div style={{ marginTop: '1.5rem', color: 'white', textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeVideo.title}</h3>
                                    <p style={{ opacity: 0.7 }}>{activeVideo.course_title}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Player + Sidebar Layout */}
                    {activeVideo && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* Main Player */}
                            <div>
                                <Card style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-premium)' }}>
                                    {getYoutubeId(activeVideo.video_url) ? (
                                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, backgroundColor: '#000' }}>
                                            <iframe
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.video_url)}?rel=0&origin=${window.location.origin}&enablejsapi=1`}
                                                title={activeVideo.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            height: '360px', backgroundColor: '#111', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem'
                                        }}>
                                            <Video size={48} color="#666" />
                                            <p style={{ color: '#666' }}>No video available</p>
                                            {activeVideo.video_url && (
                                                <a href={activeVideo.video_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#4F46E5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <ExternalLink size={16} /> Open Link
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ padding: '1.25rem', backgroundColor: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase',
                                                        color: 'var(--primary)', backgroundColor: 'var(--primary-light)',
                                                        padding: '0.2rem 0.6rem', borderRadius: '9999px'
                                                    }}>
                                                        {activeVideo.course_title}
                                                    </span>
                                                </div>
                                                <h2 style={{ fontSize: '1.375rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                                    {activeVideo.title}
                                                </h2>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Calendar size={14} />
                                                        {activeVideo.schedule ? new Date(activeVideo.schedule).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const id = getYoutubeId(activeVideo.video_url);
                                                    if (id) {
                                                        const width = 900;
                                                        const height = 500;
                                                        const left = (window.screen.width / 2) - (width / 2);
                                                        const top = (window.screen.height / 2) - (height / 2);
                                                        window.open(
                                                            `https://www.youtube.com/watch?v=${id}`, 
                                                            'YouTubePlayer', 
                                                            `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no`
                                                        );
                                                    }
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    backgroundColor: '#0F172A', color: 'white',
                                                    border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.6rem 1rem',
                                                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                                    fontSize: '0.9rem'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0F172A'}
                                            >
                                                🚀 Launch Floating Player
                                            </button>
                                            <button 
                                                onClick={() => setIsModalOpen(true)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    backgroundColor: 'var(--primary)', color: 'white',
                                                    border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1rem',
                                                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                                    fontSize: '0.9rem'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                📺 Play in Modal
                                            </button>
                                        </div>

                                        {/* Private Video Access Instructions */}
                                        <div style={{
                                            marginTop: '1.5rem', padding: '1rem',
                                            backgroundColor: '#F0F9FF', borderRadius: '0.75rem',
                                            border: '1px solid #BAE6FD', display: 'flex', gap: '1rem',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div style={{ fontSize: '1.2rem' }}>⚠️</div>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0369A1', marginBottom: '0.25rem' }}>
                                                    Policy & Access Help
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: '#075985', lineHeight: '1.5' }}>
                                                    If the video says "<b>Playback disabled by owner</b>", YouTube is blocking the "in-page" view. Use the <b>Launch Floating Player</b> button above to bypass this.
                                                    <br/><br/>
                                                    If it says "<b>Private</b>", ensure you are logged in to the correct YouTube account:
                                                    <br/>
                                                    <button 
                                                        onClick={() => window.open('https://accounts.google.com/ServiceLogin?service=youtube', '_blank', 'width=500,height=600')}
                                                        style={{ 
                                                            marginTop: '0.5rem', backgroundColor: '#0369A1', color: 'white', 
                                                            border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', 
                                                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' 
                                                        }}
                                                    >
                                                        Login to YouTube
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Playlist Sidebar */}
                            <div>
                                <Card style={{ padding: '0', maxHeight: '520px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'var(--shadow-premium)' }}>
                                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <h3 style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '0.95rem' }}>
                                            Playlist ({filtered.length} items)
                                        </h3>
                                    </div>
                                    <div style={{ overflowY: 'auto', flex: 1 }}>
                                        {filtered.map((cls, index) => (
                                            <div
                                                key={cls.unique_id}
                                                onClick={() => setActiveVideo(cls)}
                                                style={{
                                                    display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
                                                    cursor: 'pointer', alignItems: 'flex-start',
                                                    backgroundColor: activeVideo?.unique_id === cls.unique_id ? 'var(--primary-light)' : 'transparent',
                                                    borderLeft: activeVideo?.unique_id === cls.unique_id ? '3px solid var(--primary)' : '3px solid transparent',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ position: 'relative', flexShrink: 0, width: '72px', height: '48px' }}>
                                                    {getYoutubeThumbnail(cls.video_url) ? (
                                                        <img src={getYoutubeThumbnail(cls.video_url)} alt={cls.title}
                                                            style={{ width: '72px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{
                                                            width: '72px', height: '48px', backgroundColor: '#e0e7ff',
                                                            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <PlayCircle size={20} color="#4F46E5" />
                                                        </div>
                                                    )}
                                                    {activeVideo?.unique_id === cls.unique_id && (
                                                        <div style={{
                                                            position: 'absolute', inset: 0, backgroundColor: 'rgba(79, 70, 229, 0.6)',
                                                            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <PlayCircle size={20} color="white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        fontSize: '0.8rem', fontWeight: '600',
                                                        color: activeVideo?.unique_id === cls.unique_id ? 'var(--primary)' : 'var(--text)',
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                    }}>
                                                        {cls.title}
                                                    </p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                                        {cls.course_title}
                                                    </p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Calendar size={10} />
                                                        {cls.schedule ? new Date(cls.schedule).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )
                    }

                    {/* Search & Filter */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Search classes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', paddingLeft: '2.5rem', padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                                    border: '1px solid var(--border-color)', borderRadius: '0.5rem',
                                    fontSize: '0.875rem', outline: 'none', backgroundColor: 'white',
                                    color: 'var(--text)', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Filter size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                            <select
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                                style={{
                                    paddingLeft: '2.5rem', padding: '0.625rem 2rem 0.625rem 2.5rem',
                                    border: '1px solid var(--border-color)', borderRadius: '0.5rem',
                                    fontSize: '0.875rem', backgroundColor: 'white', color: 'var(--text)',
                                    cursor: 'pointer', outline: 'none', appearance: 'none'
                                }}
                            >
                                {courses.map(c => (
                                    <option key={c} value={c}>{c === 'all' ? 'All Courses' : c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* All Classes Grid */}
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '1rem' }}>
                        All Classes & Videos
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {filtered.map(cls => (
                            <Card
                                key={cls.unique_id}
                                onClick={() => { 
                                    setActiveVideo(cls); 
                                    setSelectedCourse(cls.course_title);
                                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                }}
                                style={{
                                    cursor: 'pointer', padding: '0', overflow: 'hidden',
                                    border: activeVideo?.unique_id === cls.unique_id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                    transition: 'all 0.2s',
                                    transform: 'translateY(0)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: '#111' }}>
                                    {getYoutubeThumbnail(cls.video_url) ? (
                                        <img src={getYoutubeThumbnail(cls.video_url)} alt={cls.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <PlayCircle size={36} color="#4F46E5" />
                                        </div>
                                    )}
                                    {activeVideo?.unique_id === cls.unique_id && (
                                        <div style={{
                                            position: 'absolute', inset: 0, backgroundColor: 'rgba(79,70,229,0.5)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <div style={{
                                                backgroundColor: 'white', borderRadius: '50%',
                                                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <PlayCircle size={24} color="var(--primary)" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                            color: 'var(--primary)', backgroundColor: 'var(--primary-light)',
                                            padding: '0.15rem 0.5rem', borderRadius: '9999px'
                                        }}>
                                            {cls.course_title}
                                        </span>
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                        {cls.title}
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                        <Calendar size={12} />
                                        {cls.schedule ? new Date(cls.schedule).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filtered.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                                <BookOpen size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                <p>No classes match your search.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div >
    );
};

export default StudentClasses;
