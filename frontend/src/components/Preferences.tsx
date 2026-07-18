import React, { useState, useEffect } from 'react';
import { savePreferences, fetchTopicCounts, fetchPreferences } from '../services/api';

interface Topic {
  id: string;
  name: string;
  icon: string;
  description: string;
  countThisWeek: number;
  recommended?: boolean;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  topics: Topic[];
}

const CATEGORIES: Category[] = [
  {
    id: 'ai-models',
    title: 'AI Models & Reasoning Systems',
    icon: '🧠',
    topics: [
      { id: 'OpenAI', name: 'OpenAI', icon: '🤖', description: 'ChatGPT releases, live audio streaming & Orchestrator APIs.', countThisWeek: 14, recommended: true },
      { id: 'Anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude models, Reasoning parameters & Model Context Protocol.', countThisWeek: 8, recommended: true },
      { id: 'Meta AI', name: 'Meta AI', icon: '🦙', description: 'Llama architectures, open-weights releases & PyTorch tools.', countThisWeek: 12 },
      { id: 'Google Gemini', name: 'Google Gemini', icon: '⚡', description: 'Gemini context expansions, Flash fine-tunes & Vertex platforms.', countThisWeek: 11 }
    ]
  },
  {
    id: 'devops-cloud',
    title: 'Orchestration & DevOps Stack',
    icon: '⚓',
    topics: [
      { id: 'Kubernetes', name: 'Kubernetes', icon: '⚓', description: 'Kubelet schedulers, pod autoscalers & cluster control planes.', countThisWeek: 9, recommended: true },
      { id: 'AWS', name: 'AWS', icon: '☁️', description: 'Bedrock configurations, cloud serverless TPUs & IAM security.', countThisWeek: 15 },
      { id: 'Google Cloud', name: 'Google Cloud', icon: '☁️', description: 'GCP container engines, TPU clusters & Vertex endpoints.', countThisWeek: 6 }
    ]
  },
  {
    id: 'dev-tools',
    title: 'Developer Platforms & Deployment',
    icon: '💻',
    topics: [
      { id: 'GitHub', name: 'GitHub', icon: '💻', description: 'GitHub Copilot upgrades, Actions pipelines & workspace automation.', countThisWeek: 7, recommended: true },
      { id: 'Hugging Face', name: 'Hugging Face', icon: '🤗', description: 'Community Transformer libraries, Space hosting & weights downloads.', countThisWeek: 18 }
    ]
  }
];

