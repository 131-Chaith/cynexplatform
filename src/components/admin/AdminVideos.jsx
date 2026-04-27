import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Plus, Edit2, Trash2, X, Play, Youtube } from 'lucide-react';
import YoutubePlaylistImport from './YoutubePlaylistImport';

const AdminVideos = () => {
    const [videos, setVideos] = useState([]);
    const [courses, setCourses] = useState([]);
    const [allModules, setAllModules] = useState([]); // For lookup (names)
    const [filterModules, setFilterModules] = useState([]); // For filter dropdown
    const [formModules, setFormModules] = useState([]); // For form dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [playingVideoId, setPlayingVideoId] = useState(null);

    // Filters
    const [filterCourseId, setFilterCourseId] = useState('');
    const [filterModuleId, setFilterModuleId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        youtube_url: '',
        course_id: '',
        module_id: '',
        duration: '',
        order_index: 0
    });

    // Initial Load: Videos, Courses, and All Modules (for lookup)
    useEffect(() => {
        fetchVideos();
        fetchCoursesAndAllModules();
    }, []);

    // Fetch Videos when filters change
    useEffect(() => {
        fetchVideos();
    }, [filterCourseId, filterModuleId]);

    // Fetch Filter Modules when Filter Course changes
    useEffect(() => {
        if (filterCourseId) {
            fetchModulesForCourse(filterCourseId, setFilterModules);
        } else {
            setFilterModules(allModules);
        }
    }, [filterCourseId, allModules]);

    // Fetch Form Modules when Form Course changes
    useEffect(() => {
        if (formData.course_id) {
            fetchModulesForCourse(formData.course_id, setFormModules);
        } else {
            // Optional: You might want to allow selecting any module if no course is selected in the form too
            // But usually for data integrity in the form, it's better to enforce course -> module
            // However, to address user confusion, let's allow it but maybe warn or just show all.
            // Let's keep form strict for now, or maybe allow it? 
            // The user said "no drop down", likely referring to the filter. 
            // But if they meant the form, we should probably allow it there too?
            // "There is no drop down for the modules over there in videos section"
            // Let's enable it in the form too.
            setFormModules(allModules);
        }
    }, [formData.course_id, allModules]);

    const fetchVideos = async () => {
        try {
            setError(null);
            let url = '/videos';
            const params = new URLSearchParams();
            if (filterCourseId) params.append('course_id', filterCourseId);
            if (filterModuleId) params.append('module_id', filterModuleId);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await api.get(url);
            setVideos(res.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch videos", error);
            setError(error.response?.data?.message || error.message || "Failed to load videos");
            setLoading(false);
        }
    };

    const fetchCoursesAndAllModules = async () => {
        try {
            const [coursesRes, modulesRes] = await Promise.all([
                api.get('/courses'),
                api.get('/modules')
            ]);
            setCourses(coursesRes.data || []);
            setAllModules(modulesRes.data || []);
        } catch (error) {
            console.error("Failed to fetch courses/modules", error);
        }
    };

    const fetchModulesForCourse = async (courseId, setState) => {
        try {
            const res = await api.get(`/courses/${courseId}/modules`);
            setState(res.data || []);
        } catch (error) {
            console.error(`Failed to fetch modules for course ${courseId}`, error);
            setState([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVideo) {
                await api.put(`/videos/${editingVideo.id}`, formData);
                alert("Video Updated Successfully!");
            } else {
                await api.post('/videos', formData);
                alert("Video Created Successfully!");
            }
            fetchVideos();
            setShowModal(false);
            setEditingVideo(null);
            resetForm();
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to save video";
            alert(errorMsg);
        }
    };

    const handleEdit = (video) => {
        setEditingVideo(video);
        setFormData({
            title: video.title,
            description: video.description || '',
            youtube_url: video.youtube_url,
            course_id: video.course_id || '',
            module_id: video.module_id || '',
            duration: video.duration || '',
            order_index: video.order_index || 0
        });
        // Form modules will automatically update via useEffect when course_id is set
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this video?")) return;
        try {
            await api.delete(`/videos/${id}`);
            alert("Video Deleted Successfully!");
            fetchVideos();
        } catch (error) {
            alert("Failed to delete video");
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            youtube_url: '',
            course_id: '',
            module_id: '',
            duration: '',
            order_index: 0
        });
    };

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/live\/|\/shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getCourseName = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : 'No Course';
    };

    const getModuleName = (moduleId) => {
        const module = allModules.find(m => m.id === moduleId);
        return module ? module.title : 'No Module';
    };

    const filteredVideos = videos.filter(video =>
        video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                        Videos Management
                    </h1>
                    <p style={{ color: 'var(--text-light)' }}>
                        Manage educational videos and learning content.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowImportModal(true)}
                        style={{
                            padding: '0.6rem 1.1rem',
                            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '0.625rem',
                            color: '#f87171',
                            fontWeight: '800',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            letterSpacing: '0.02em'
                        }}
                    >
                        <Youtube size={16} /> Import Playlist
                    </button>
                    <Button onClick={() => { setEditingVideo(null); resetForm(); setShowModal(true); }}>
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Video
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: '1', minWidth: '200px' }}
                />
                <select
                    value={filterCourseId}
                    onChange={(e) => { setFilterCourseId(e.target.value); setFilterModuleId(''); }}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', minWidth: '150px' }}
                >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                </select>
                <select
                    value={filterModuleId}
                    onChange={(e) => setFilterModuleId(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', minWidth: '150px' }}
                // Removed disabled attribute
                >
                    <option value="">All Modules</option>
                    {filterModules.map(module => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                </select>
            </div>

            {/* Videos Grid */}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '0.5rem',
                    color: '#991b1b'
                }}>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Error Loading Videos</h3>
                    <p>{error}</p>
                    <Button onClick={fetchVideos} style={{ marginTop: '1rem' }}>
                        Retry
                    </Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredVideos.map(video => {
                        const videoId = getYouTubeVideoId(video.youtube_url);
                        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
                        const isPlaying = playingVideoId === video.id;

                        return (
                            <Card key={video.id}>
                                {videoId && (
                                    <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#000', paddingTop: '56.25%' }}>
                                        {isPlaying ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                                title={video.title}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <>
                                                <img
                                                    src={thumbnail}
                                                    alt={video.title}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    borderRadius: '50%',
                                                    padding: '1rem',
                                                    cursor: 'pointer'
                                                }}
                                                    onClick={() => setPlayingVideoId(video.id)}
                                                >
                                                    <Play size={32} color="white" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)', flex: 1 }}>
                                        {video.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(video)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '0.25rem' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(video.id)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {video.description && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                        {video.description.length > 100 ? video.description.substring(0, 100) + '...' : video.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                    {video.course_id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: '600' }}>Course:</span>
                                            <span>{getCourseName(video.course_id)}</span>
                                        </div>
                                    )}
                                    {video.module_id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: '600' }}>Module:</span>
                                            <span>{getModuleName(video.module_id)}</span>
                                        </div>
                                    )}
                                    {video.duration && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: '600' }}>Duration:</span>
                                            <span>{video.duration}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    {filteredVideos.length === 0 && (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                            No videos found. Click "Add Video" to create one.
                        </p>
                    )}
                </div>
            )}

            {/* Add/Edit Video Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    overflowY: 'auto', padding: '1rem'
                }}>
                    <Card style={{ width: '100%', maxWidth: '600px', position: 'relative', margin: 'auto' }}>
                        <button
                            onClick={() => { setShowModal(false); setEditingVideo(null); resetForm(); }}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {editingVideo ? 'Edit Video' : 'Add New Video'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Video Title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g., Introduction to React Hooks"
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the video content..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.875rem',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                            <Input
                                label="YouTube URL"
                                value={formData.youtube_url}
                                onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
                                required
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Course (Optional)
                                    </label>
                                    <select
                                        value={formData.course_id}
                                        onChange={e => setFormData({ ...formData, course_id: e.target.value, module_id: '' })}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>{course.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Module (Optional)
                                    </label>
                                    <select
                                        value={formData.module_id}
                                        onChange={e => setFormData({ ...formData, module_id: e.target.value })}
                                        disabled={!formData.course_id}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <option value="">Select Module</option>
                                        {formModules.map(module => (
                                            <option key={module.id} value={module.id}>{module.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Duration (Optional)"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g., 15:30"
                                />
                                <Input
                                    label="Order Index"
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                            </div>
                            <Button type="submit" style={{ marginTop: '1rem' }}>
                                {editingVideo ? 'Update Video' : 'Create Video'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* YouTube Playlist Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <YoutubePlaylistImport
                        courses={courses}
                        modules={allModules}
                        onImportComplete={() => { fetchVideos(); setShowImportModal(false); }}
                        onClose={() => setShowImportModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminVideos;
