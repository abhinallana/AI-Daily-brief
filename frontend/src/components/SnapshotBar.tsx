import React from 'react';
import type { Article } from '../services/api';

interface SnapshotBarProps {
  articles: Article[];
}

export const SnapshotBar: React.FC<SnapshotBarProps> = ({ articles }) => {
  const strategicCount = articles.filter(a => a.priority === 'Strategic').length;
  const importantCount = articles.filter(a => a.priority === 'Important').length;
  const insightsCount = articles.filter(a => a.priority === 'Insights' || a.priority === 'Informational').length;

  const categories = articles.map(a => a.category).filter(Boolean) as string[];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTopics = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);

  const totalReadingTime = articles.reduce((acc, art) => {
    if (art.reading_time) {
      const match = art.reading_time.match(/\d+/);
      if (match) {
        return acc + parseInt(match[0], 10);
      }
    }
    return acc;
  }, 0) || articles.length * 2;

  return (
    <div className="snapshot-bar">
      <div className="snapshot-counters">
        <div className="counter-item">
          <span>🚨</span> Strategic : {strategicCount}
        </div>
        <div className="counter-item">
          <span>📌</span> Important : {importantCount}
        </div>
        <div className="counter-item">
          <span>ℹ️</span> Insights : {insightsCount}
        </div>
      </div>

      {topTopics.length > 0 && (
        <div className="snapshot-topics">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Top Topics:</span>
          {topTopics.map(topic => (
            <span key={topic} className="topic-tag">
              • {topic}
            </span>
          ))}
        </div>
      )}

      <div className="snapshot-time">
        <div className="snapshot-time-label">Estimated Reading Time</div>
        <div className="snapshot-time-val">{totalReadingTime} minutes</div>
      </div>
    </div>
  );
};