interface PreferencesProps {
  enabledTopics?: Record<string, boolean>;
  onSave?: (updated: Record<string, boolean>) => void;
  userEmail?: string | null;
  isEmailSubscribed?: boolean;
  onSetEmailSubscribed?: (subscribed: boolean) => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ 
  enabledTopics, 
  onSave, 
  userEmail,
  isEmailSubscribed,
  onSetEmailSubscribed
}) => {
  const [localTopics, setLocalTopics] = useState<Record<string, boolean>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'dev-tools': false,
    'devops-cloud': false,
    'ai-models': false
  });
  
  // Newsletter delivery preferences states
  const [emailEnabled, setEmailEnabled] = useState(isEmailSubscribed ?? false);
  const [deliveryTime, setDeliveryTime] = useState(localStorage.getItem('opsiai_delivery_time') || '08:00 AM');
  const [frequency, setFrequency] = useState(localStorage.getItem('opsiai_delivery_frequency') || 'Daily');
  const [collapsedNewsletter, setCollapsedNewsletter] = useState(false);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await fetchTopicCounts();
        setDbCounts(counts);
      } catch (err) {
        console.warn('Failed to load real-time topic counts:', err);
      }
    }
    loadCounts();
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function syncDBPrefs() {
      const email = userEmail || localStorage.getItem('opsiai_email');
      if (email) {
        try {
          const prefs = await fetchPreferences(email);
          if (prefs && prefs.length > 0) {
            const loaded: Record<string, boolean> = {};
            const defaultTopics = [
              'OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 
              'Kubernetes', 'AWS', 'Google Cloud', 'GitHub', 'Hugging Face'
            ];
            defaultTopics.forEach((topicId: string) => {
              loaded[topicId] = false;
            });
            prefs.forEach((topicId: string) => {
              loaded[topicId] = true;
            });
            setLocalTopics(loaded);
            if (onSave) onSave(loaded);
          }
        } catch (err) {
          console.warn('Failed to sync DB preferences on Preferences mount:', err);
        }
      }
    }
    syncDBPrefs();
  }, [userEmail]);

  useEffect(() => {
    if (enabledTopics) {
      setLocalTopics(enabledTopics);
    } else {
      const saved = localStorage.getItem('opsiai_subscriptions');
      if (saved) {
        setLocalTopics(JSON.parse(saved));
      } else {
        const initial: Record<string, boolean> = {};
        CATEGORIES.forEach(cat => {
          cat.topics.forEach(t => {
            initial[t.id] = true;
          });
        });
        setLocalTopics(initial);
      }
    }
  }, [enabledTopics]);

  useEffect(() => {
    if (isEmailSubscribed !== undefined) {
      setEmailEnabled(isEmailSubscribed);
    }
  }, [isEmailSubscribed]);

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleTopic = (topicId: string) => {
    setLocalTopics(prev => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    // Save active subscriptions
    localStorage.setItem('opsiai_subscriptions', JSON.stringify(localTopics));
    
    // Save email notifications configs
    localStorage.setItem('opsiai_email_subscribed', emailEnabled ? 'true' : 'false');
    localStorage.setItem('opsiai_delivery_time', deliveryTime);
    localStorage.setItem('opsiai_delivery_frequency', frequency);

    if (onSave) {
      onSave(localTopics);
    }
    if (onSetEmailSubscribed) {
      onSetEmailSubscribed(emailEnabled);
    }

    // Call backend API if user is authenticated
    const email = userEmail || localStorage.getItem('opsiai_email');
    if (email) {
      try {
        const activeList = Object.keys(localTopics).filter(k => localTopics[k]);
        
        // Save topics to backend or fallback
        await savePreferences(email, activeList);

        // Save delivery settings in user settings if available
        // Note: For now we save locally in database if user exists, fallback to local storage
      } catch (err) {
        console.warn('Backend server offline. Settings saved locally.', err);
      }
    }

    setTimeout(() => {
      setSaving(false);
      setStatus('Preferences updated successfully!');
      setTimeout(() => setStatus(null), 3000);
    }, 800);
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
        {status && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderLeft: '4px solid var(--success)', padding: '12px', borderRadius: '8px' }}>
            <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, margin: 0 }}>🎉 {status}</p>
          </div>
        )}

        {/* Categories toggler block */}
        <div className="mobile-topics-section">
          {CATEGORIES.map(category => (
            <div className="mobile-category-block" key={category.id}>
              <h2>{category.icon} {category.title}</h2>
              <div className="mobile-chips-grid">
                {category.topics.map(topic => {
                  const isEnabled = localTopics[topic.id] !== false;
                  return (
                    <div 
                      key={topic.id}
                      className={`mobile-topic-chip ${isEnabled ? 'active' : ''}`}
                      onClick={() => handleToggleTopic(topic.id)}
                    >
                      <span className="icon">{topic.icon}</span>
                      <span>{topic.name}</span>
                      {topic.recommended && <span style={{ fontSize: '8px', color: 'var(--primary)', fontWeight: 800 }}>★</span>}
                      <span className="metrics">{topic.countThisWeek}w</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Email Delivery Options */}
        <div className="mobile-settings-group" style={{ marginTop: '10px' }}>
          <div className="mobile-settings-group-title">Newsletter & Digests</div>
          
          <div className="mobile-settings-row">
            <div className="mobile-settings-left">
              <span className="icon">📬</span>
              <span>Enable Daily Briefing</span>
            </div>
            <label className="ios-switch">
              <input 
                type="checkbox" 
                checked={emailEnabled} 
                onChange={() => setEmailEnabled(!emailEnabled)} 
              />
              <span className="ios-slider" />
            </label>
          </div>

          {emailEnabled && (
            <>
              <div className="mobile-settings-row">
                <div className="mobile-settings-left">
                  <span className="icon">⏰</span>
                  <span>Delivery Time</span>
                </div>
                <select 
                  value={deliveryTime} 
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', fontWeight: 600, outline: 'none', textAlign: 'right' }}
                >
                  <option value="06:00 AM">06:00 AM</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                </select>
              </div>

              <div className="mobile-settings-row">
                <div className="mobile-settings-left">
                  <span className="icon">📅</span>
                  <span>Frequency</span>
                </div>
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', fontWeight: 600, outline: 'none', textAlign: 'right' }}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekdays Only">Mon-Fri</option>
                  <option value="Weekly Digest">Weekly</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Save button */}
        <button 
          className="btn-primary" 
          onClick={handleSave} 
          disabled={saving}
          style={{ minHeight: '48px', width: '100%', borderRadius: '12px', marginTop: '10px', fontSize: '15px', fontWeight: 700 }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    );
  }

  return (
    <div className="preferences-panel" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="preferences-intro">
        <h2>My AI Topics Subscriptions & Settings</h2>
        <p>Build your personalized technical intelligence feed. Selected topics filter your dashboards and daily briefings.</p>
      </div>

      {status && (
        <div className="article-card" style={{ borderLeft: '3px solid var(--success)', padding: '12px 16px', marginBottom: '24px', background: 'rgba(34, 197, 94, 0.05)' }}>
          <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, margin: 0 }}>🎉 {status}</p>
        </div>
      )}

      <div className="preferences-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Newsletter Delivery Settings Collapsible Card */}
        <div className="flow-node" style={{ textAlign: 'left', padding: '20px', borderRadius: '10px', borderColor: 'var(--primary)', boxShadow: '0 0 10px rgba(228, 185, 91, 0.05)' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setCollapsedNewsletter(!collapsedNewsletter)}
          >
            <span style={{ fontSize: '20px', marginRight: '10px' }}>📬</span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
              Newsletter & Email Delivery Preferences
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
              {collapsedNewsletter ? 'Expand ▼' : 'Collapse ▲'}
            </span>
          </div>

          {!collapsedNewsletter && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto', 
                  gap: '16px', 
                  alignItems: 'center', 
                  padding: '16px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Enable Email Briefings</span>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    Receive a clean editorial summary of your whitelisted categories directly in your inbox.
                  </p>
                </div>
                <label className="switch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={() => setEmailEnabled(!emailEnabled)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {emailEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="auth-label" style={{ fontSize: '11px' }}>Preferred Delivery Time</label>
                    <select 
                      value={deliveryTime} 
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="auth-input"
                      style={{ background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border)' }}
                    >
                      <option value="06:00 AM">06:00 AM (IST)</option>
                      <option value="08:00 AM">08:00 AM (IST)</option>
                      <option value="10:00 AM">10:00 AM (IST)</option>
                      <option value="12:00 PM">12:00 PM (IST)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="auth-label" style={{ fontSize: '11px' }}>Frequency</label>
                    <select 
                      value={frequency} 
                      onChange={(e) => setFrequency(e.target.value)}
                      className="auth-input"
                      style={{ background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border)' }}
                    >
                      <option value="Daily">Daily (Every Day)</option>
                      <option value="Weekdays Only">Weekdays Only (Mon-Fri)</option>
                      <option value="Weekly Digest">Weekly Digest (Saturdays)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Subscriptions Lists */}
        {CATEGORIES.map(category => {
          const isCollapsed = collapsedCategories[category.id];
          return (
            <div key={category.id} className="flow-node" style={{ textAlign: 'left', padding: '20px', borderRadius: '10px' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleCategory(category.id)}
              >
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{category.icon}</span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  {category.title}
                </h3>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {isCollapsed ? 'Expand ▼' : 'Collapse ▲'}
                </span>
              </div>

              {!isCollapsed && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                  {category.topics.map(topic => {
                    const isEnabled = localTopics[topic.id] !== false;
                    return (
                      <div 
                        key={topic.id} 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'auto 1fr auto', 
                          gap: '16px', 
                          alignItems: 'center', 
                          padding: '16px',
                          background: 'rgba(0,0,0,0.15)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          transition: 'var(--transition)'
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{topic.name}</span>
                            {topic.recommended && (
                              <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Recommended</span>
                            )}
                             <span style={{ fontFamily: 'var(--font-stats)', fontSize: '11px', color: 'var(--accent)', marginLeft: 'auto' }}>
                               {dbCounts[topic.id] !== undefined ? dbCounts[topic.id] : 0} this week
                             </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            {topic.description}
                          </p>
                        </div>

                        <label className="switch" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleTopic(topic.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '14px 28px' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
