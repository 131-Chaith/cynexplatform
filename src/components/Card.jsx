import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
    children, 
    className = '', 
    glass = false, 
    hover = true,
    padding = '1.5rem',
    ...props 
}) => {
    const isDark = className.includes('dark');
    
    return (
        <motion.div
            whileHover={hover ? { 
                y: -8, 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                borderColor: 'var(--primary)',
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            } : {}}
            style={{
                backgroundColor: glass ? 'rgba(255, 255, 255, 0.8)' : 'var(--white)',
                backdropFilter: glass ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: glass ? 'blur(12px)' : 'none',
                borderRadius: '1.5rem',
                border: '1px solid var(--border-color)',
                padding: padding,
                position: 'relative',
                overflow: 'hidden',
                ...props.style
            }}
            className={`${className} ${glass ? (isDark ? 'glass-dark' : 'glass') : ''}`}
            {...props}
        >
            {/* Subtle light effect top-right for premium feel */}
            {glass && (
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(239, 246, 255, 0.5) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0
                }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
                {children}
            </div>
        </motion.div>
    );
};

export default Card;
