import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <div className="about-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-color)', marginBottom: '16px' }}>
        About OpsiAI Updates
      </h2>
      <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        OpsiAI is a modern, developer-centric AI Updates Intelligence platform. It aggregates, filters, summarizes, and prioritizes information from key RSS updates across the artificial intelligence and cloud engineering ecosystems.
      </p>

      <h2>What is OpsiAI used for?</h2>
      <p>
        OpsiAI is built specifically to address content overflow in tech sectors. It streamlines your daily feed by tracking top AI developments (like OpenAI announcements, LLMs, framework releases) and Core DevOps utilities (such as Kubernetes orchestration patches, AWS updates, and CNCF releases).
      </p>

      <h2>Why use OpsiAI?</h2>
      <ul>
        <li>
          <span>💡</span>
          <div>
            <strong>Cuts Through Marketing Noise</strong>
            <p>Every article is analyzed to extract its exact developer significance (Why it matters) and technical highlights, skipping high-level PR descriptions.</p>
          </div>
        </li>
        <li>
          <span>🚨</span>
          <div>
            <strong>Relevance & Priority Categorization</strong>
            <p>Articles are prioritized into <em>Strategic</em> (critical updates), <em>Important</em> (weekly releases), or <em>Insights</em> (minor patches) so you can scan the day's brief in under 2 minutes.</p>
          </div>
        </li>
        <li>
          <span>⏳</span>
          <div>
            <strong>Real-time Caching & Time Saved Metrics</strong>
            <p>Estimates and keeps track of overall reading times. Integrates report summaries to display total hours of study and documentation saved for engineers.</p>
          </div>
        </li>
        <li>
          <span>📧</span>
          <div>
            <strong>Multi-channel Delivery</strong>
            <p>Consolidated daily reports are delivered seamlessly both through this interactive SaaS Dashboard UI and customized dark-themed emails right into your mailbox.</p>
          </div>
        </li>
      </ul>

      <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Running autonomously. Custom built for engineers, by engineers.
      </p>
    </div>
  );
};
