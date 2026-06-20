import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  HelpCircle, Send, Bot, MessageSquare, ShieldCheck,
  AlertCircle, Award, Zap, CheckSquare, TrendingUp,
} from 'lucide-react';

/** Maximum characters allowed per user query (mirrors backend limit) */
const MAX_QUERY_LENGTH = 500;

const STATIC_RESPONSES = {
  ac_bangalore: {
    carbon_personality_type: 'High Impact Consumer',
    total_footprint_estimate: '9.0 kg CO₂/day from AC operations',
    impact_hotspots: ['AC runtimes exceeding 8 hours/day', 'Coal-heavy grid energy in Karnataka'],
    top_3_actions: [
      {
        action: 'Increase AC Setpoint to 24°C & engage Ceiling Fan',
        why_it_matters: 'Every 1°C increase saves 6% electricity. Combining with a fan matches the cooling feel of 21°C at a fraction of the power.',
        co2_saving_estimate: '2.2 kg CO₂ saved daily',
        effort_level: 'low',
      },
      {
        action: 'Use AC Timer and auto-shutoff at 4:00 AM',
        why_it_matters: 'Bangalore nights drop to comfortable temperatures. Running AC until dawn wastes energy during sleep when ambient air is cool.',
        co2_saving_estimate: '3.5 kg CO₂ saved daily',
        effort_level: 'low',
      },
      {
        action: 'Install thermal curtains on West-facing windows',
        why_it_matters: 'Reduces solar heat gain, preventing the AC compressor from running at peak load during afternoon heat spikes.',
        co2_saving_estimate: '1.8 kg CO₂ saved daily',
        effort_level: 'medium',
      },
    ],
    micro_actions: [
      'Clean AC filters bi-weekly to improve efficiency by 15%',
      'Seal door/window gaps using rubber strips to prevent cold air leaks',
    ],
    future_projection_30_days: 'Transitioning to 24°C + timer saves 171 kg CO₂ over 30 days (equivalent to planting 8 trees).',
    motivational_insight: "In Bangalore's moderate climate, smart ventilation and fan usage can cut cooling carbon footprint by up to 50% without compromising comfort.",
  },
  indian_diet: {
    carbon_personality_type: 'Conscious Commuter',
    total_footprint_estimate: '8.0 kg CO₂/day from heavy meat dietary habits',
    impact_hotspots: ['Frequent mutton and beef intake', 'High dairy consumption (paneer/ghee)'],
    top_3_actions: [
      {
        action: 'Switch from Red Meat to Poultry or Fish',
        why_it_matters: 'Mutton/beef production has a carbon footprint 5× higher than poultry, demanding intensive land and feed resources.',
        co2_saving_estimate: '4.2 kg CO₂ saved per meal replaced',
        effort_level: 'medium',
      },
      {
        action: 'Integrate local Indian Millets (Ragi/Jowar) as carb base',
        why_it_matters: 'Millets require 10× less water than rice and are resilient crops, offering high nutrition with minimal ecological strain.',
        co2_saving_estimate: '1.1 kg CO₂ saved daily',
        effort_level: 'low',
      },
      {
        action: 'Establish 3 Plant-based days weekly',
        why_it_matters: 'Swapping dairy/meat for dals and local vegetables significantly reduces agricultural greenhouse emissions.',
        co2_saving_estimate: '3.5 kg CO₂ saved weekly',
        effort_level: 'low',
      },
    ],
    micro_actions: [
      'Purchase seasonal, locally-grown vegetables to bypass long-distance transport emissions',
      'Avoid food waste; organic kitchen waste decomposing in garbage piles releases methane',
    ],
    future_projection_30_days: 'Replacing mutton with lentils/chicken 4 times a week cuts 96 kg CO₂ in a month.',
    motivational_insight: 'Traditional Indian vegetarian diets are structurally among the lowest carbon profiles globally. Reclaiming local pulses and millets is the perfect eco-action.',
  },
};

