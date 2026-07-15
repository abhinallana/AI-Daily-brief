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
            <li className="nav-link" onClick={() => onNavigateToTab && onNavigateToTab('reports')}>Reports</li>
            <li className="nav-link" onClick={() => onNavigateToTab && onNavigateToTab('topics')}>Topics</li>
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
          <div className="hero-tag">Platform for Technical Teams</div>
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
            <button className="btn-primary btn-large" onClick={onNavigateToSignUp}>Get Started Free</button>
            <button className="btn-outline btn-large" onClick={onViewDemo}>View Today's Report</button>
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
          <h2>See What You'll Receive Every Morning</h2>
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
          <h2>Engineered for Technical Teams</h2>
          <p>Editorial metrics built for developers, architects, and product leads.</p>
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
        <h2>Start Every Morning Smarter.</h2>
        <p>Join OpsiAI and receive curated AI intelligence instead of endless headlines.</p>
        <button className="btn-primary btn-large" onClick={onNavigateToSignUp}>Get Started Free</button>
      </section>

      {/* Editorial Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 style={{ color: 'var(--primary)' }}>OpsiAI</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>Technical intelligence parsed and curated daily for cloud teams.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li className="footer-link">Features</li>
              <li className="footer-link">Metrics</li>
              <li className="footer-link">Pricing</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li className="footer-link">Documentation</li>
              <li className="footer-link">Release Notes</li>
              <li className="footer-link">API Status</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li className="footer-link">About</li>
              <li className="footer-link">Privacy Policy</li>
              <li className="footer-link">Terms</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul className="footer-links">
              <li className="footer-link">GitHub</li>
              <li className="footer-link">LinkedIn</li>
              <li className="footer-link">Contact Support</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} OpsiAI. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>GitHub</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
