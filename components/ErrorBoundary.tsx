import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ========== ERRO CAPTURADO PELO ERROR BOUNDARY ==========');
    console.error('Erro:', error);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================================');
    
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ========== componentDidCatch ==========');
    console.error('Erro:', error);
    console.error('ErrorInfo:', errorInfo);
    console.error('ComponentStack:', errorInfo.componentStack);
    console.error('==========================================');
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-border p-8 max-w-2xl w-full shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-status-error" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Ops! Algo deu errado
                </h2>
                <p className="text-text-secondary">
                  Ocorreu um erro inesperado. Por favor, tente novamente.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-surface rounded-lg border border-border">
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Detalhes do erro:
                </p>
                <p className="text-xs text-status-error font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-text-secondary font-mono overflow-auto max-h-40 bg-white p-2 rounded border">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-primary text-white rounded-custom font-medium hover:bg-primary-hover transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white border border-border text-text-primary rounded-custom font-medium hover:bg-surface transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


