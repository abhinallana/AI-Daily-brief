import React, { useEffect } from 'react';

interface GoogleSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSoonModal: React.FC<GoogleSoonModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="modal-overlay"
      style={{ 
        zIndex: 1200, 
        backdropFilter: 'blur(8px)', 
        backgroundColor: 'rgba(10, 13, 20, 0.7)',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '30px', 
          borderRadius: '12px',
          background: 'var(--panel-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <button 
          className="modal-close" 
          onClick={onClose}
          style={{ top: '16px', right: '16px' }}
        >
          &times;
        </button>

        <div style={{ margin: '10px 0 20px 0' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🚧</span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
            Google Sign-In Coming Soon
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', margin: '0 10px' }}>
            We're currently building secure Google Authentication. 
            <br />
            For now, please create an account using your email and password.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={onClose}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '6px', 
            fontWeight: 700, 
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
