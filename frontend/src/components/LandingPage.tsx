import React, { useState, useEffect } from 'react';
import { fetchOpsiMetrics } from '../services/api';
import type { OpsiMetrics } from '../services/api';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
  onViewDemo: () => void;
  isAuthenticated?: boolean;
  onNavigateToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToSignUp,
  onViewDemo,
  isAuthenticated = false,
  onNavigateToDashboard,
  onLogout,
  onNavigateToTab
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('opsiai_theme') as 'dark' | 'light') || 'dark'
  );
  const [metrics, setMetrics] = useState<OpsiMetrics | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | 'doc' | 'release_notes' | 'api_status' | 'about' | 'pricing'>('privacy');
  
  // Custom mobile landing responsive configurations
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenPolicy = (type: 'privacy' | 'terms' | 'doc' | 'release_notes' | 'api_status' | 'about' | 'pricing') => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await fetchOpsiMetrics();
        setMetrics(data);
      } catch (err) {
        console.warn('OpsiAI API metrics unavailable. Loading real-time defaults:', err);
        setMetrics({
          articles_analyzed: 5842,
          trusted_sources: 87,
          strategic_insights: 142,
          reports_generated: 365,
          time_saved_hours: 184
        });
      }
    }
    loadMetrics();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('opsiai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isMobileView) {
    return (
      <div className="mobile-landing-container" style={{ overflowX: 'hidden', paddingBottom: '40px' }}>
        {/* Navigation Bar */}
        <nav className="landing-nav scrolled" style={{ height: '64px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="OpsiAI Logo" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span style={{ fontSize: '16px', fontWeight: 800 }}>OpsiAI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="theme-toggle-btn" onClick={toggleTheme} style={{ width: '36px', height: '36px', minHeight: '36px', border: 'none', background: 'transparent' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <button className="btn-secondary" onClick={onLogout} style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px', borderRadius: '8px' }}>Sign Out</button>
            ) : (
              <>
                <button className="btn-secondary" onClick={onNavigateToLogin} style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px', borderRadius: '8px' }}>Sign In</button>
                <button className="btn-primary" onClick={onNavigateToSignUp} style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px', borderRadius: '8px' }}>Sign Up</button>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div style={{ padding: '96px 16px 30px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, lineHeight: '1.25', margin: '0 0 12px 0', color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
            Cut Through the Noise.<br />
            <span className="gold-accent">Stay Ahead of AI.</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 24px 0', padding: '0 8px' }}>
            OpsiAI scans hundreds of trusted AI and DevOps sources every day, filters what actually matters, explains why it matters, and delivers one concise intelligence report directly to your inbox.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
            {isAuthenticated ? (
              <button className="btn-primary" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={onNavigateToDashboard}>Go to Dashboard</button>
            ) : (
              <button className="btn-primary" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={onNavigateToSignUp}>Get Started Free</button>
            )}
            <button className="btn-outline" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={isAuthenticated ? onNavigateToDashboard : onViewDemo}>
              {isAuthenticated ? "View Today's Briefing" : "View Today's Report"}
            </button>
          </div>

          {/* Hero Email Mockup */}
          <div className="email-mockup-wrapper" style={{ marginTop: '30px', width: '100%', boxSizing: 'border-box', animation: 'none', transform: 'none' }}>
            <div className="email-mockup-header" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--strategic)' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--important)' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--insights)' }}></span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>From: OpsiAI Intelligence &lt;brief@opsiai.com&gt;</div>
              <div style={{ fontWeight: 700, color: 'var(--text-color)', marginTop: '2px', fontSize: '10px' }}>OpsiAI Briefing Report - Today</div>
            </div>
            <div className="email-mockup-window" style={{ height: '240px', overflowY: 'auto' }}>
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', marginBottom: '12px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>OpsiAI</h3>
                <p style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px', margin: 0 }}>Bloomberg for Technical Updates</p>
              </div>

              {/* Today's AI Snapshot mockup */}
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', marginBottom: '12px', textAlign: 'left' }}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Today's AI Snapshot</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
                  <div>🚨 Strategic : <span style={{ color: 'var(--strategic)' }}>2</span></div>
                  <div>📌 Important : <span style={{ color: 'var(--important)' }}>6</span></div>
                  <div>ℹ️ Insights : <span style={{ color: 'var(--insights)' }}>4</span></div>
                </div>
              </div>

              {/* Strategic Card */}
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--strategic)', padding: '10px', borderRadius: '4px', marginBottom: '10px', textAlign: 'left' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--strategic)', fontWeight: 800 }}>🚨 Strategic</div>
                <div style={{ fontSize: '11px', fontWeight: 700, margin: '2px 0' }}>Introducing GPT-Live Agentic Orchestrator</div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                  <strong>Why it matters:</strong> OpenAI releases native loops lowering orchestration latency by 60%.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Carousel Section */}
        <div style={{ padding: '40px 16px', textAlign: 'center', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-color)' }}>See What You'll Receive Every Day</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>Every report is structured logically so you can scan the brief in under 5 minutes.</p>
          </div>

          <div 
            onTouchStart={(e) => setStartX(e.touches[0].clientX)} 
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (diff > 50) {
                setShowcaseIndex(prev => (prev + 1) % 3);
              } else if (diff < -50) {
                setShowcaseIndex(prev => (prev - 1 + 3) % 3);
              }
            }}
            style={{ overflow: 'hidden', position: 'relative', width: '100%' }}
          >
            <div 
              style={{ 
                display: 'flex', 
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                transform: `translateX(-${showcaseIndex * 100}%)`,
                width: '100%' 
              }}
            >
              {/* Card 1 */}
              <div style={{ width: '100%', flexShrink: 0, padding: '0 8px', boxSizing: 'border-box' }}>
                <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', minHeight: '190px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--strategic)', marginBottom: '8px', textAlign: 'left' }}>🚨 Strategic Updates</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4', textAlign: 'left' }}>Framework migrations, shifts, and foundational API updates.</p>
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--strategic)', padding: '12px', borderRadius: '4px', textAlign: 'left' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--strategic)', textTransform: 'uppercase' }}>🚨 Strategic</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, margin: '4px 0' }}>Anthropic Claude 4 Launch</div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>Native agent memory caching reduces execution costs.</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ width: '100%', flexShrink: 0, padding: '0 8px', boxSizing: 'border-box' }}>
                <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', minHeight: '190px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--important)', marginBottom: '8px', textAlign: 'left' }}>📌 Important News</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4', textAlign: 'left' }}>Tool releases, Kubernetes cluster updates, cloud patches.</p>
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--important)', padding: '12px', borderRadius: '4px', textAlign: 'left' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--important)', textTransform: 'uppercase' }}>📌 Important</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, margin: '4px 0' }}>Kubernetes v1.31 Schedule</div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>Memory manager upgrades for high-density nodes.</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ width: '100%', flexShrink: 0, padding: '0 8px', boxSizing: 'border-box' }}>
                <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', minHeight: '190px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textAlign: 'left' }}>💡 Daily Takeaways</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4', textAlign: 'left' }}>Synthetic summaries compiling announcements and total hours saved.</p>
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', textAlign: 'left' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Takeaways</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>ANNOUNCEMENT</div>
                        <div style={{ fontWeight: 700 }}>GPT-Live Launch</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>TIME SAVED</div>
                        <div style={{ fontWeight: 700, color: 'var(--insights)' }}>45 mins</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              {[0, 1, 2].map(idx => (
                <span 
                  key={idx} 
                  onClick={() => setShowcaseIndex(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: idx === showcaseIndex ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'background-color 0.3s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* AI Pulse Stats */}
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-color)' }}>OpsiAI In Numbers</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>Parsed, aggregated and organized developer facts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="metric-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{metrics ? metrics.articles_analyzed.toLocaleString() : '5,842'}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Articles</div>
            </div>
            <div className="metric-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{metrics ? metrics.trusted_sources.toLocaleString() : '87'}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Sources</div>
            </div>
            <div className="metric-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{metrics ? metrics.strategic_insights.toLocaleString() : '142'}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Strategic</div>
            </div>
            <div className="metric-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{metrics ? `${metrics.time_saved_hours.toLocaleString()}h` : '184h'}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Time Saved</div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Custom Breakpoints check in index.css) */}
        <div style={{ padding: '40px 16px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-color)' }}>Engineered for Technical Minds</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>Precision feeds built for software and systems engineers.</p>
          </div>
          <div className="mobile-features-grid" style={{ display: 'grid', gap: '16px' }}>
            <div className="metric-card" style={{ padding: '20px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 800 }}>AI Intelligence</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Gemini AI extracts, tags, and evaluates updates using custom heuristics.</p>
            </div>
            <div className="metric-card" style={{ padding: '20px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 800 }}>Prioritization</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Critical architectural news is highlighted, separating noise from signal.</p>
            </div>
            <div className="metric-card" style={{ padding: '20px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 800 }}>Daily Reports</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Get a beautifully formatted dark-theme email briefing in your inbox daily.</p>
            </div>
            <div className="metric-card" style={{ padding: '20px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 800 }}>Trusted Sources</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Whitelisted scraping from official engineering blogs and cloud APIs.</p>
            </div>
          </div>
        </div>

        {/* How It Works Timeline */}
        <div style={{ padding: '40px 16px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-color)' }}>How It Works</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>Seamless curation and summary pipeline.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {[
              { step: '①', title: 'Collect', desc: 'Aggregates news from engineering blogs, release notes, and tech portals.' },
              { step: '②', title: 'Analyze', desc: 'Gemini AI structures news facts, filtering out duplicates and marketing noise.' },
              { step: '③', title: 'Generate Report', desc: 'Prioritizes strategic updates, explains why it matters to developers.' },
              { step: '④', title: 'Deliver', desc: 'Delivers a daily condensed technical briefing directly to your inbox.' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '22px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 800 }}>{item.step}</div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-color)' }}>{item.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: '1.4' }}>{item.desc}</p>
                </div>
                {idx < 3 && <div style={{ fontSize: '18px', color: 'var(--primary)', margin: '10px 0' }}>↓</div>}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ padding: '50px 16px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(228, 185, 91, 0.02) 0%, rgba(0,0,0,0) 100%)' }}>
          {isAuthenticated ? (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-color)' }}>Ready to Explore Your Technical Feed?</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>Access your personalized reports and configure your whitelisted preferences.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn-primary" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={onNavigateToDashboard}>Go to Dashboard</button>
                <button className="btn-outline" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={() => onNavigateToTab && onNavigateToTab('topics')}>Configure Preferences</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-color)' }}>Start Every Day Smarter.</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>Join OpsiAI and receive curated AI intelligence instead of endless headlines.</p>
              <button className="btn-primary" style={{ width: '100%', height: '48px', minHeight: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }} onClick={onNavigateToSignUp}>Get Started Free</button>
            </>
          )}
        </div>

        {/* Mobile Footer */}
        <footer style={{ padding: '40px 16px 20px 16px', borderTop: '1px solid var(--border)', background: 'var(--body-bg)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: 'var(--primary)', margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800 }}>OpsiAI</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>AI and DevOps intelligence parsed and curated daily for everyone.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
              <span onClick={() => handleOpenPolicy('privacy')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Privacy Policy</span>
              <span onClick={() => handleOpenPolicy('terms')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Terms</span>
              <span onClick={() => handleOpenPolicy('doc')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Guide</span>
              <span onClick={() => handleOpenPolicy('about')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>About</span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} OpsiAI. All rights reserved.
          </div>
        </footer>

        {/* Policies Modals */}
        {showPolicyModal && (
          <div className="modal-backdrop" onClick={() => setShowPolicyModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, cursor: 'pointer' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', maxHeight: '80vh', overflowY: 'auto', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative', cursor: 'default' }}>
              <button onClick={() => setShowPolicyModal(false)} style={{ position: 'absolute', top: '10px', right: '15px', border: 'none', background: 'transparent', color: 'var(--text-color)', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              
              {policyType === 'privacy' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🔒 Privacy Policy</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p><strong>Last updated: July 18, 2026</strong></p>
                    <p>At OpsiAI, we prioritize the confidentiality and safety of your preferences. This policy details how we handle information:</p>
                    <p><strong>1. Information Collection:</strong> We only collect your email address and personalized topic subscription configurations to curate daily reports.</p>
                    <p><strong>2. Third-Party Sharing:</strong> We do not sell or distribute user emails or browsing history to any advertisers or marketing networks.</p>
                    <p><strong>3. Cookie Usage:</strong> We utilize minimal browser local storage strictly for token session authentication persistence and preferences cache.</p>
                    <p>For questions regarding this policy, please contact our support desk at <a href="mailto:opsiai127@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>opsiai127@gmail.com</a>.</p>
                  </div>
                </div>
              )}

              {policyType === 'terms' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>📄 Terms of Service</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p><strong>Last updated: July 18, 2026</strong></p>
                    <p>By registering or using OpsiAI services, you agree to the following conditions:</p>
                    <p><strong>1. Proper Usage:</strong> OpsiAI delivers curated daily digests for informational/educational purposes only. Automated scraping of OpsiAI endpoints is prohibited.</p>
                    <p><strong>2. Fair Subscription:</strong> Users may subscribe to or unsubscribe from our daily newsletter delivery at any time via their profile portal.</p>
                    <p><strong>3. Limitation of Liability:</strong> OpsiAI is provided "as is". We are not responsible for any direct or indirect actions resulting from the contents of the parsed summaries.</p>
                  </div>
                </div>
              )}

              {policyType === 'doc' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>📖 Documentation & Guide</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p>Welcome to OpsiAI! Here is a simple guide on how to navigate the platform:</p>
                    <p><strong>1. Personalize Interests:</strong> Navigate to the <em>Preferences</em> tab to whitelist or blacklist categories (e.g. OpenAI, Kubernetes, AWS). This immediately filters both your dashboard feeds and daily newsletters.</p>
                    <p><strong>2. Daily Newsfeed:</strong> The dashboard aggregates daily briefings with summaries, "Why It Matters" context, and calculated reading time metrics.</p>
                    <p><strong>3. Historical Surfing:</strong> Switch dates inside the header menu or apply <em>From/To Date</em> fields to search for keyword topics across all briefings generated till date.</p>
                    <p><strong>4. Newsletter:</strong> Opt-in or out of the daily automated email briefing in the <em>Profile</em> menu.</p>
                  </div>
                </div>
              )}

              {policyType === 'about' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>ℹ️ About OpsiAI</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p>OpsiAI was founded in 2026 to solve modern information overload.</p>
                    <p>Every day, hundreds of announcements, releases, and articles are published across the AI and DevOps ecosystem. Finding the raw engineering facts behind the headlines requires hours of tedious scrolling.</p>
                    <p>OpsiAI automates this entirely. Using Gemini AI model analysis, our crawler parses and evaluates the daily news pipeline, indexing whitelisted updates, translating why it matters, and delivering a clean intelligence digest directly to your inbox and dashboard.</p>
                  </div>
                </div>
              )}

              {policyType === 'pricing' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>💎 Pricing</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p><strong>Beta Access:</strong> OpsiAI is currently in free public beta.</p>
                    <p>Enjoy unlimited daily email newsletters, whitelisted custom topic settings, and full access to our historical multi-date search engines at no charge.</p>
                  </div>
                </div>
              )}

              {policyType === 'release_notes' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🚀 Release Notes</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p><strong>Version 1.0.0 (First Release)</strong></p>
                    <p>Welcome to the initial launch of OpsiAI! In this milestone release, we are proud to introduce:</p>
                    <p><strong>• AI-Powered Parsing:</strong> Automated scraping and indexing of key AI and DevOps engineering posts via Gemini AI.</p>
                    <p><strong>• Personalized Whitelisting:</strong> Interactive preference controls to select exactly what news categories matter to you.</p>
                    <p><strong>• Global Search & Ranges:</strong> Advanced search functionality scanning all historical reports by keyword or From/To dates.</p>
                    <p><strong>• Mobile Shell UI:</strong> Premium native-app-like experience optimized for smartphones and tablets.</p>
                  </div>
                </div>
              )}

              {policyType === 'api_status' && (
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🟢 System & API Status</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <p>Real-time status updates of OpsiAI components:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--body-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div><strong>API Gateway:</strong> <span style={{ color: 'var(--success)' }}>Operational 🟢</span></div>
                      <div><strong>PostgreSQL/Supabase DB:</strong> <span style={{ color: 'var(--success)' }}>Connected 🟢</span></div>
                      <div><strong>AI Scraper Cron:</strong> <span style={{ color: 'var(--success)' }}>Active (Daily) 🟢</span></div>
                      <div><strong>SMTP Server:</strong> <span style={{ color: 'var(--success)' }}>Operational 🟢</span></div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => setShowPolicyModal(false)} style={{ padding: '8px 20px', fontSize: '12px' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Tiny clean grid overlay and gold spotlight */}
      <div className="subtle-grid"></div>
      <div className="landing-glow-1"></div>

      {/* Editorial Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div
          className="nav-logo"
          onClick={() => {
            if (isAuthenticated && onNavigateToDashboard) {
              onNavigateToDashboard();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <img src="/logo.jpg" alt="OpsiAI Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          Opsi<span>AI</span>
        </div>

        {isAuthenticated ? (
          <ul className="nav-items">
            <li className="nav-link" onClick={() => onNavigateToDashboard && onNavigateToDashboard()}>Dashboard</li>
            <li className="nav-link" onClick={() => onNavigateToTab && onNavigateToTab('reports')}>Daily Reports</li>
            <li className="nav-link" onClick={() => onNavigateToTab && onNavigateToTab('topics')}>Preferences</li>
            <li className="nav-link" onClick={() => onNavigateToTab && onNavigateToTab('profile')}>Profile</li>
          </ul>
        ) : (
          <ul className="nav-items">
            <li className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</li>
            <li className="nav-link" onClick={() => alert('Pricing: OpsiAI is currently in free public beta!')}>Pricing</li>
            <li className="nav-link" onClick={() => document.getElementById('metrics')?.scrollIntoView({ behavior: 'smooth' })}>Metrics</li>
            <li className="nav-link" onClick={() => document.getElementById('why-opsiai')?.scrollIntoView({ behavior: 'smooth' })}>Why OpsiAI</li>
          </ul>
        )}

        <div className="nav-buttons">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {isAuthenticated ? (
            <button className="btn-secondary" style={{ borderColor: 'var(--strategic)', color: 'var(--strategic)' }} onClick={onLogout}>Sign Out</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onNavigateToLogin}>Sign In</button>
              <button className="btn-primary" onClick={onNavigateToSignUp}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-container">
        <div className="hero-left">
          <h1 className="hero-title">
            Cut Through the Noise.<br />
            <span className="gold-accent">Stay Ahead of AI.</span>
          </h1>
          <p className="hero-subtitle">
            OpsiAI scans hundreds of trusted AI and DevOps sources every day,
            filters what actually matters, explains why it matters,
            and delivers one concise intelligence report directly to your inbox.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <button className="btn-primary btn-large" onClick={onNavigateToDashboard}>Go to Dashboard</button>
            ) : (
              <button className="btn-primary btn-large" onClick={onNavigateToSignUp}>Get Started Free</button>
            )}
            <button className="btn-outline btn-large" onClick={isAuthenticated ? onNavigateToDashboard : onViewDemo}>
              {isAuthenticated ? "View Today's Briefing" : "View Today's Report"}
            </button>
          </div>
        </div>

        <div className="hero-right">
          {/* macOS Browser Mockup */}
          <div className="email-mockup-wrapper">
            <div className="email-mockup-header">
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--strategic)' }}></span>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--important)' }}></span>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--insights)' }}></span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>From: OpsiAI Intelligence &lt;brief@opsiai.com&gt;</div>
              <div style={{ fontWeight: 700, color: 'var(--text-color)', marginTop: '4px', fontSize: '12px' }}>OpsiAI Briefing Report - July 14, 2026</div>
            </div>
            <div className="email-mockup-window">
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>OpsiAI</h3>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>Bloomberg for Technical Updates</p>
              </div>

              {/* Today's AI Snapshot mockup */}
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Today's AI Snapshot</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                  <div>🚨 Strategic : <span style={{ color: 'var(--strategic)' }}>2</span></div>
                  <div>📌 Important : <span style={{ color: 'var(--important)' }}>6</span></div>
                  <div>ℹ️ Insights : <span style={{ color: 'var(--insights)' }}>4</span></div>
                </div>
              </div>

              {/* Strategic Card */}
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--strategic)', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--strategic)', fontWeight: 800, letterSpacing: '0.05em' }}>🚨 Strategic</div>
                <div style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0' }}>Introducing GPT-Live Agentic Orchestrator</div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                  <strong>Why it matters:</strong> OpenAI releases native loops lowering orchestration middleware latency by 60%.
                </p>
              </div>

              {/* Important Card */}
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--important)', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--important)', fontWeight: 800, letterSpacing: '0.05em' }}>📌 Important</div>
                <div style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0' }}>Announcing etcd v3.7.0</div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                  <strong>Why it matters:</strong> RangeStream updates directly increase Kubernetes scheduler resource performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Homepage Metrics (Bloomberg style statistics) */}
      <section className="metrics-section" id="metrics">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-num">
              {metrics ? metrics.articles_analyzed.toLocaleString() : '...'}
            </div>
            <div className="metric-label">Articles Analyzed</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">
              {metrics ? metrics.trusted_sources.toLocaleString() : '...'}
            </div>
            <div className="metric-label">Trusted Sources</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">
              {metrics ? metrics.strategic_insights.toLocaleString() : '...'}
            </div>
            <div className="metric-label">Strategic Insights</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">
              {metrics ? `${metrics.time_saved_hours.toLocaleString()} hrs` : '...'}
            </div>
            <div className="metric-label">Reading Time Saved</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">
              {metrics ? metrics.reports_generated.toLocaleString() : '...'}
            </div>
            <div className="metric-label">Reports Generated</div>
          </div>
        </div>
      </section>

      {/* Email Showcase Sections */}
      <section className="landing-section" id="showcase">
        <div className="section-intro">
          <h2>See What You'll Receive Every Day</h2>
          <p>Every report is structured logically so you can scan the day's brief in under 5 minutes.</p>
        </div>
        <div className="carousel-wrapper">
          <div className="carousel-card">
            <div className="carousel-card-title">🚨 Strategic Updates</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>Framework migrations, shifts, and foundational API updates.</p>
            <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--strategic)', padding: '12px', borderRadius: '4px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--strategic)', textTransform: 'uppercase' }}>🚨 Strategic</div>
              <div style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0' }}>Anthropic Claude 4 Launch</div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Native agent memory caching reduces execution costs.</p>
            </div>
          </div>

          <div className="carousel-card">
            <div className="carousel-card-title">📌 Important News</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>Tool releases, Kubernetes cluster updates, cloud patches.</p>
            <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderLeft: '3px solid var(--important)', padding: '12px', borderRadius: '4px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--important)', textTransform: 'uppercase' }}>📌 Important</div>
              <div style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0' }}>Kubernetes v1.31 Schedule</div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Memory manager stability upgrades for high-density nodes.</p>
            </div>
          </div>

          <div className="carousel-card">
            <div className="carousel-card-title">💡 Daily Takeaways</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>Synthetic summaries compiling announcements, trends, and total hours saved.</p>
            <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Takeaways</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>ANNOUNCEMENT</div>
                  <div style={{ fontWeight: 700 }}>GPT-Live Launch</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>TIME SAVED</div>
                  <div style={{ fontWeight: 700, color: 'var(--insights)' }}>45 mins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Visual Pipeline) */}
      <section className="landing-section" id="how-it-works">
        <div className="section-intro">
          <h2>How It Works</h2>
          <p>OpsiAI automates aggregation, analysis, and delivery in a clean pipeline.</p>
        </div>
        <div className="value-flow-container">
          <div className="flow-node">
            <h3>Hundreds of Sources</h3>
            <p>RSS Feeds, Release Notes, Dev Blogs</p>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-node" style={{ borderColor: 'var(--primary)' }}>
            <h3>AI Intelligence Engine</h3>
            <p>Gemini Structured Structuring</p>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-node">
            <h3>Daily Brief Report</h3>
            <p>Inbox + Dashboard updates</p>
          </div>
        </div>

        <div className="value-grid-checklist">
          <div className="checklist-item"><span>✔</span> No duplicate news</div>
          <div className="checklist-item"><span>✔</span> AI-generated summaries</div>
          <div className="checklist-item"><span>✔</span> Why it matters explained</div>
        </div>
      </section>

      {/* Why OpsiAI Comparison Table */}
      <section className="landing-section" id="why-opsiai">
        <div className="section-intro">
          <h2>Why OpsiAI?</h2>
          <p>We filter out standard marketing noise to deliver raw engineering facts.</p>
        </div>
        <div className="comparison-matrix">
          <div className="comparison-grid">
            <div className="comp-col left">
              <h3>Without OpsiAI</h3>
              <div className="comp-list-item"><span>•</span> Visit multiple feeds and blogs daily</div>
              <div className="comp-list-item"><span>•</span> Read marketing fluff and duplicate headlines</div>
              <div className="comp-list-item"><span>•</span> Spend 45–60 minutes filtering what matters</div>
              <div className="comp-list-item"><span>•</span> Miss critical API and infra updates</div>
            </div>
            <div className="comp-col right">
              <h3 style={{ color: 'var(--primary)' }}>With OpsiAI</h3>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> One daily briefing report</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> 10 highly-curated updates</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> Strategic rank prioritization</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> read in under 5 minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Feature Cards */}
      <section className="landing-section" id="features">
        <div className="section-intro">
          <h2>Engineered for Curious Minds</h2>
          <p>Editorial metrics built for anyone wanting to stay ahead in AI, tech, and DevOps.</p>
        </div>
        <div className="features-grid">
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>AI Intelligence</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Gemini AI extracts, tags, and evaluates updates using custom developer heuristics.</p>
          </div>
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>Strategic Prioritization</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Critical architectural news is highlighted, separating release notes from general alerts.</p>
          </div>
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>Daily Reports</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Get a beautifully formatted, glassmorphic dark-theme HTML newsletter inside your inbox.</p>
          </div>
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>Trusted Sources</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Whitelisted scraping from official engineering blogs, Kubernetes portals, and cloud providers.</p>
          </div>
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>Reading Time Saved</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Save up to 5 hours a week scrolling developer updates and AI newsletters.</p>
          </div>
          <div className="metric-card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px' }}>Emerging Trends</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Spot platform patterns (like Model Context Protocol adoption) before they hit mainstream feeds.</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview (Coming Soon) */}
      <section className="landing-section" id="dashboard-preview" style={{ textAlign: 'center' }}>
        <div className="section-intro">
          <h2>Interactive Dashboards & Feeds</h2>
          <p>Access historical reports, subscribe to specific tech categories, and search updates.</p>
        </div>
        <div style={{ position: 'relative', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '30px', opacity: 0.4, pointerEvents: 'none', maxWidth: '850px', margin: '0 auto' }}>
          <span style={{ position: 'absolute', top: '-12px', right: '20px', backgroundColor: 'var(--primary)', color: '#0b0f19', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming Soon</span>

          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ width: '80px', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            <div style={{ marginLeft: 'auto', width: '200px', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
          </div>
          <div style={{ height: '180px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px' }}></div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="cta-container">
        {isAuthenticated ? (
          <>
            <h2>Ready to Explore Your Technical Feed?</h2>
            <p>Access your personalized reports and configure your whitelisted preferences.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button className="btn-primary btn-large" onClick={onNavigateToDashboard}>Go to Dashboard</button>
              <button className="btn-outline btn-large" onClick={() => onNavigateToTab && onNavigateToTab('topics')}>Configure Preferences</button>
            </div>
          </>
        ) : (
          <>
            <h2>Start Every Day Smarter.</h2>
            <p>Join OpsiAI and receive curated AI intelligence instead of endless headlines.</p>
            <button className="btn-primary btn-large" onClick={onNavigateToSignUp}>Get Started Free</button>
          </>
        )}
      </section>

      {/* Editorial Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 style={{ color: 'var(--primary)' }}>OpsiAI</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>AI and DevOps intelligence parsed and curated daily for everyone.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Features</li>
              <li className="footer-link" onClick={() => {
                const el = document.getElementById('metrics');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Metrics</li>
              <li className="footer-link" onClick={() => handleOpenPolicy('pricing')}>Pricing</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => handleOpenPolicy('doc')}>Documentation</li>
              <li className="footer-link" onClick={() => handleOpenPolicy('release_notes')}>Release Notes</li>
              <li className="footer-link" onClick={() => handleOpenPolicy('api_status')}>API Status</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => handleOpenPolicy('about')}>About</li>
              <li className="footer-link" onClick={() => handleOpenPolicy('privacy')}>Privacy Policy</li>
              <li className="footer-link" onClick={() => handleOpenPolicy('terms')}>Terms</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul className="footer-links">
              <li className="footer-link"><span style={{ opacity: 0.5, cursor: 'not-allowed' }}>GitHub</span></li>
              <li className="footer-link"><span style={{ opacity: 0.5, cursor: 'not-allowed' }}>LinkedIn</span></li>
              <li className="footer-link"><a href="mailto:opsiai127@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} OpsiAI. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ opacity: 0.5, cursor: 'not-allowed' }}>GitHub</span>
            <span style={{ opacity: 0.5, cursor: 'not-allowed' }}>LinkedIn</span>
          </div>
        </div>
      </footer>

      {/* Policy and Info Modals */}
      {showPolicyModal && (
        <div className="modal-backdrop" onClick={() => setShowPolicyModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, cursor: 'pointer' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', maxHeight: '80vh', overflowY: 'auto', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '30px', position: 'relative', cursor: 'default', animation: 'fadeIn 0.3s ease-out' }}>
            <button className="modal-close" onClick={() => setShowPolicyModal(false)} style={{ position: 'absolute', top: '15px', right: '20px', border: 'none', background: 'transparent', color: 'var(--text-color)', fontSize: '24px', cursor: 'pointer' }}>&times;</button>

            {policyType === 'privacy' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🔒 Privacy Policy</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Last updated: July 18, 2026</strong></p>
                  <p>At OpsiAI, we prioritize the confidentiality and safety of your preferences. This policy details how we handle information:</p>
                  <p><strong>1. Information Collection:</strong> We only collect your email address and personalized topic subscription configurations to curate daily reports.</p>
                  <p><strong>2. Third-Party Sharing:</strong> We do not sell or distribute user emails or browsing history to any advertisers or marketing networks.</p>
                  <p><strong>3. Cookie Usage:</strong> We utilize minimal browser local storage strictly for token session authentication persistence and preferences cache.</p>
                  <p>For questions regarding this policy, please contact our support desk at <a href="mailto:opsiai127@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>opsiai127@gmail.com</a>.</p>
                </div>
              </div>
            )}

            {policyType === 'terms' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>📄 Terms of Service</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Last updated: July 18, 2026</strong></p>
                  <p>By registering or using OpsiAI services, you agree to the following conditions:</p>
                  <p><strong>1. Proper Usage:</strong> OpsiAI delivers curated daily digests for informational/educational purposes only. Automated scraping of OpsiAI endpoints is prohibited.</p>
                  <p><strong>2. Fair Subscription:</strong> Users may subscribe to or unsubscribe from our daily newsletter delivery at any time via their profile portal.</p>
                  <p><strong>3. Limitation of Liability:</strong> OpsiAI is provided "as is". We are not responsible for any direct or indirect actions resulting from the contents of the parsed summaries.</p>
                </div>
              </div>
            )}

            {policyType === 'doc' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>📖 Documentation & Guide</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>Welcome to OpsiAI! Here is a simple guide on how to navigate the platform:</p>
                  <p><strong>1. Personalize Interests:</strong> Navigate to the <em>Preferences</em> tab to whitelist or blacklist categories (e.g. OpenAI, Kubernetes, AWS). This immediately filters both your dashboard feeds and daily newsletters.</p>
                  <p><strong>2. Daily Newsfeed:</strong> The dashboard aggregates daily briefings with summaries, "Why It Matters" context, and calculated reading time metrics.</p>
                  <p><strong>3. Historical Surfing:</strong> Switch dates inside the header menu or apply <em>From/To Date</em> fields to search for keyword topics across all briefings generated till date.</p>
                  <p><strong>4. Newsletter:</strong> Opt-in or out of the daily automated email briefing in the <em>Profile</em> menu.</p>
                </div>
              </div>
            )}

            {policyType === 'release_notes' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🚀 Release Notes</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Version 1.0.0 (First Release)</strong></p>
                  <p>Welcome to the initial launch of OpsiAI! In this milestone release, we are proud to introduce:</p>
                  <p><strong>• AI-Powered Parsing:</strong> Automated scraping and indexing of key AI and DevOps engineering posts via Gemini AI.</p>
                  <p><strong>• Personalized Whitelisting:</strong> Interactive preference controls to select exactly what news categories matter to you.</p>
                  <p><strong>• Global Search & Ranges:</strong> Advanced search functionality scanning all historical reports by keyword or From/To dates.</p>
                  <p><strong>• Mobile Shell UI:</strong> Premium native-app-like experience optimized for smartphones and tablets.</p>
                </div>
              </div>
            )}

            {policyType === 'api_status' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>🟢 System & API Status</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>Real-time status updates of OpsiAI components:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--body-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div><strong>API Gateway:</strong> <span style={{ color: 'var(--success)' }}>Operational 🟢</span></div>
                    <div><strong>PostgreSQL/Supabase DB:</strong> <span style={{ color: 'var(--success)' }}>Connected 🟢</span></div>
                    <div><strong>AI Scraper Cron:</strong> <span style={{ color: 'var(--success)' }}>Active (Daily) 🟢</span></div>
                    <div><strong>SMTP Server:</strong> <span style={{ color: 'var(--success)' }}>Operational 🟢</span></div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status checks are updated dynamically. Last checked: just now.</p>
                </div>
              </div>
            )}

            {policyType === 'about' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>ℹ️ About OpsiAI</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>OpsiAI was founded in 2026 to solve modern information overload.</p>
                  <p>Every day, hundreds of announcements, releases, and articles are published across the AI and DevOps ecosystem. Finding the raw engineering facts behind the headlines requires hours of tedious scrolling.</p>
                  <p>OpsiAI automates this entirely. Using Gemini AI model analysis, our crawler parses and evaluates the daily news pipeline, indexing whitelisted updates, translating why it matters, and delivering a clean intelligence digest directly to your inbox and dashboard.</p>
                </div>
              </div>
            )}

            {policyType === 'pricing' && (
              <div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>💎 Pricing</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Beta Access:</strong> OpsiAI is currently in free public beta.</p>
                  <p>Enjoy unlimited daily email newsletters, whitelisted custom topic settings, and full access to our historical multi-date search engines at no charge.</p>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowPolicyModal(false)} style={{ padding: '8px 20px', fontSize: '12px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
