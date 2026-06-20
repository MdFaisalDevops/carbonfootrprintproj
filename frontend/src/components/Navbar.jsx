import React from 'react';
import PropTypes from 'prop-types';
import { Leaf, LayoutDashboard, BarChart3, Bot, Trophy } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     name: 'Dashboard',  icon: LayoutDashboard },
  { id: 'breakdown',     name: 'Breakdown',  icon: BarChart3 },
  { id: 'coach',         name: 'AI Coach',   icon: Bot },
  { id: 'gamification',  name: 'Eco Level',  icon: Trophy },
];

/**
 * Sidebar navigation component.
 * Uses <button> elements (not <div>) for interactive nav items so they are
 * keyboard-focusable and announced correctly by screen readers.
 */
export default function Navbar({ activeScreen, setActiveScreen, userLevel }) {
  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveScreen(id);
    }
  };

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand" aria-label="CarbonMind AI logo">
        <div className="brand-logo" aria-hidden="true">
          <Leaf size={18} />
        </div>
        <span className="brand-name">
          CarbonMind <span className="accent-text">AI</span>
        </span>
      </div>

      <nav className="nav-menu" role="menubar" aria-label="Application sections">
        {NAV_ITEMS.map(item => {
          const IconComponent = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => setActiveScreen(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              className={`nav-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={item.name}
            >
              <IconComponent size={20} aria-hidden="true" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" aria-label="User profile">
          <div className="avatar" aria-hidden="true">A</div>
          <div className="user-info">
            <span className="user-name">Arjun Mehta</span>
            <span className="user-level" aria-label={`Level: ${userLevel}`}>{userLevel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

Navbar.propTypes = {
  activeScreen:    PropTypes.string.isRequired,
  setActiveScreen: PropTypes.func.isRequired,
  userLevel:       PropTypes.string.isRequired,
};