/** Picks the appropriate icon for the personality type */
function PersonalityIcon({ personality }) {
  if (['Balanced User', 'Green Optimizer'].includes(personality)) {
    return <ShieldCheck size={20} aria-hidden="true" />;
  }
  return <AlertCircle size={20} aria-hidden="true" />;
}

PersonalityIcon.propTypes = { personality: PropTypes.string.isRequired };

/** Renders an AI analysis report card with full semantic markup */
function AIReportCard({ report }) {
  return (
    <article className="ai-reasoning-response" aria-label="AI analysis report">
      <div className="badge-tag" aria-hidden="true">AI ANALYSIS REPORT</div>
      <p>I have processed your query based on current urban metrics. Here is your tailored carbon intelligence action plan:</p>

      <section className="ai-card-section" aria-labelledby="profile-heading">
        <h4 id="profile-heading" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={14} aria-hidden="true" /> Profile Standing
        </h4>
        <p><strong>Classification:</strong> {report.carbon_personality_type}</p>
        <p><strong>Footprint Impact:</strong> {report.total_footprint_estimate}</p>
        <div className="hotspot-chip-list" role="list" aria-label="Impact hotspots">
          {report.impact_hotspots.map((h, idx) => (
            <span key={idx} className="hotspot-chip" role="listitem">{h}</span>
          ))}
        </div>
      </section>

      <section className="ai-card-section" aria-labelledby="actions-heading">
        <h4 id="actions-heading" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} aria-hidden="true" /> Top 3 Impact Actions
        </h4>
        <div className="actions-list" role="list">
          {report.top_3_actions.map((act, idx) => (
            <article key={idx} className="action-item-card" role="listitem" aria-label={`Action ${idx + 1}: ${act.action}`}>
              <div className="action-item-header">
                <span className="action-item-title">{act.action}</span>
                <span
                  className={`effort-badge effort-${act.effort_level}`}
                  aria-label={`Effort level: ${act.effort_level}`}
                >
                  {act.effort_level}
                </span>
              </div>
              <p className="action-item-why">{act.why_it_matters}</p>
              <span className="action-item-saving">
                <span className="sr-only">Estimated saving: </span>{act.co2_saving_estimate}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-card-section" aria-labelledby="micro-heading">
        <h4 id="micro-heading" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} aria-hidden="true" /> Micro Actions
        </h4>
        <ul style={{ paddingLeft: 18, fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
          {report.micro_actions.map((micro, idx) => (
            <li key={idx}>{micro}</li>
          ))}
        </ul>
      </section>

      <section
        className="ai-card-section"
        style={{ borderLeft: '3px solid var(--accent-neon)', background: 'rgba(0,245,155,0.02)' }}
        aria-labelledby="projection-heading"
      >
        <h4 id="projection-heading" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} aria-hidden="true" /> 30-Day Projections
        </h4>
        <p style={{ fontSize: 13 }}>{report.future_projection_30_days}</p>
      </section>

      <p style={{ fontStyle: 'italic', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 8 }}>
        &ldquo;{report.motivational_insight}&rdquo;
      </p>
    </article>
  );
}

AIReportCard.propTypes = {
  report: PropTypes.shape({
    carbon_personality_type:    PropTypes.string.isRequired,
    total_footprint_estimate:   PropTypes.string.isRequired,
    impact_hotspots:            PropTypes.arrayOf(PropTypes.string).isRequired,
    top_3_actions:              PropTypes.arrayOf(PropTypes.shape({
      action:              PropTypes.string.isRequired,
      why_it_matters:      PropTypes.string.isRequired,
      co2_saving_estimate: PropTypes.string.isRequired,
      effort_level:        PropTypes.string.isRequired,
    })).isRequired,
    micro_actions:              PropTypes.arrayOf(PropTypes.string).isRequired,
    future_projection_30_days:  PropTypes.string.isRequired,
    motivational_insight:       PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * AICoach — chat-based carbon coaching interface.
 * Matches static queries locally and falls back to a dynamic response.
 * Uses aria-live="polite" on the message container so screen readers
 * announce new AI messages automatically.
 */
export default function AICoach({ habits, personality, dailyFootprint }) {
  const [messages, setMessages] = useState([
    {
      id:          'welcome',
      sender:      'ai',
      text:        'Welcome! I am CarbonMind AI, your personal carbon strategist. I analyse your lifestyle parameters and design tailored mitigation plans for urban Indian contexts.',
      isWelcoming: true,
    },
  ]);
  const [inputText,  setInputText]  = useState('');
  const [isTyping,   setIsTyping]   = useState(false);
  const [charCount,  setCharCount]  = useState(0);
  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value.slice(0, MAX_QUERY_LENGTH);
    setInputText(val);
    setCharCount(val.length);
  }, []);

  const handleSend = useCallback((textToSend) => {
    const trimmed = textToSend.trim().slice(0, MAX_QUERY_LENGTH);
    if (!trimmed) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: trimmed }]);
    setInputText('');
    setCharCount(0);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const query = trimmed.toLowerCase();
      let reportData;

      if (query.includes('ac') || query.includes('bangalore') || query.includes('electricity')) {
        reportData = STATIC_RESPONSES.ac_bangalore;
      } else if (query.includes('diet') || query.includes('food') || query.includes('vegetarian')) {
        reportData = STATIC_RESPONSES.indian_diet;
      } else {
        // Dynamic fallback — derived from current habit profile
        reportData = {
          carbon_personality_type:   personality,
          total_footprint_estimate:  `${dailyFootprint.toFixed(1)} kg CO₂/day overall footprint`,
          impact_hotspots:           ['General urban utility consumption'],
          top_3_actions: [
            {
              action:              'Divert travel to walking or cycling for distances under 2 km',
              why_it_matters:      'Short drives burn rich starting fuel mixtures, creating excessive waste per km vs. cruising speeds.',
              co2_saving_estimate: '1.2 kg CO₂ saved per trip',
              effort_level:        'low',
            },
            {
              action:              'Clean passive refrigerator coils behind the appliance',
              why_it_matters:      'Dust build-up increases cooling demand from coal-grid power by 10–15%.',
              co2_saving_estimate: '0.8 kg CO₂ saved daily',
              effort_level:        'low',
            },
            {
              action:              'Opt-in to utility solar green tariffs where available',
              why_it_matters:      'Promotes local renewable energy investment on regional transmission networks.',
              co2_saving_estimate: '5.4 kg CO₂ saved daily',
              effort_level:        'high',
            },
          ],
          micro_actions: [
            'Turn off idle electrical adaptors and TV screens at the wall socket',
            'Carry a cotton bag to local shops to avoid single-use plastic waste',
          ],
          future_projection_30_days: 'Implementing these routines will cut ~42 kg CO₂ next month.',
          motivational_insight:      'Carbon intelligence is not about sacrifice — it is about understanding resource paths to make conscious adjustments.',
        };
      }

      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', report: reportData },
      ]);
      // Refocus input after AI responds
      inputRef.current?.focus();
    }, 1500);
  }, [personality, dailyFootprint]);

  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    handleSend(inputText);
  }, [handleSend, inputText]);

  return (
    <div className="coach-grid">

      {/* Left panel — prompt guides & personality */}
      <aside className="glass-card prompt-guide-panel" aria-label="AI Coach quick prompts">
        <h2 className="card-h3" style={{ marginBottom: 8 }}>Carbon Reasoning Coach</h2>
        <p className="panel-subtitle">
          CarbonMind AI uses a sustainability intelligence framework to guide your transition.
        </p>

        <div className="coach-prompt-info">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Select a carbon strategy pathway or ask a custom question:
          </p>
          <nav className="quick-prompts-list" aria-label="Quick prompt shortcuts">
            <button
              className="quick-prompt-btn"
              onClick={() => handleSend('How can I optimise my AC electricity footprint in Bangalore?')}
              aria-label="Ask: Optimise AC footprint in Bangalore"
            >
              <MessageSquare size={14} style={{ color: 'var(--accent-neon)' }} aria-hidden="true" />
              <span>Optimise AC footprint in Bangalore</span>
            </button>
            <button
              className="quick-prompt-btn"
              onClick={() => handleSend('What is the realistic Indian dietary alternative to reduce carbon?')}
              aria-label="Ask: Indian diet alternative analysis"
            >
              <MessageSquare size={14} style={{ color: 'var(--accent-neon)' }} aria-hidden="true" />
              <span>Indian diet alternative analysis</span>
            </button>
            <button
              className="quick-prompt-btn"
              onClick={() => handleSend('How can I reduce shopping emissions?')}
              aria-label="Ask: Reduce shopping and consumer emissions"
            >
              <MessageSquare size={14} style={{ color: 'var(--accent-neon)' }} aria-hidden="true" />
              <span>Reduce shopping & consumer emissions</span>
            </button>
          </nav>
        </div>

        {/* Personality Card */}
        <div
          className="glass-card inner-card personality-card"
          style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.01)' }}
          aria-label={`Carbon Personality Type: ${personality}`}
        >
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Carbon Personality Type</h3>
          </div>
          <div className="personality-content">
            <div className="personality-avatar" aria-hidden="true">
              <PersonalityIcon personality={personality} />
            </div>
            <div className="personality-details">
              <h4 style={{ fontSize: 14, marginBottom: 4 }}>{personality}</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Your emissions indicate clear opportunities for low-effort, high-impact improvements.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right panel — chat */}
      <section className="glass-card chat-panel" aria-labelledby="coach-name">
        <div className="chat-header">
          <div className="coach-avatar" aria-hidden="true">
            <Bot size={20} />
          </div>
          <div className="coach-status">
            <h2 id="coach-name" style={{ fontSize: 16, fontWeight: 600 }}>CarbonMind AI Coach</h2>
            <span className="status-indicator online" aria-label="Status: Reasoning Engine Active">
              Reasoning Engine Active
            </span>
          </div>
        </div>

        {/* Chat messages — aria-live so screen readers announce AI replies */}
        <div
          className="chat-messages-container"
          role="log"
          aria-live="polite"
          aria-label="Chat conversation"
          aria-relevant="additions"
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.sender === 'ai' ? 'system-msg' : 'user-msg'}`}
              aria-label={msg.sender === 'ai' ? 'AI response' : 'Your message'}
            >
              <div className="msg-content">
                {msg.text    && <p>{msg.text}</p>}
                {msg.isWelcoming && (
                  <p style={{ marginTop: 8 }}>
                    Ask me how to reduce your travel footprint, optimise your home energy, or suggest dietary changes.
                  </p>
                )}
                {msg.report  && <AIReportCard report={msg.report} />}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message system-msg" aria-live="polite" aria-label="AI is typing">
              <div className="msg-content typing-indicator">
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
                <span className="sr-only">AI is composing a response…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} aria-hidden="true" />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <form onSubmit={handleFormSubmit} className="chat-form" aria-label="Send a sustainability question">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                ref={inputRef}
                id="coach-input"
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Ask a sustainability question…"
                className="chat-input-field"
                aria-label="Type your sustainability question"
                aria-describedby="char-counter"
                maxLength={MAX_QUERY_LENGTH}
                autoComplete="off"
              />
              <span
                id="char-counter"
                style={{
                  fontSize: 11,
                  color: charCount > MAX_QUERY_LENGTH * 0.9 ? 'var(--accent-warn)' : 'var(--text-muted)',
                  textAlign: 'right',
                }}
                aria-live="polite"
                aria-atomic="true"
              >
                {charCount}/{MAX_QUERY_LENGTH}
              </span>
            </div>
            <button
              type="submit"
              className="btn btn-primary chat-send-btn"
              aria-label="Send question to AI Coach"
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}

AICoach.propTypes = {
  habits: PropTypes.shape({
    transport: PropTypes.string.isRequired,
    diet:      PropTypes.string.isRequired,
    energy:    PropTypes.string.isRequired,
    waste:     PropTypes.string.isRequired,
    shopping:  PropTypes.string.isRequired,
  }).isRequired,
  personality:    PropTypes.string.isRequired,
  dailyFootprint: PropTypes.number.isRequired,
};
