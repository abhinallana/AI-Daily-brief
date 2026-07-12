import React, { useState } from 'react';
import type { Article } from '../services/api';

interface ArticleFeedProps {
  articles: Article[];
}

export const ArticleFeed: React.FC<ArticleFeedProps> = ({ articles }) => {
  const [filter, setFilter] = useState<'All' | 'Strategic' | 'Important' | 'Insights'>('All');

  const filteredArticles = articles.filter(art => {
    if (filter === 'All') return true;
    const pri = art.priority || 'Insights';
    if (filter === 'Insights') {
      return pri === 'Insights' || pri === 'Informational';
    }
    return pri.toLowerCase() === filter.toLowerCase();
  });

  const strategicArticles = filteredArticles.filter(a => a.priority === 'Strategic');
  const importantArticles = filteredArticles.filter(a => a.priority === 'Important');
  const insightsArticles = filteredArticles.filter(a => a.priority === 'Insights' || a.priority === 'Informational');

  const renderSection = (title: string, cssClass: string, sectionArticles: Article[]) => {
    if (sectionArticles.length === 0) return null;
    return (
      <div key={title} style={{ marginBottom: '35px' }}>
        <h2 className={`section-title ${cssClass}`}>{title}</h2>
        <div className="feed-grid">
          {sectionArticles.map((art, idx) => (
            <div key={art.link_hash || idx} className="article-card">
              <div className="article-header">
                <div className="badge-group">
                  <span className={`badge ${cssClass}`}>{art.priority}</span>
                  {art.category && <span className="badge category">{art.category}</span>}
                </div>
                {art.reading_time && <span className="article-read-time">{art.reading_time}</span>}
              </div>
              <h3 className="article-title">
                <a href={art.link} target="_blank" rel="noopener noreferrer">
                  {art.title}
                </a>
              </h3>
              <div className="article-meta-row">
                <div>
                  <div className="meta-field-label">Source</div>
                  <div className="meta-field-value">{art.icon} {art.source || 'Unknown'}</div>
                </div>
                <div>
                  <div className="meta-field-label">Why it matters</div>
                  <div className="meta-field-value">
                    {art.why_it_matters && art.why_it_matters !== 'None'
                      ? art.why_it_matters
                      : 'Key service updates and architectural shifts relevant to engineering pipelines.'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <div className="feed-filter-bar">
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>AI Updates Feed</h2>
        <div className="filter-group">
          {(['All', 'Strategic', 'Important', 'Insights'] as const).map(tab => (
            <button
              key={tab}
              className={`filter-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="article-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No articles found matching this filter.</p>
        </div>
      ) : (
        <>
          {renderSection('🚨 Strategic', 'strategic', strategicArticles)}
          {renderSection('📌 Important', 'important', importantArticles)}
          {renderSection('ℹ️ Insights', 'insights', insightsArticles)}
        </>
      )}
    </div>
  );
};
