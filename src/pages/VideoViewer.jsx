import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize, Play, Pause, Volume2 } from 'lucide-react';
import Button from '../components/Button';

const VideoViewer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const videoUrl = searchParams.get('url');
    const backUrl = searchParams.get('back') || '/';

    if (!videoUrl) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No video URL provided.</p>
                <Button onClick={() => navigate(backUrl)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#000', 
            color: '#fff', 
            display: 'flex', 
            flexDirection: 'column' 
        }}>
            {/* Header / Nav */}
            <div style={{ 
                padding: '1rem 2rem', 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(backUrl)}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#fff', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <ArrowLeft size={20} /> Back to Portal
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>|</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Video Verification Player</span>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {videoUrl.split('/').pop()}
                </div>
            </div>

            {/* Video Container */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '5rem 2rem 2rem' 
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '1200px', 
                    aspectRatio: '16 / 9', 
                    borderRadius: '1rem', 
                    overflow: 'hidden', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    backgroundColor: '#111',
                    position: 'relative'
                }}>
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                </div>
            </div>

            {/* Hint Footer */}
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: 'rgba(255,255,255,0.4)', 
                fontSize: '0.75rem' 
            }}>
                You are viewing a verification video. Use the controls above to navigate back.
            </div>
        </div>
    );
};

export default VideoViewer;
