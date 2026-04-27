import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    className = '',
    isLoading = false,
    disabled = false,
    style: customStyle = {},
    ...props
}) => {
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.75rem',
        fontWeight: '700',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        letterSpacing: '0.01em',
        fontFamily: 'inherit',
        gap: '0.5rem'
    };

    const variants = {
        primary: {
            background: 'var(--primary-gradient)',
            color: 'white',
            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
        },
        secondary: {
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
        },
        danger: {
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.3)'
        },
        outline: {
            background: 'transparent',
            border: '2px solid rgba(0,0,0,0.05)',
            color: 'var(--text)',
            boxShadow: 'none'
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text)',
            boxShadow: 'none'
        },
        glass: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
        }
    };

    const sizes = {
        small: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
        medium: { padding: '0.75rem 1.5rem', fontSize: '0.875rem' },
        large: { padding: '1rem 2rem', fontSize: '1rem' }
    };

    const currentVariant = variants[variant] || variants.primary;
    const currentSize = sizes[size] || sizes.medium;

    return (
        <motion.button
            whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: -2 }}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
            style={{
                ...baseStyles,
                ...currentVariant,
                ...currentSize,
                ...customStyle,
                opacity: disabled || isLoading ? 0.7 : 1,
                cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                    <span>Processing...</span>
                </div>
            ) : children}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.button>
    );
};

export default Button;
