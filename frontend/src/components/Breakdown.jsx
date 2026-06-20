import React from 'react';
import PropTypes from 'prop-types';
import { HelpCircle, AlertTriangle, Car, Utensils2, Zap, Trash2, ShoppingBag, Target } from 'lucide-react';
import { EMISSION_FACTORS } from '../constants';

/** Category display metadata */
const CATEGORY_META = {
  transport: { title: 'Transport',      icon: Car,         color: '#ff4757', desc: 'Commuting profiles & vehicle emissions.' },
  diet:      { title: 'Dietary Habits', icon: Utensils2,   color: '#ff9f43', desc: 'Agricultural land usage & meat logistics.' },
  energy:    { title: 'Home Energy',    icon: Zap,         color: '#00f59b', desc: 'Grid reliance vs green solar offsets.' },
  waste:     { title: 'Waste Output',   icon: Trash2,      color: '#6b7280', desc: 'Landfill methane from food waste.' },
  shopping:  { title: 'Shopping',       icon: ShoppingBag, color: '#a78bfa', desc: 'Supply chain emissions from consumer goods.' },
};

/** RGB colour triples for inline style interpolation */
const COLOR_RGB = {
  transport: '255, 71, 87',
  diet:      '255, 159, 67',
  energy:    '0, 245, 155',
  waste:     '107, 114, 128',
  shopping:  '167, 139, 250',
};

/**
 * Breakdown — emission category donut chart, hotspot analysis, category detail cards,
 * and a monthly CO₂ goal progress section.
 */
