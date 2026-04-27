import React from 'react';

const Input = ({ label, type = 'text', textarea = false, ...props }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{label}</label>}
            {textarea ? (
                <textarea
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '100px',
                        fontFamily: 'inherit'
                    }}
                    {...props}
                />
            ) : (
                <input
                    type={type}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    {...props}
                />
            )}
        </div>
    );
};

export default Input;
