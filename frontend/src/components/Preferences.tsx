import React, { useState } from 'react';

export const Preferences: React.FC = () => {
  const [topics, setTopics] = useState([
    { name: 'OpenAI', description: 'Announcements and updates regarding ChatGPT, GPT-4/5/6, and APIs.', enabled: true },
    { name: 'Kubernetes', description: 'Container orchestration, cluster scaling, and platform engineering.', enabled: true },
    { name: 'AWS', description: 'Amazon Web Services, bedrock models, and cloud infrastructure.', enabled: true },
    { name: 'GitHub', description: 'GitHub Copilot, actions, and developer workflow automation.', enabled: true },
    { name: 'Anthropic', description: 'Claude models, reasoning research, and prompt engineering.', enabled: false },
    { name: 'Meta', description: 'Llama models, open-source AI, and PyTorch tooling.', enabled: true },
  ]);

  const toggleTopic = (index: number) => {
    setTopics(topics.map((t, idx) => idx === index ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="preferences-panel">
      <div className="preferences-intro">
        <h2>My AI Topics Subscriptions</h2>
        <p>Customize the feeds and categories you receive in your daily briefing dashboards and emails.</p>
      </div>

      <div className="preferences-list">
        {topics.map((topic, idx) => (
          <div key={topic.name} className="preference-item">
            <div className="preference-info">
              <h3>{topic.name}</h3>
              <p>{topic.description}</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={topic.enabled}
                onChange={() => toggleTopic(idx)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
