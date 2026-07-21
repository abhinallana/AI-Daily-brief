import React, { useState } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (selectedTopics: string[]) => void;
  firstName?: string;
}

interface Pack {
  id: string;
  name: string;
  icon: string;
  description: string;
  glowColor: string;
  topics: string[];
}

const INTELLIGENCE_PACKS: Pack[] = [
  {
    id: 'ai-engineer',
    name: 'AI Engineer Pack',
    icon: '🧠',
    description: 'LLMs, AI agents, reasoning models, and orchestration frameworks.',
    glowColor: 'rgba(139, 92, 246, 0.4)', // Purple
    topics: [
      'OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 'Mistral AI', 'xAI', 
      'Cohere', 'DeepSeek', 'Perplexity AI', 'Stability AI', 'Hugging Face Blog', 
      'Together AI', 'Fireworks AI', 'LangChain', 'LangGraph', 'CrewAI', 
      'LlamaIndex', 'AutoGen', 'DSPy', 'Haystack', 'OpenRouter', 'Ollama', 
      'MCP', 'GitHub', 'Hugging Face'
    ]
  },
  {
    id: 'devops',
    name: 'DevOps Specialist Pack',
    icon: '⚓',
    description: 'Kubernetes, CNCF pipelines, GitHub Actions, and GitOps tools.',
    glowColor: 'rgba(20, 184, 166, 0.4)', // Teal
    topics: ['Kubernetes', 'CNCF', 'GitHub', 'AWS', 'Google Cloud', 'Azure', 'Cloudflare']
  },
  {
    id: 'cloud',
    name: 'Cloud Architect Pack',
    icon: '☁️',
    description: 'AWS, GCP, Azure, OCI bare metal, and serverless hosting edges.',
    glowColor: 'rgba(59, 130, 246, 0.4)', // Blue
    topics: ['AWS', 'Google Cloud', 'Azure', 'Oracle Cloud', 'Cloudflare', 'DigitalOcean', 'Netlify', 'Kubernetes', 'CNCF']
  },
  {
    id: 'founder',
    name: 'Founder & Investor Pack',
    icon: '📈',
    description: 'AI venture investments, YC launches, seed rounds, and tech strategy.',
    glowColor: 'rgba(245, 158, 11, 0.4)', // Amber/Gold
    topics: [
      'TechCrunch AI', 'YC Blog', 'Andreessen Horowitz', 'Sequoia', 'AI Startup Funding', 
      'OpenAI', 'Anthropic', 'xAI', 'Perplexity AI', 'LangChain', 'CrewAI'
    ]
  },
  {
    id: 'general',
    name: 'General Reader Pack',
    icon: '🌐',
    description: 'A curated mix of the most popular AI, DevOps, and cloud platform news.',
    glowColor: 'rgba(16, 185, 129, 0.4)', // Emerald Green
    topics: ['OpenAI', 'Anthropic', 'Google Gemini', 'Kubernetes', 'AWS', 'TechCrunch AI', 'YC Blog', 'AI Startup Funding', 'Hugging Face', 'GitHub']
  },
  {
    id: 'all',
    name: 'Full Access Pack',
    icon: '✨',
    description: 'Enable all 34 tracked topics for comprehensive cloud and AI news coverage.',
    glowColor: 'rgba(236, 72, 153, 0.4)', // Pink
    topics: [
      'OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 'Mistral AI', 'xAI', 
      'Cohere', 'DeepSeek', 'Perplexity AI', 'Stability AI', 'Hugging Face Blog', 
      'Together AI', 'Fireworks AI', 'LangChain', 'LangGraph', 'CrewAI', 
      'LlamaIndex', 'AutoGen', 'DSPy', 'Haystack', 'OpenRouter', 'Ollama', 
      'MCP', 'Kubernetes', 'CNCF', 'AWS', 'Google Cloud', 'Azure', 
      'Oracle Cloud', 'Cloudflare', 'DigitalOcean', 'Netlify', 'GitHub', 'Hugging Face',
      'TechCrunch AI', 'YC Blog', 'Andreessen Horowitz', 'Sequoia', 'AI Startup Funding'
    ]
  }
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onNext, firstName }) => {
  const [selectedPacks, setSelectedPacks] = useState<string[]>(['general']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const togglePack = (packId: string) => {
    setSelectedPacks(prev => {
      // If selecting 'all', deselect others. If selecting others, deselect 'all'.
      if (packId === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      
      let updated = prev.filter(id => id !== 'all');
      if (updated.includes(packId)) {
        updated = updated.filter(id => id !== packId);
      } else {
        updated = [...updated, packId];
      }
      
      // Default to empty if nothing is selected
      return updated;
    });
  };

  const handleNext = () => {
    // Combine all unique topics from selected packs
    const combinedTopicsSet = new Set<string>();
    selectedPacks.forEach(packId => {
      const pack = INTELLIGENCE_PACKS.find(p => p.id === packId);
      if (pack) {
        pack.topics.forEach(t => combinedTopicsSet.add(t));
      }
    });

    onNext(Array.from(combinedTopicsSet));
  };

  const handleSkip = () => {
    // Pre-select 'general' topics as a fallback instead of empty list
    const generalPack = INTELLIGENCE_PACKS.find(p => p.id === 'general');
    onNext(generalPack ? generalPack.topics : []);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '850px', 
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: isMobile ? '24px 16px' : '40px',
          background: 'rgba(18, 19, 24, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '16px',
          position: 'relative'
        }}
      >
        <button 
          className="modal-close" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          &times;
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '32px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 800, marginBottom: '10px', background: 'linear-gradient(135deg, #ffffff 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome, {firstName || 'Reader'} 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '12px' : '15px', maxWidth: '550px', margin: '0 auto', lineHeight: '1.5' }}>
            Choose one or more **Intelligence Packs** to personalize your AI, DevOps, and cloud news digest feed instantly.
          </p>
        </div>

        <div style={{ margin: isMobile ? '16px 0' : '24px 0' }}>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))', 
              gap: isMobile ? '12px' : '20px' 
            }}
          >
            {INTELLIGENCE_PACKS.map(pack => {
              const isSelected = selectedPacks.includes(pack.id);
              return (
                <div
                  key={pack.id}
                  onClick={() => togglePack(pack.id)}
                  style={{
                    padding: isMobile ? '16px' : '24px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected ? 'rgba(129, 140, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? `0 0 20px ${pack.glowColor}` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isMobile ? '110px' : '140px',
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                  className="onboarding-card"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: isMobile ? '24px' : '32px' }}>{pack.icon}</span>
                      <div 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition)'
                        }}
                      >
                        {isSelected && (
                          <span style={{ fontSize: '10px', color: '#000', fontWeight: 900 }}>✓</span>
                        )}
                      </div>
                    </div>
                    <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-color)', marginBottom: '8px' }}>
                      {pack.name}
                    </h3>
                    <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {pack.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: isMobile ? '24px' : '35px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
            paddingTop: isMobile ? '16px' : '25px',
            alignItems: 'center'
          }}
        >
          <button 
            className="btn-secondary" 
            onClick={handleSkip}
            style={{ padding: isMobile ? '10px 20px' : '12px 28px', fontSize: '13px' }}
          >
            Use Defaults
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleNext}
            style={{ 
              padding: isMobile ? '12px 24px' : '14px 36px', 
              fontSize: '13px', 
              boxShadow: '0 0 15px rgba(129, 140, 248, 0.3)'
            }}
          >
            Start Reading
          </button>
        </div>
      </div>
    </div>
  );
};
