import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HelpCircle, Car, Utensils2, Zap, Trash2, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { EMISSION_FACTORS, GAUGE_CIRCUMFERENCE } from '../constants';

/** Helper: picks a contrasting impact colour */
function impactColour(val) {
  if (val > 7.0) return 'high-impact';
  if (val > 3.0) return 'medium-impact';
  return 'low-impact';
}

/**
 * Dashboard — real-time carbon impact score, habit modifiers, AI recommendation,
 * top-impact habits list and a savings trend chart.
 */
export default function Dashboard({
  habits,
  onHabitChange,
  score,
  dailyFootprint,
  level,
  weeklySaved,
  setActiveScreen,
}) {
  const [trendPeriod, setTrendPeriod] = useState('weekly');

  // Gauge fill (circumference of arc path = GAUGE_CIRCUMFERENCE)
  const strokeOffset = GAUGE_CIRCUMFERENCE - (score / 1000) * GAUGE_CIRCUMFERENCE;

  // Top-impact contributors sorted descending
  const impactStats = [
    { name: 'Commute Profile',  val: EMISSION_FACTORS.transport[habits.transport] ?? 0 },
    { name: 'Dietary Routine',  val: EMISSION_FACTORS.diet[habits.diet]           ?? 0 },
    { name: 'Home Electricity', val: EMISSION_FACTORS.energy[habits.energy]       ?? 0 },
    { name: 'Household Waste',  val: EMISSION_FACTORS.waste[habits.waste]         ?? 0 },
    { name: 'Shopping',         val: EMISSION_FACTORS.shopping[habits.shopping]   ?? 0 },
  ].sort((a, b) => b.val - a.val);

  // Trend chart data
  const trendData = trendPeriod === 'weekly'
    ? [
        { label: 'Wk 1', val: 25 },
        { label: 'Wk 2', val: 32 },
        { label: 'Wk 3', val: 28 },
        { label: 'Wk 4', val: 38 },
        { label: 'Wk 5', val: 42 },
        { label: 'Wk 6', val: weeklySaved },
      ]
    : [
        { label: 'Jan', val: 95  },
        { label: 'Feb', val: 120 },
        { label: 'Mar', val: 110 },
        { label: 'Apr', val: 145 },
        { label: 'May', val: 170 },
        { label: 'Jun', val: Math.round(weeklySaved * 4.2) },
      ];

  const maxVal = Math.max(...trendData.map(d => d.val), 50);

  const applyRecommendation = () => {
    if (habits.transport === 'car_single') onHabitChange('transport', 'metro');
    else if (habits.transport === 'car_pool') onHabitChange('transport', 'ev');
  };

  return (
    <div className="dashboard-grid">

      {/* 1. Carbon Score Gauge */}
      <div className="glass-card score-panel" aria-labelledby="score-title">
        <div className="card-header">
          <h2 id="score-title" className="card-h3">Carbon Impact Score</h2>
          <span
            className="info-icon"
            title="Carbon score ranges 0–1000. Higher is greener. Deducted by daily emissions."
            aria-label="Info: Carbon score ranges 0 to 1000"
          >
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>

        <div className="gauge-wrapper">
          <svg
            className="score-gauge"
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Carbon Impact Score: ${score} out of 1000. Level: ${level}`}
          >
            <title>Carbon Impact Score Gauge: {score}/1000</title>
            <defs>
              <linearGradient id="gauge-grad-react" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#ff4757" />
                <stop offset="50%"  stopColor="#ff9f43" />
                <stop offset="100%" stopColor="#00f59b" />
              </linearGradient>
            </defs>
            <path
              className="gauge-track"
              d="M 30,170 A 80,80 0 1,1 170,170"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              id="gauge-fill"
              className="gauge-fill"
              d="M 30,170 A 80,80 0 1,1 170,170"
              fill="none"
              stroke="url(#gauge-grad-react)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="gauge-content" aria-hidden="true">
            <span className="score-display">{score}</span>
            <span
              className="level-pill"
              style={{ color: score > 600 ? 'var(--accent-neon)' : 'var(--accent-warn)' }}
            >
              {level}
            </span>
          </div>
        </div>

        <div className="score-footer">
          <div className="metric-item">
            <span className="label">Daily Footprint</span>
            <span className="value">{dailyFootprint.toFixed(1)} kg CO₂</span>
          </div>
          <div className="divider" role="separator" />
          <div className="metric-item">
            <span className="label">Urban Avg</span>
            <span className="value">28.5 kg CO₂</span>
          </div>
        </div>
      </div>

      {/* 2. Habit Modifiers */}
      <section className="glass-card habits-panel" aria-labelledby="habits-title">
        <div className="card-header">
          <h2 id="habits-title" className="card-h3">Habit Modifiers</h2>
          <span
            className="info-icon"
            title="Simulate footprint changes by adjusting your lifestyle parameters."
            aria-label="Info: Adjust your lifestyle parameters to simulate footprint changes"
          >
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>
        <p className="panel-subtitle" id="habits-desc">Configure your routine to optimise emissions</p>

        <div className="habits-list" aria-describedby="habits-desc">
          {/* Commute */}
          <div className="habit-row">
            <div className="habit-desc">
              <div className="habit-icon-wrapper" aria-hidden="true"><Car size={18} /></div>
              <div className="habit-details">
                <label htmlFor="select-transport" className="habit-title">Daily Commute</label>
                <span className="habit-subtitle">
                  {{ car_single: 'Solo Petrol Car', car_pool: 'Car Pool / Shared Ride', metro: 'Metro Rail', ev: 'Electric Vehicle', cycle: 'Cycle / Walk / WFH' }[habits.transport]}
                </span>
              </div>
            </div>
            <div className="habit-control">
              <select
                id="select-transport"
                value={habits.transport}
                onChange={e => onHabitChange('transport', e.target.value)}
                className="form-select"
              >
                <option value="car_single">Solo Petrol Car</option>
                <option value="car_pool">Car Pool / Ride Share</option>
                <option value="metro">Metro Transit</option>
                <option value="ev">Electric Car (EV)</option>
                <option value="cycle">Cycle / Walking / WFH</option>
              </select>
            </div>
          </div>

          {/* Diet */}
          <div className="habit-row">
            <div className="habit-desc">
              <div className="habit-icon-wrapper" aria-hidden="true"><Utensils2 size={18} /></div>
              <div className="habit-details">
                <label htmlFor="select-diet" className="habit-title">Dietary Pattern</label>
                <span className="habit-subtitle">
                  {{ meat_heavy: 'Frequent Red Meat', meat_moderate: 'Balanced Meat/Poultry', vegetarian: 'Pure Vegetarian', vegan: 'Plant-Based / Vegan' }[habits.diet]}
                </span>
              </div>
            </div>
            <div className="habit-control">
              <select
                id="select-diet"
                value={habits.diet}
                onChange={e => onHabitChange('diet', e.target.value)}
                className="form-select"
              >
                <option value="meat_heavy">Frequent Red Meat</option>
                <option value="meat_moderate">Balanced Meat</option>
                <option value="vegetarian">Pure Vegetarian</option>
                <option value="vegan">Plant-Based / Vegan</option>
              </select>
            </div>
          </div>

          {/* Energy */}
          <div className="habit-row">
            <div className="habit-desc">
              <div className="habit-icon-wrapper" aria-hidden="true"><Zap size={18} /></div>
              <div className="habit-details">
                <label htmlFor="select-energy" className="habit-title">AC / Electricity</label>
                <span className="habit-subtitle">
                  {{ high: 'High (>8 hrs AC/day)', medium: 'Medium (3–8 hrs AC/day)', low: 'Low (<3 hrs AC/day)', solar: 'Solar / Off-grid' }[habits.energy]}
                </span>
              </div>
            </div>
            <div className="habit-control">
              <select
                id="select-energy"
                value={habits.energy}
                onChange={e => onHabitChange('energy', e.target.value)}
                className="form-select"
              >
                <option value="high">High (&gt;8 hrs AC)</option>
                <option value="medium">Medium (3–8 hrs AC)</option>
                <option value="low">Low (&lt;3 hrs AC)</option>
                <option value="solar">Solar-powered</option>
              </select>
            </div>
          </div>

          {/* Waste */}
          <div className="habit-row">
            <div className="habit-desc">
              <div className="habit-icon-wrapper" aria-hidden="true"><Trash2 size={18} /></div>
              <div className="habit-details">
                <label htmlFor="select-waste" className="habit-title">Waste Segregation</label>
                <span className="habit-subtitle">
                  {{ none: 'No separation', basic: 'Dry & Wet segregated', compost: 'Zero Single-Use / Composted' }[habits.waste]}
                </span>
              </div>
            </div>
            <div className="habit-control">
              <select
                id="select-waste"
                value={habits.waste}
                onChange={e => onHabitChange('waste', e.target.value)}
                className="form-select"
              >
                <option value="none">No separation</option>
                <option value="basic">Dry &amp; Wet split</option>
                <option value="compost">Compost &amp; zero plastic</option>
              </select>
            </div>
          </div>

          {/* Shopping — new habit field matching backend model */}
          <div className="habit-row">
            <div className="habit-desc">
              <div className="habit-icon-wrapper" aria-hidden="true"><ShoppingBag size={18} /></div>
              <div className="habit-details">
                <label htmlFor="select-shopping" className="habit-title">Shopping Frequency</label>
                <span className="habit-subtitle">
                  {{ high: 'Frequent buyer', medium: 'Moderate shopper', low: 'Mindful buyer', minimal: 'Minimal / second-hand' }[habits.shopping]}
                </span>
              </div>
            </div>
            <div className="habit-control">
              <select
                id="select-shopping"
                value={habits.shopping}
                onChange={e => onHabitChange('shopping', e.target.value)}
                className="form-select"
              >
                <option value="high">Frequent buyer</option>
                <option value="medium">Moderate shopper</option>
                <option value="low">Mindful buyer</option>
                <option value="minimal">Minimal / second-hand</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Recommendation */}
      <div className="glass-card recommendation-card green-accent-border" role="note" aria-label="AI recommendation">
        <div className="badge-tag" aria-hidden="true">AI STRATEGIST</div>
        <h2 className="card-h3" style={{ marginBottom: 10 }}>Recommendation of the Day</h2>
        <div className="rec-body">
          <p className="rec-text">
            {habits.transport === 'car_single'
              ? 'Upgrade your daily commute from solo petrol driving to Metro rail or EV. This transition prevents approximately 340 kg of CO₂ annually, boosting your Carbon Score by +180 points.'
              : habits.diet === 'meat_heavy'
              ? 'Substitute high-carbon red meats with local lentils or poultry. A simple swap 3 times per week prevents up to 120 kg of carbon annually.'
              : habits.shopping === 'high'
              ? 'Reduce fast-fashion and impulse buying. Choosing second-hand or mindful purchasing can cut 30–50 kg CO₂ annually from supply chain emissions.'
              : 'Keep up the sustainable patterns! To earn more points, optimise home standby power or install smart window tints to reduce active cooling loss.'}
          </p>
          <div className="action-buttons-row">
            {['car_single', 'car_pool'].includes(habits.transport) && (
              <button
                onClick={applyRecommendation}
                className="btn btn-primary btn-sm"
                aria-label="Apply recommended transport adjustment"
              >
                <Sparkles size={14} aria-hidden="true" /> Try this adjustment
              </button>
            )}
            <button
              onClick={() => setActiveScreen('coach')}
              className="btn btn-secondary btn-sm"
              aria-label="Navigate to AI Coach for personalised advice"
            >
              Ask AI Coach <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Top Impact Habits */}
      <div className="glass-card habits-summary-panel" aria-labelledby="top-impact-title">
        <div className="card-header">
          <h2 id="top-impact-title" className="card-h3">Top Impact Habits</h2>
          <span className="info-icon" title="Lifestyle routines generating the largest carbon footprints." aria-label="Info">
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>
        <ul className="impact-habits-list" aria-label="Top carbon impact habits">
          {impactStats.slice(0, 4).map((item, index) => (
            <li key={item.name} className={`impact-habit-item ${impactColour(item.val)}`}>
              <div className="legend-info">
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: 8 }} aria-hidden="true">
                  #{index + 1}
                </span>
                <span className="impact-habit-name">{item.name}</span>
              </div>
              <span className="impact-habit-value">
                <span className="sr-only">emits </span>{item.val.toFixed(1)} kg CO₂/day
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. SVG Savings Trend Chart */}
      <div className="glass-card trend-panel col-span-2" aria-labelledby="trend-title">
        <div className="card-header-row">
          <div className="card-header">
            <h2 id="trend-title" className="card-h3">Carbon Savings Trend</h2>
            <span className="info-icon" title="Accumulated carbon savings index vs baseline." aria-label="Info">
              <HelpCircle size={16} aria-hidden="true" />
            </span>
          </div>
          <div className="trend-tabs" role="group" aria-label="Select trend period">
            <button
              className={`trend-tab${trendPeriod === 'weekly' ? ' active' : ''}`}
              onClick={() => setTrendPeriod('weekly')}
              aria-pressed={trendPeriod === 'weekly'}
            >
              Weekly
            </button>
            <button
              className={`trend-tab${trendPeriod === 'monthly' ? ' active' : ''}`}
              onClick={() => setTrendPeriod('monthly')}
              aria-pressed={trendPeriod === 'monthly'}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="chart-container" role="img" aria-label={`Carbon savings trend chart — ${trendPeriod} view. Latest value: ${trendData[trendData.length - 1].val} kg saved.`}>
          <svg viewBox="0 0 600 180" width="100%" height="180" aria-hidden="true">
            <title>Carbon Savings Trend — {trendPeriod}</title>
            {/* Horizontal grid lines */}
            {[0, 1, 2, 3, 4].map((g, idx) => {
              const yVal = 20 + (130 / 4) * idx;
              const lbl  = Math.round(maxVal - (maxVal / 4) * idx);
              return (
                <g key={idx}>
                  <line
                    x1="40" y1={yVal} x2="580" y2={yVal}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  <text x="30" y={yVal + 4} textAnchor="end" style={{ fontSize: 10, fill: 'var(--text-muted)' }}>
                    {lbl}
                  </text>
                </g>
              );
            })}

            {/* Bars and data points */}
            {trendData.map((d, idx) => {
              const spacing = 540 / trendData.length;
              const x      = 40 + spacing * idx + spacing / 2;
              const y      = 20 + 130 - (d.val / maxVal) * 130;
              const isLast = idx === trendData.length - 1;

              return (
                <g key={idx}>
                  <rect
                    x={x - 16} y={y}
                    width="32" height={150 - y}
                    rx="4"
                    fill="var(--accent-neon)"
                    opacity={isLast ? 0.85 : 0.15}
                  >
                    <title>{d.label}: {d.val} kg CO₂ saved</title>
                  </rect>
                  <text x={x} y="170" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-muted)' }}>
                    {d.label}
                  </text>
                  <circle
                    cx={x} cy={y} r="4"
                    fill="var(--bg-primary)"
                    stroke="var(--accent-neon)"
                    strokeWidth="2"
                  >
                    <title>{d.val} kg saved</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

    </div>
  );
}

Dashboard.propTypes = {
  habits:         PropTypes.shape({
    transport: PropTypes.string.isRequired,
    diet:      PropTypes.string.isRequired,
    energy:    PropTypes.string.isRequired,
    waste:     PropTypes.string.isRequired,
    shopping:  PropTypes.string.isRequired,
  }).isRequired,
  onHabitChange:   PropTypes.func.isRequired,
  score:           PropTypes.number.isRequired,
  dailyFootprint:  PropTypes.number.isRequired,
  level:           PropTypes.string.isRequired,
  weeklySaved:     PropTypes.number.isRequired,
  setActiveScreen: PropTypes.func.isRequired,
};
