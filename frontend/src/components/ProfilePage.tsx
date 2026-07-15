import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '../services/api';

interface ProfileData {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string;
  avatar_url?: string | null;
  newsletter_enabled: boolean;
  preferred_topics: string[];
  theme: string;
  created_at?: string | null;
}

interface ProfilePageProps {
  userId: string;
  defaultView?: 'profile' | 'settings';
  userEmail: string;
  onProfileUpdated?: (firstName: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  userId, 
  defaultView = 'profile', 
  userEmail,
  onProfileUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(defaultView);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Edit fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);
  const [themePreference, setThemePreference] = useState('dark');

  const availableTopics = ['OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 'Kubernetes', 'AWS', 'Google Cloud', 'GitHub', 'Hugging Face', 'Vercel'];

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await getProfile(userId);
        setProfile(data);
        
        // Populate edit fields
        setFirstName(data.first_name);
        setLastName(data.last_name || '');
        setNewsletterEnabled(data.newsletter_enabled);
        setPreferredTopics(data.preferred_topics || []);
        setThemePreference(data.theme || 'dark');
      } catch (err) {
        console.warn('Backend profile offline. Loading sandbox settings profile.');
        // Fallback placeholder profile
        const mockProfile: ProfileData = {
          id: userId,
          first_name: 'Abhi',
          last_name: 'Nallana',
          email: userEmail,
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          newsletter_enabled: localStorage.getItem('opsiai_email_subscribed') === 'true',
          preferred_topics: Object.keys(JSON.parse(localStorage.getItem('opsiai_subscriptions') || '{}')).filter(k => JSON.parse(localStorage.getItem('opsiai_subscriptions') || '{}')[k]),
          theme: localStorage.getItem('opsiai_theme') || 'dark',
          created_at: new Date().toISOString()
        };
        setProfile(mockProfile);
        setFirstName(mockProfile.first_name);
        setLastName(mockProfile.last_name || '');
        setNewsletterEnabled(mockProfile.newsletter_enabled);
        setPreferredTopics(mockProfile.preferred_topics);
        setThemePreference(mockProfile.theme);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId, userEmail]);

  const toggleTopic = (topic: string) => {
    setPreferredTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const payload = {
      id: userId,
      first_name: firstName,
      last_name: lastName || null,
      email: userEmail,
      avatar_url: profile?.avatar_url || null,
      newsletter_enabled: newsletterEnabled,
      preferred_topics: preferredTopics.join(','),
      theme: themePreference
    };

    try {
      await saveProfile(payload);
      setProfile({
        ...profile!,
        first_name: firstName,
        last_name: lastName,
        newsletter_enabled: newsletterEnabled,
        preferred_topics: preferredTopics,
        theme: themePreference
      });

      // Save local tokens/theme
      localStorage.setItem('opsiai_theme', themePreference);
      localStorage.setItem('opsiai_email_subscribed', newsletterEnabled ? 'true' : 'false');
      
      const topicsObj: Record<string, boolean> = {};
      availableTopics.forEach(t => {
        topicsObj[t] = preferredTopics.includes(t);
      });
      localStorage.setItem('opsiai_subscriptions', JSON.stringify(topicsObj));

      // Trigger root html color adaptation
      const root = document.documentElement;
      if (themePreference === 'light') {
        root.classList.add('light-theme');
      } else {
        root.classList.remove('light-theme');
      }

      if (onProfileUpdated) {
        onProfileUpdated(firstName);
      }

      setStatus('Profile and settings updated successfully!');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.warn('API connection offline. Syncing local preferences client-side.', err);
      // Fallback local update
      localStorage.setItem('opsiai_theme', themePreference);
      localStorage.setItem('opsiai_email_subscribed', newsletterEnabled ? 'true' : 'false');
      
      const topicsObj: Record<string, boolean> = {};
      availableTopics.forEach(t => {
        topicsObj[t] = preferredTopics.includes(t);
      });
      localStorage.setItem('opsiai_subscriptions', JSON.stringify(topicsObj));

      const root = document.documentElement;
      if (themePreference === 'light') root.classList.add('light-theme');
      else root.classList.remove('light-theme');

      if (onProfileUpdated) onProfileUpdated(firstName);

      setStatus('Settings saved locally in sandbox mode.');
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading profile data...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
        {status && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderLeft: '4px solid var(--success)', padding: '12px', borderRadius: '8px' }}>
            <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, margin: 0 }}>🎉 {status}</p>
          </div>
        )}

        {/* Group 1: Profile details */}
        <div className="mobile-settings-group">
          <div className="mobile-settings-group-title">Personal Details</div>
          
          <div className="mobile-settings-row" style={{ cursor: 'default' }}>
            <div className="mobile-settings-left">
              <span className="icon">👤</span>
              <span>First Name</span>
            </div>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
              style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', textAlign: 'right', outline: 'none', fontWeight: 600 }}
            />
          </div>

          <div className="mobile-settings-row" style={{ cursor: 'default' }}>
            <div className="mobile-settings-left">
              <span className="icon">👤</span>
              <span>Last Name</span>
            </div>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Optional"
              style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', textAlign: 'right', outline: 'none', fontWeight: 600 }}
            />
          </div>

          <div className="mobile-settings-row" style={{ cursor: 'default', opacity: 0.6 }}>
            <div className="mobile-settings-left">
              <span className="icon">✉️</span>
              <span>Email</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{userEmail}</span>
          </div>
        </div>

        {/* Group 2: Appearance settings */}
        <div className="mobile-settings-group">
          <div className="mobile-settings-group-title">Preferences</div>

          <div className="mobile-settings-row">
            <div className="mobile-settings-left">
              <span className="icon">🎨</span>
              <span>Theme</span>
            </div>
            <select 
              value={themePreference} 
              onChange={(e) => setThemePreference(e.target.value)}
              style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', fontWeight: 600, outline: 'none', textAlign: 'right' }}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>

          <div className="mobile-settings-row">
            <div className="mobile-settings-left">
              <span className="icon">📬</span>
              <span>Email Reports</span>
            </div>
            <label className="ios-switch">
              <input 
                type="checkbox" 
                checked={newsletterEnabled} 
                onChange={(e) => setNewsletterEnabled(e.target.checked)} 
              />
              <span className="ios-slider" />
            </label>
          </div>
        </div>

        {/* Save changes button */}
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={saving}
          style={{ minHeight: '48px', width: '100%', borderRadius: '12px', marginTop: '10px', fontSize: '15px', fontWeight: 700 }}
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    );
  }

  return (
    <div className="preferences-panel" style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: '800px' }}>
      
      {/* Profile Header Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: '30px', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-headings)',
            fontSize: '18px',
            fontWeight: 800,
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '8px',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          👤 My Profile
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-headings)',
            fontSize: '18px',
            fontWeight: 800,
            color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '8px',
            borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          ⚙️ Edit Settings
        </button>
      </div>

      {status && (
        <div className="article-card" style={{ borderLeft: '3px solid var(--success)', padding: '12px 16px', marginBottom: '24px', background: 'rgba(34, 197, 94, 0.05)' }}>
          <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, margin: 0 }}>🎉 {status}</p>
        </div>
      )}

      {activeTab === 'profile' ? (
        /* PROFILE VIEW PAGE */
        <div className="flow-node" style={{ textAlign: 'left', padding: '30px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px' }}>
            <div 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: '#fff',
                boxShadow: 'var(--shadow)'
              }}
            >
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile?.first_name[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{profile?.first_name} {profile?.last_name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{profile?.email}</p>
              {profile?.created_at && (
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                  Joined OpsiAI on {new Date(profile.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>Daily Email brief Status</h4>
              <span 
                style={{ 
                  display: 'inline-block',
                  fontSize: '12px', 
                  fontWeight: 700, 
                  backgroundColor: profile?.newsletter_enabled ? 'rgba(34,197,94,0.1)' : 'rgba(255,90,95,0.1)', 
                  color: profile?.newsletter_enabled ? 'var(--success)' : 'var(--strategic)', 
                  padding: '4px 10px', 
                  borderRadius: '12px',
                  border: '1px solid'
                }}
              >
                {profile?.newsletter_enabled ? '📬 Subscribed (Active)' : '🔕 Unsubscribed (Inactive)'}
              </span>
            </div>

            <div>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>Active Theme</h4>
              <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                {profile?.theme === 'light' ? '🔆 Light Theme (Clean Editorial)' : '🌙 Dark Theme (Luxury Gold)'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '12px' }}>Personalized Topics ({profile?.preferred_topics.length || 0})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile?.preferred_topics && profile.preferred_topics.length > 0 ? (
                profile.preferred_topics.map(topic => (
                  <span 
                    key={topic} 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border)', 
                      padding: '6px 12px', 
                      borderRadius: '20px' 
                    }}
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No subscribed topics. Head to settings to add interests.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SETTINGS VIEW EDIT FORM */
        <form onSubmit={handleSave} className="flow-node" style={{ textAlign: 'left', padding: '30px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">First Name *</label>
              <input
                type="text"
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">Last Name</label>
              <input
                type="text"
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">Preferred Theme</label>
              <select
                value={themePreference}
                onChange={(e) => setThemePreference(e.target.value)}
                className="auth-input"
                style={{ background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border)' }}
              >
                <option value="dark">🌙 Dark Theme (Luxurious Gold)</option>
                <option value="light">🔆 Light Theme (Clean Off-White)</option>
              </select>
            </div>
            
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 16px', 
                background: 'rgba(0,0,0,0.1)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Email Reports</span>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Enable automated daily digests</p>
              </div>
              <label className="switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={newsletterEnabled}
                  onChange={(e) => setNewsletterEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <label className="auth-label" style={{ marginBottom: '12px' }}>Preferred AI & DevOps Topics</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {availableTopics.map(topic => {
                const isSelected = preferredTopics.includes(topic);
                return (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-glow)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-color)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'var(--transition)'
                    }}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '12px 28px' }}>
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
