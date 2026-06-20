import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches runtime render errors in child component trees
 * and displays a graceful fallback instead of crashing the whole application.
 *
 * Usage:
 *   <ErrorBoundary screenName="Dashboard">
 *     <Dashboard ... />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this would go to a monitoring service (e.g. Sentry)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="glass-card error-boundary-fallback"
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 48,
            margin: 40,
            borderColor: 'rgba(255, 71, 87, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-alert)',
          }}>
            <AlertTriangle size={26} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 380 }}>
              {this.props.screenName
                ? `The ${this.props.screenName} screen encountered an error.`
                : 'This section encountered an unexpected error.'}
              {' '}Your habit data is safe.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={this.handleReset}
            style={{ marginTop: 8 }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children:   PropTypes.node.isRequired,
  screenName: PropTypes.string,
};

ErrorBoundary.defaultProps = {
  screenName: '',
};

export default ErrorBoundary;
