import React, { useState } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (selectedTopics: string[]) => void;
  firstName?: string;
}

const AVAILABLE_TOPICS = [
  { id: 'OpenAI', name: 'OpenAI', icon: '🤖' },
  { id: 'Anthropic', name: 'Anthropic', icon: '🧠' },
  { id: 'Kubernetes', name: 'Kubernetes', icon: '⚓' },
  { id: 'AWS', name: 'AWS', icon: '☁️' },
  { id: 'DevOps', name: 'DevOps', icon: '⚡' },
  { id: 'AI Agents', name: 'AI Agents', icon: '🦾' },
  { id: 'Python', name: 'Python', icon: '🐍' },
  { id: 'Research Papers', name: 'Research Papers', icon: '📄' }
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onNext, firstName }) => {
  const [selected, setSelected] = useState<string[]>(['OpenAI', 'Kubernetes']);

  if (!isOpen) return null;

  const toggleTopic = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onNext(selected);
  };

  const handleSkip = () => {
    onNext([]);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '500px', padding: '30px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Welcome, {firstName || 'Reader'} 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Let's personalize your AI Intelligence experience.</p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Choose topics of interest</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {AVAILABLE_TOPICS.map(topic => {
              const isSelected = selected.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '30px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-glow)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-color)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'var(--transition)'
                  }}
                >
                  <span>{topic.icon}</span>
                  {topic.name}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleSkip}
            style={{ padding: '10px 20px' }}
          >
            Skip
          </button>
          <button 
            className="btn-primary" 
            onClick={handleNext}
            style={{ padding: '10px 24px' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