export default function Breakdown({ habits, dailyFootprint, monthlyGoalKg, monthlyProjectedSaved }) {
  const transportVal = EMISSION_FACTORS.transport[habits.transport] ?? 0;
  const dietVal      = EMISSION_FACTORS.diet[habits.diet]           ?? 0;
  const energyVal    = EMISSION_FACTORS.energy[habits.energy]       ?? 0;
  const wasteVal     = EMISSION_FACTORS.waste[habits.waste]         ?? 0;
  const shoppingVal  = EMISSION_FACTORS.shopping[habits.shopping]   ?? 0;

  const total = dailyFootprint || 0.1; // avoid divide-by-zero

  const segments = [
    { key: 'transport', val: transportVal, color: '#ff4757', title: 'Transport Commute' },
    { key: 'diet',      val: dietVal,      color: '#ff9f43', title: 'Diet Pattern'      },
    { key: 'energy',    val: energyVal,    color: '#00f59b', title: 'Grid Energy'       },
    { key: 'waste',     val: wasteVal,     color: '#6b7280', title: 'Waste Output'      },
    { key: 'shopping',  val: shoppingVal,  color: '#a78bfa', title: 'Shopping'          },
  ];

  const sortedSectors  = [...segments].sort((a, b) => b.val - a.val);
  const primarySector  = sortedSectors[0];
  const primaryMeta    = CATEGORY_META[primarySector.key];
  const primaryPerc    = Math.round((primarySector.val / total) * 100);

  // Goal progress
  const goalProgress  = Math.min(100, Math.round((monthlyProjectedSaved / monthlyGoalKg) * 100));

  // Donut circumference for r=60 → 2π × 60 ≈ 377
  const circumference  = 377;
  let accumulatedOffset = 0;

  return (
    <div className="breakdown-grid">

      {/* 1. Donut Chart Panel */}
      <section className="glass-card breakdown-visual-panel" aria-labelledby="emission-title">
        <div className="card-header">
          <h2 id="emission-title" className="card-h3">Emission Category Proportions</h2>
          <span className="info-icon" title="Relative share of carbon emissions in your profile." aria-label="Info">
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>

        <div className="visuals-container">
          <div className="radial-ring-section">
            <div className="donut-chart-wrapper">
              <svg
                viewBox="0 0 160 160"
                className="donut-chart"
                role="img"
                aria-label={`Donut chart of emission categories. Total: ${total.toFixed(1)} kg CO₂/day. Largest: ${primarySector.title} at ${primaryPerc}%.`}
              >
                <title>Emission Category Breakdown — {total.toFixed(1)} kg CO₂/day total</title>
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="16" />
                {segments.map((seg, idx) => {
                  const percentage = seg.val / total;
                  const strokeDash = percentage * circumference;
                  const offset     = circumference - strokeDash + accumulatedOffset;
                  accumulatedOffset -= strokeDash;

                  return (
                    <circle
                      key={idx}
                      cx="80" cy="80" r="60"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                      strokeDashoffset={offset}
                      style={{
                        transformOrigin: 'center',
                        transform:       'rotate(-90deg)',
                        transition:      'stroke-dashoffset 0.8s ease',
                      }}
                    >
                      <title>{CATEGORY_META[seg.key].title}: {seg.val.toFixed(1)} kg ({Math.round(percentage * 100)}%)</title>
                    </circle>
                  );
                })}
              </svg>
              <div className="donut-center-text" aria-hidden="true">
                <span className="total-co2">{total.toFixed(1)}</span>
                <span className="unit">kg CO₂/day</span>
              </div>
            </div>
          </div>

          <div className="breakdown-legend" role="list" aria-label="Emission category legend">
            {segments.map((seg, idx) => {
              const meta       = CATEGORY_META[seg.key];
              const percentage = Math.round((seg.val / total) * 100);
              return (
                <div key={idx} className="legend-item" title={meta.desc} role="listitem">
                  <div className="legend-info">
                    <span className="legend-color-dot" style={{ background: seg.color }} aria-hidden="true" />
                    <span className="legend-label">{meta.title} ({percentage}%)</span>
                  </div>
                  <span className="legend-value">{seg.val.toFixed(1)} kg</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Primary Hotspot */}
      <section className="glass-card hotspot-panel red-accent-border" aria-labelledby="hotspot-title">
        <div className="badge-tag tag-alert" aria-hidden="true">HOTSPOT CRITICAL</div>
        <div className="card-header">
          <h2 id="hotspot-title" className="card-h3">Primary Carbon Driver</h2>
          <span className="info-icon" title="The single component causing your highest carbon output." aria-label="Info">
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>

        <div className="hotspot-content">
          <div className="hotspot-hero">
            <div
              className="hotspot-symbol"
              style={{
                background: `rgba(${COLOR_RGB[primarySector.key] ?? '255, 71, 87'}, 0.1)`,
                color: primarySector.color,
                border: `1px solid rgba(${COLOR_RGB[primarySector.key] ?? '255, 71, 87'}, 0.25)`,
              }}
              aria-hidden="true"
            >
              <primaryMeta.icon size={26} />
            </div>
            <div className="hotspot-summary">
              <h3>{primarySector.title} Sector</h3>
              <p className="hotspot-impact-perc" style={{ color: primarySector.color }}>
                {primaryPerc}% of total footprint
              </p>
            </div>
          </div>

          <div className="hotspot-body">
            <p>
              {primarySector.key === 'transport' && 'Your solo petrol car commute is the largest pollution driver. Switching to Metro, ridesharing or cycling short trips cuts direct outputs by up to 88%.'}
              {primarySector.key === 'diet'      && 'Frequent meat consumption is highly carbon-intensive due to agricultural methane. Moving to poultry or vegetarian selections lowers this instantly.'}
              {primarySector.key === 'energy'    && 'High-load AC drawing coal-powered electricity is a primary bottleneck. Using fans or installing energy monitors will optimise usage significantly.'}
              {primarySector.key === 'waste'     && 'Unsegregated household trash decomposes anaerobically in landfills, leaking raw methane. Separate and compost waste to cut this drastically.'}
              {primarySector.key === 'shopping'  && 'Frequent new purchases drive high supply-chain emissions. Choosing second-hand, repairing items, or reducing impulse buys makes a measurable impact.'}
            </p>

            <div
              className="alert-box warn"
              role="note"
              aria-label="Pro tip"
              style={{ display: 'flex', gap: 12, marginTop: 12 }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--accent-warn)', flexShrink: 0 }} aria-hidden="true" />
              <span>
                <strong>Pro Tip:</strong> Urban Indian households adopting basic organic composting prevent landfill decay equivalent to <strong>80 kg of CO₂</strong> annually.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Detail Cards */}
      <section className="glass-card categories-detail-panel col-span-2" aria-labelledby="cat-insights-title">
        <div className="card-header">
          <h2 id="cat-insights-title" className="card-h3">Category Insights</h2>
          <span className="info-icon" title="Assessment overview of structural carbon components." aria-label="Info">
            <HelpCircle size={16} aria-hidden="true" />
          </span>
        </div>

        <div className="category-cards-grid">
          {segments.map((seg, idx) => {
            const meta          = CATEGORY_META[seg.key];
            const IconComponent = meta.icon;
            return (
              <article key={idx} className="category-detail-card" aria-label={`${meta.title} category`}>
                <div className="cat-card-header">
                  <span className="cat-card-title">{meta.title}</span>
                  <div
                    className="cat-card-icon"
                    style={{
                      background: `rgba(${COLOR_RGB[seg.key] ?? '255,255,255'}, 0.1)`,
                      color: seg.color,
                    }}
                    aria-hidden="true"
                  >
                    <IconComponent size={16} />
                  </div>
                </div>
                <span className="cat-card-value">{seg.val.toFixed(1)} kg</span>
                <p className="cat-card-desc">
                  {seg.key === 'transport' && 'Alternative: Metro transit saves 88% kg CO₂/km.'}
                  {seg.key === 'diet'      && 'Alternative: Pulse protein cuts land usage footprint.'}
                  {seg.key === 'energy'    && 'Alternative: Solar cells bypass peak load cycles.'}
                  {seg.key === 'waste'     && 'Alternative: Separate bins halt high methane leaks.'}
                  {seg.key === 'shopping'  && 'Alternative: Second-hand & repair cuts supply chain waste.'}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. Monthly Goal Progress — NEW FEATURE */}
      <section className="glass-card goal-progress-panel col-span-2" aria-labelledby="goal-title">
        <div className="card-header">
          <h2 id="goal-title" className="card-h3">
            <Target size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-neon)' }} aria-hidden="true" />
            Monthly CO₂ Reduction Goal
          </h2>
          <span className="goal-chip-inline" aria-label={`${goalProgress}% of goal achieved`}>
            {goalProgress}% achieved
          </span>
        </div>
        <p className="panel-subtitle">Projected savings vs your {monthlyGoalKg} kg target this month</p>

        <div
          className="goal-bar-track"
          role="progressbar"
          aria-valuenow={Math.min(monthlyProjectedSaved, monthlyGoalKg)}
          aria-valuemin={0}
          aria-valuemax={monthlyGoalKg}
          aria-label={`Monthly goal progress: ${monthlyProjectedSaved} of ${monthlyGoalKg} kg CO₂ saved`}
        >
          <div
            className="goal-bar-fill"
            style={{
              width:      `${goalProgress}%`,
              background: goalProgress >= 100 ? 'var(--accent-neon)' : 'linear-gradient(90deg, #00f59b, #10b981)',
            }}
          />
        </div>

        <div className="goal-bar-labels" aria-hidden="true">
          <span>0 kg</span>
          <span style={{ color: monthlyProjectedSaved >= monthlyGoalKg ? 'var(--accent-neon)' : 'var(--text-main)' }}>
            {monthlyProjectedSaved} kg projected
          </span>
          <span>{monthlyGoalKg} kg goal</span>
        </div>

        {monthlyProjectedSaved >= monthlyGoalKg && (
          <p className="goal-achieved-msg" role="status" aria-live="polite">
            🎉 Congratulations — you are on track to hit your monthly goal!
          </p>
        )}
      </section>

    </div>
  );
}

Breakdown.propTypes = {
  habits: PropTypes.shape({
    transport: PropTypes.string.isRequired,
    diet:      PropTypes.string.isRequired,
    energy:    PropTypes.string.isRequired,
    waste:     PropTypes.string.isRequired,
    shopping:  PropTypes.string.isRequired,
  }).isRequired,
  dailyFootprint:         PropTypes.number.isRequired,
  monthlyGoalKg:          PropTypes.number.isRequired,
  monthlyProjectedSaved:  PropTypes.number.isRequired,
};
