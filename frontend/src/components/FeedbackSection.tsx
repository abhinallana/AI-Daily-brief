import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface FeedbackSectionProps {
  userId?: string;
  userEmail?: string;
  isGuest?: boolean;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ userId, userEmail, isGuest }) => {
  const [category, setCategory] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const requiresEmail = !userId || isGuest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

    if (requiresEmail && !email.trim()) {
      setStatus('error');
      setErrorMessage('Please provide an email address.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: !isGuest && userId ? userId : null,
            email: !isGuest && userEmail ? userEmail : email.trim(),
            category,
            message: message.trim(),
            page: window.location.pathname
          }
        ]);

      if (error) throw error;

      setStatus('success');
      setMessage('');
      if (requiresEmail) setEmail('');
      setCategory('General Feedback');

      // Hide success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setStatus('error');
      setErrorMessage('Something went wrong while submitting your feedback. Please try again.');
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '800px', 
      margin: '40px auto 80px auto', 
      padding: '0 20px', 
      boxSizing: 'border-box' 
    }}>
      <div style={{ 
        background: 'var(--panel-bg)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '40px',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-color)', marginBottom: '8px' }}>
            Help Us Improve OpsiAI
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', maxWidth: '600px', margin: '0 auto' }}>
            We're continuously improving OpsiAI. Share your ideas, report bugs, or suggest new features. Every submission helps us build a better intelligence platform.
          </p>
        </div>

        {status === 'success' ? (
          <div style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.05)', 
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ color: 'var(--success)', fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>
              Thank you for your feedback!
            </h3>
            <p style={{ color: 'var(--text-color)', fontSize: '14px', margin: 0 }}>
              Your suggestions help us improve OpsiAI.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {status === 'error' && (
              <div style={{ 
                backgroundColor: 'rgba(255, 90, 95, 0.05)', 
                borderLeft: '4px solid var(--strategic)', 
                padding: '12px', 
                borderRadius: '8px' 
              }}>
                <p style={{ color: 'var(--strategic)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  ⚠️ {errorMessage}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="feedback-category" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Category
              </label>
              <select 
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border)', 
                  background: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="General Feedback">General Feedback</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
              </select>
            </div>

            {requiresEmail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="feedback-email" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Email Address *
                </label>
                <input 
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border)', 
                    background: 'var(--bg-color)', 
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="feedback-message" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Feedback Message *
                </label>
                <span style={{ fontSize: '11px', color: message.length > 1000 ? 'var(--strategic)' : 'var(--text-muted)' }}>
                  {message.length} / 1000
                </span>
              </div>
              <textarea 
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.substring(0, 1000))}
                placeholder="Tell us what you think or how we can improve OpsiAI..."
                required
                maxLength={1000}
                style={{ 
                  padding: '16px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border)', 
                  background: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  fontSize: '14px',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={status === 'submitting' || !message.trim()}
              style={{ 
                height: '48px', 
                borderRadius: '10px', 
                fontSize: '15px', 
                fontWeight: 700,
                marginTop: '10px'
              }}
            >
              {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
