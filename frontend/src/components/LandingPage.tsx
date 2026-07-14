import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onViewDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onViewDemo }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-container">
      {/* Background radial glows */}
      <div className="landing-glow-1"></div>
      <div className="landing-glow-2"></div>

      {/* Navigation Header */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span>OpsiAI</span>
        </div>
        <ul className="nav-items">
          <li className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</li>
          <li className="nav-link" onClick={() => document.getElementById('why-opsiai')?.scrollIntoView({ behavior: 'smooth' })}>Why OpsiAI</li>
          <li className="nav-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How it Works</li>
          <li className="nav-link" onClick={() => document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' })}>Dashboard</li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-secondary" onClick={onOpenLogin}>Sign In</button>
          <button className="btn-primary" onClick={onOpenLogin}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-container">
        <div className="hero-left">
          <div className="hero-tag">🔥 Intelligent Technical Briefings</div>
          <h1 className="hero-title">
            <span>Cut Through the Noise.</span><br />
            <span className="accent-gradient">Stay Ahead of AI.</span>
          </h1>
          <p className="hero-subtitle">
            Every day OpsiAI scans hundreds of trusted AI and DevOps sources,
            filters what truly matters, explains why it matters,
            and delivers one concise intelligence report directly to your inbox.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={onOpenLogin}>🚀 Get Started Free</button>
            <button className="btn-outline btn-large" onClick={onViewDemo}>👀 View Live Demo</button>
          </div>
        </div>

        <div className="hero-right">
          {/* Floating email client mockup */}
          <div className="email-mockup-wrapper">
            <div className="email-mockup-header">
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              </div>
              <div>From: OpsiAI Briefings &lt;brief@opsiai.com&gt;</div>
              <div style={{ fontWeight: 600, color: 'var(--text-color)', marginTop: '4px' }}>Subject: OpsiAI Daily Brief - July 14, 2026</div>
            </div>
            <div className="email-mockup-window">
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>OpsiAI</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TODAY'S LATEST AI UPDATES</p>
              </div>

              {/* Snapshot component mockup */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's AI Snapshot</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div>🚨 Strategic : <span style={{ color: 'var(--strategic)', fontWeight: 700 }}>2</span></div>
                  <div>📌 Important : <span style={{ color: 'var(--important)', fontWeight: 700 }}>6</span></div>
                  <div>ℹ️ Insights : <span style={{ color: 'var(--insights)', fontWeight: 700 }}>4</span></div>
                </div>
              </div>

              {/* Article Card Mockup */}
              <div style={{ borderLeft: '3px solid var(--strategic)', paddingLeft: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--strategic)', fontWeight: 700 }}>🚨 Strategic</div>
                <div style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0' }}>Introducing GPT-Live Agent APIs</div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <strong>Why it matters:</strong> OpenAI releases native agentic APIs lowering overhead for custom orchestration stacks.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--important)', paddingLeft: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--important)', fontWeight: 700 }}>📌 Important</div>
                <div style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0' }}>Announcing etcd v3.7.0</div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <strong>Why it matters:</strong> RangeStream features directly boost Kubernetes cluster scalability and responsiveness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Showcase Horizontal Carousel */}
      <section className="landing-section" id="showcase">
        <div className="section-intro">
          <h2>See What You'll Receive Every Morning</h2>
          <p>We convert infinite RSS updates into prioritized, actionable engineering insights.</p>
        </div>
        <div className="carousel-wrapper">
          <div className="carousel-card">
            <div className="carousel-card-title">🚨 Strategic Updates</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>High-impact framework announcements and foundational Shifts.</div>
            <div style={{ background: '#111523', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', height: '140px' }}>
              <div style={{ fontSize: '11px', color: 'var(--strategic)', fontWeight: 700, textTransform: 'uppercase' }}>🚨 Strategic</div>
              <div style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0' }}>Anthropic Releases Claude 4</div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Architectures featuring native loop tools and memory caching.</p>
            </div>
          </div>

          <div className="carousel-card">
            <div className="carousel-card-title">📌 Important News</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Secondary releases, infrastructure updates, and tools versions.</div>
            <div style={{ background: '#111523', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', height: '140px' }}>
              <div style={{ fontSize: '11px', color: 'var(--important)', fontWeight: 700, textTransform: 'uppercase' }}>📌 Important</div>
              <div style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0' }}>Kubernetes v1.31 Release</div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Stability improvements for kubelet memory management.</p>
            </div>
          </div>

          <div className="carousel-card">
            <div className="carousel-card-title">🎯 Daily Takeaways</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Executive metrics tracking announcements, trends, and time saved.</div>
            <div style={{ background: '#111523', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', height: '140px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '4px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Announcement</div>
                  <div style={{ fontWeight: 700 }}>GPT-Live Launch</div>
                </div>
                <div style={{ borderLeft: '2px solid var(--success)', paddingLeft: '4px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Time Saved</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>45 mins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="landing-section" id="how-it-works">
        <div className="section-intro">
          <h2>From Information to Intelligence</h2>
          <p>We automate the engineering study pipeline from source feeds to final analysis.</p>
        </div>
        <div className="value-flow-container">
          <div className="flow-node">
            <h3>Hundreds of Sources</h3>
            <p>RSS Feeds, Blogs, Release Notes</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 20px var(--primary-glow)' }}>
            <h3>AI Analysis</h3>
            <p>Gemini 2.5 Flash Parsing</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">
            <h3>One Report</h3>
            <p>Inbox & Dashboard Updates</p>
          </div>
        </div>

        <div className="value-grid-checklist">
          <div className="checklist-item"><span>✔</span> No duplicate news</div>
          <div className="checklist-item"><span>✔</span> AI-generated summaries</div>
          <div className="checklist-item"><span>✔</span> Why it matters explained</div>
          <div className="checklist-item"><span>✔</span> Strategic categorization</div>
          <div className="checklist-item"><span>✔</span> Reading time saved</div>
          <div className="checklist-item"><span>✔</span> Trusted sources only</div>
        </div>
      </section>

      {/* Why OpsiAI Comparison Table */}
      <section className="landing-section" id="why-opsiai">
        <div className="section-intro">
          <h2>Is OpsiAI For You?</h2>
          <p>Compare the old way of keeping up with AI to the intelligent OpsiAI platform.</p>
        </div>
        <div className="comparison-matrix">
          <div className="comparison-grid">
            <div className="comp-col left">
              <h3><span>❌</span> Without OpsiAI</h3>
              <div className="comp-list-item"><span>•</span> Visit dozens of websites daily</div>
              <div className="comp-list-item"><span>•</span> Read marketing buzz and duplicate headlines</div>
              <div className="comp-list-item"><span>•</span> Spend 45–60 minutes filtering articles</div>
              <div className="comp-list-item"><span>•</span> Miss critical API and library updates</div>
              <div className="comp-list-item"><span>•</span> Struggle to connect AI advancements to cloud ops</div>
            </div>
            <div className="comp-col right">
              <h3><span style={{ color: 'var(--primary)' }}>⚡</span> With OpsiAI</h3>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> One daily briefing report</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> 10 highly-curated engineering articles</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> Importance pre-ranked (Strategic vs Important)</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> Read in under 5 minutes</div>
              <div className="comp-list-item"><span style={{ color: 'var(--success)' }}>✔</span> Instant "Why it matters" developer significance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-section" id="features">
        <div className="section-intro">
          <h2>Engineered for Technical Teams</h2>
          <p>Everything you need to stay on top of the fast-paced AI ecosystem without information fatigue.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🧠</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>AI Intelligence</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Gemini AI extracts, tags, and evaluates updates using custom developer heuristics.</p>
          </div>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚨</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Strategic Prioritization</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Critical architectural news is highlighted, separating release notes from general alerts.</p>
          </div>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📬</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Daily Delivery</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Get a beautifully formatted, glassmorphic dark-theme HTML newsletter inside your inbox.</p>
          </div>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏱</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Time Saved</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Save up to 5 hours a week scrolling developer updates and AI newsletters.</p>
          </div>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Trusted Sources Only</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Whitelisted scraping from official engineering blogs, Kubernetes portals, and cloud providers.</p>
          </div>
          <div className="flow-node" style={{ textAlign: 'left', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📈</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Emerging Trends</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Spot platform patterns (like Model Context Protocol adoption) before they hit mainstream feeds.</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Coming Soon */}
      <section className="landing-section" id="dashboard-preview" style={{ textAlign: 'center' }}>
        <div className="section-intro">
          <h2>Interactive Dashboards & Feeds</h2>
          <p>Access historical intelligence reports, configure topic channels, and query updates.</p>
        </div>
        <div style={{ position: 'relative', background: '#111523', border: '1px solid var(--border)', borderRadius: '20px', padding: '30px', opacity: 0.5, pointerEvents: 'none', maxWidth: '900px', margin: '0 auto' }}>
          <span style={{ position: 'absolute', top: '-12px', right: '20px', backgroundColor: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming Soon</span>
          
          {/* Mock Dashboard Layout */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ width: '80px', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            <div style={{ width: '120px', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            <div style={{ marginLeft: 'auto', width: '200px', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ height: '70px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}></div>
            <div style={{ height: '70px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}></div>
            <div style={{ height: '70px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}></div>
          </div>
          <div style={{ height: '200px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-section" id="testimonials">
        <div className="section-intro">
          <h2>Trusted By Devops & AI Engineers</h2>
          <p>See how platform engineers are staying on the cutting edge of AI.</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-quote">"OpsiAI has completely changed how our team tracks Kubernetes and AI integrations. The summaries are technically accurate and bypass the marketing fluff."</p>
            <div className="testimonial-author">
              <div className="avatar-placeholder"></div>
              <div className="author-info">
                <h4>Siddharth K.</h4>
                <p>Principal DevOps Architect</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-quote">"I used to spend my first 45 minutes of work reading AI newsletters. Now I just open OpsiAI's daily mail. It takes me 3 minutes to stay fully updated."</p>
            <div className="testimonial-author">
              <div className="avatar-placeholder"></div>
              <div className="author-info">
                <h4>Sarah M.</h4>
                <p>Lead AI Infrastructure Engineer</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-quote">"Finding actual Kubernetes and MCP updates without duplicate headlines was impossible. OpsiAI's deduping pipeline is a lifesaver."</p>
            <div className="testimonial-author">
              <div className="avatar-placeholder"></div>
              <div className="author-info">
                <h4>David L.</h4>
                <p>Staff Platform Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-container">
        <h2>Start Every Morning Smarter.</h2>
        <p>Join OpsiAI and receive curated AI intelligence instead of endless headlines.</p>
        <button className="btn-primary btn-large" onClick={onOpenLogin}>Get Started Free</button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>OpsiAI</h3>
            <p>Aggregating and analyzing AI updates for technical teams.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</li>
              <li className="footer-link">Roadmap</li>
              <li className="footer-link">Pricing</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li className="footer-link">Documentation</li>
              <li className="footer-link">API Reference</li>
              <li className="footer-link">Status Page</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li className="footer-link">About us</li>
              <li className="footer-link">Privacy Policy</li>
              <li className="footer-link">Terms of Service</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <ul className="footer-links">
              <li className="footer-link">GitHub</li>
              <li className="footer-link">LinkedIn</li>
              <li className="footer-link">Discord</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} OpsiAI. All rights reserved.</div>
          <div className="footer-socials">
            <span>GitHub</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
