import React from 'react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose, onSubscribe }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '460px', padding: '30px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📬</span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Get Daily AI Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Receive one concise AI Intelligence Report every day.</p>
        </div>

        <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> Personalized content based on your topics
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> Strategic insights separated from noise
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> Detailed "Why It Matters" explanations
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> Over 5 hours of reading time saved weekly
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> Unsubscribe anytime with one-click
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn-outline" 
            onClick={onClose}
            style={{ flex: 1, padding: '12px' }}
          >
            Maybe Later
          </button>
          <button 
            className="btn-primary" 
            onClick={onSubscribe}
            style={{ flex: 1, padding: '12px' }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};
