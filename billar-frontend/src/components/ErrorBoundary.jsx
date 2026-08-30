import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error de renderizado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-2xl p-6 text-center space-y-3 my-4">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
            Error en este componente
          </h3>
          <p className="text-xs text-red-600 dark:text-red-300 font-mono">
            {this.state.error?.message || 'Se produjo un error no esperado en la interfaz.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Reintentar Renderizado
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
