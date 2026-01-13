import { Component } from 'react';

/**
 * Error boundary to catch and display runtime errors
 * Prevents white screen of death
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)));
      });
    }

    // Clear localStorage to reset app state
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }

    // Reload the page
    window.location.href = window.location.href;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😞</div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-slate-300 text-sm">
                The app encountered an unexpected error. Don't worry, your data is safe!
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-red-500/20">
                <p className="text-xs font-mono text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                Reset and Reload App
              </button>

              <button
                onClick={() => window.location.href = window.location.href}
                className="w-full bg-slate-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-slate-600 transition-all"
              >
                Just Reload
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              If the problem persists, try clearing your browser cache manually
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
