import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Breakdown from './components/Breakdown';
import AICoach from './components/AICoach';
import Gamification from './components/Gamification';
import ErrorBoundary from './components/ErrorBoundary';
import { Sparkles, Flame, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EMISSION_FACTORS,
  computeDailyFootprint,
  computeScore,
  getLevelFromScore,
  BASELINE_DAILY_KG,
} from './constants';

/** Default habit profile for a new user session */
const DEFAULT_HABITS = {
  transport: 'car_single',
  diet:      'meat_heavy',
  energy:    'high',
  waste:     'none',
  shopping:  'medium',
};

export default function App() {
  const [activeScreen, setActiveScreen]   = useState('dashboard');
  const [habits,       setHabits]         = useState(DEFAULT_HABITS);
  const [userScore,    setUserScore]       = useState(550);
  const [dailyFootprint, setDailyFootprint] = useState(14.2);
  const [weeklySaved,  setWeeklySaved]    = useState(48.2);
  const [userLevel,    setUserLevel]      = useState('Eco Beginner');
  const [streakDays,   setStreakDays]     = useState(12);
  /** Monthly CO₂ reduction goal in kg (set by user in Gamification) */
  const [monthlyGoalKg, setMonthlyGoalKg] = useState(100);
  /** Notification message for screen-reader live region */
  const [liveMsg, setLiveMsg] = useState('');

  // ---------------------------------------------------------------------------
  // Sync user data to backend (graceful — silently ignores offline errors)
  // ---------------------------------------------------------------------------
  const syncWithBackend = useCallback(async (scoreVal, levelVal, savedVal) => {
    try {
      const response = await fetch('http://localhost:10000/user/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:        'user_self',
          carbon_score:   scoreVal,
          level:          levelVal,
          badges:         [],
          weekly_co2_saved: savedVal,
          streak_days:    streakDays,
        }),
      });
      if (!response.ok) {
        console.warn('[App] Backend sync returned', response.status);
      }
    } catch {
      // Backend is offline — local-only mode, no action needed
    }
  }, [streakDays]);

  // ---------------------------------------------------------------------------
  // Recalculate score & footprint whenever habits change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const footprint = computeDailyFootprint(habits);
    setDailyFootprint(footprint);

    const newScore  = computeScore(footprint);
    const newLevel  = getLevelFromScore(newScore);

    setUserScore(prevScore => {
      // Celebrate score improvements with confetti
      if (newScore > prevScore) {
        confetti({
          particleCount: 100,
          spread:        70,
          origin:        { y: 0.9 },
          colors:        ['#00f59b', '#10b981', '#ffffff'],
        });
        setLiveMsg(`Great progress! Your score improved to ${newScore}.`);
      } else if (newScore < prevScore) {
        setLiveMsg(`Score updated to ${newScore}. Consider switching to a greener option.`);
      }
      return newScore;
    });

    setUserLevel(newLevel);

    // Weekly savings vs Indian urban baseline
    const baselineWeekly = BASELINE_DAILY_KG * 7;
    const currentWeekly  = footprint * 7;
    const saved = parseFloat(Math.max(0, baselineWeekly - currentWeekly).toFixed(1));
    setWeeklySaved(saved);

    syncWithBackend(newScore, newLevel, saved);
  }, [habits, syncWithBackend]);

  const handleHabitChange = useCallback((category, value) => {
    setHabits(prev => ({ ...prev, [category]: value }));
  }, []);

  // Monthly progress = weekly saved × 4.33 weeks
  const monthlyProjectedSaved = parseFloat((weeklySaved * 4.33).toFixed(1));

  return (
    <div className="app-container">
      {/* Background ambient orbs */}
      <div className="glow-orb glow-1" aria-hidden="true" />
      <div className="glow-orb glow-2" aria-hidden="true" />

      {/* ARIA live region — announces score changes to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMsg}
      </div>

      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        userLevel={userLevel}
      />

      <main className="main-viewport" id="main-content" tabIndex={-1}>
        {/* Top bar header */}
        <header className="top-bar">
          <div className="screen-title-area">
            <h1 className="screen-title" style={{ textTransform: 'capitalize' }}>
              {activeScreen === 'gamification' ? 'Eco Level' : activeScreen}
            </h1>
            <p className="screen-subtitle">
              {activeScreen === 'dashboard'     && 'Your real-time carbon intelligence overview.'}
              {activeScreen === 'breakdown'     && 'In-depth assessment of emission contributors.'}
              {activeScreen === 'coach'         && 'Personalized mitigation strategy session.'}
              {activeScreen === 'gamification'  && 'Compete, earn badges, and build positive streaks.'}
            </p>
          </div>

          <div className="header-widgets" role="complementary" aria-label="Key metrics">
            <div
              className="widget-chip green-glow"
              title={`Saved ${weeklySaved} kg CO₂ this week compared to urban baseline`}
              aria-label={`Saved ${weeklySaved} kilograms CO₂ this week`}
            >
              <Sparkles size={16} aria-hidden="true" />
              <span>Saved <strong>{weeklySaved}</strong> kg CO₂</span>
            </div>

            <div
              className="widget-chip streak-chip"
              title={`Active daily streak: ${streakDays} days`}
              aria-label={`${streakDays} day streak active`}
            >
              <Flame size={16} className="streak-icon" aria-hidden="true" />
              <span><strong>{streakDays}</strong> Day Streak</span>
            </div>

            <div
              className="widget-chip goal-chip"
              title={`Monthly goal: ${monthlyGoalKg} kg CO₂ reduction`}
              aria-label={`Monthly goal: ${monthlyProjectedSaved} of ${monthlyGoalKg} kg CO₂ target`}
            >
              <Target size={16} aria-hidden="true" />
              <span>
                <strong>{Math.min(monthlyProjectedSaved, monthlyGoalKg)}</strong> / {monthlyGoalKg} kg goal
              </span>
            </div>
          </div>
        </header>

        {/* Screen content */}
        <div className="screens-container">
          {activeScreen === 'dashboard' && (
            <ErrorBoundary screenName="Dashboard">
              <Dashboard
                habits={habits}
                onHabitChange={handleHabitChange}
                score={userScore}
                dailyFootprint={dailyFootprint}
                level={userLevel}
                weeklySaved={weeklySaved}
                setActiveScreen={setActiveScreen}
              />
            </ErrorBoundary>
          )}

          {activeScreen === 'breakdown' && (
            <ErrorBoundary screenName="Breakdown">
              <Breakdown
                habits={habits}
                dailyFootprint={dailyFootprint}
                monthlyGoalKg={monthlyGoalKg}
                monthlyProjectedSaved={monthlyProjectedSaved}
              />
            </ErrorBoundary>
          )}

          {activeScreen === 'coach' && (
            <ErrorBoundary screenName="AI Coach">
              <AICoach
                habits={habits}
                personality={userLevel}
                dailyFootprint={dailyFootprint}
              />
            </ErrorBoundary>
          )}

          {activeScreen === 'gamification' && (
            <ErrorBoundary screenName="Eco Level">
              <Gamification
                score={userScore}
                level={userLevel}
                streakDays={streakDays}
                weeklySaved={weeklySaved}
                habits={habits}
                monthlyGoalKg={monthlyGoalKg}
                onGoalChange={setMonthlyGoalKg}
                monthlyProjectedSaved={monthlyProjectedSaved}
              />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}
