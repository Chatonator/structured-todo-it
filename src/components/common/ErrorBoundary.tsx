
/**
 * Error Boundary - Composant de gestion d'erreurs globales
 * Capture et affiche les erreurs React de manière élégante
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Appeler le callback d'erreur si fourni
    this.props.onError?.(error, errorInfo);

    // Log vers un service externe si configuré
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Intégrer avec un service de logging (Sentry, LogRocket, etc.)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error logged:', errorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-theme-background p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              <CardTitle className="text-error-900">
                Une erreur s'est produite
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-theme-muted text-center">
                L'application a rencontré une erreur inattendue. 
                Nos équipes ont été notifiées.
              </p>

              {/* Détails techniques en mode développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-accent p-3 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Détails techniques
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 overflow-auto text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Actions de récupération */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Accueil
                </Button>
              </div>

              <p className="text-xs text-theme-muted text-center">
                Si le problème persiste, contactez le support technique.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour utiliser l'ErrorBoundary dans les composants fonctionnels
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return (errorToThrow: Error) => {
    setError(errorToThrow);
  };
};

// HOC pour wrapper facilement les composants
export const withErrorBoundary = (
  Component: React.ComponentType<any>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  return (props: any) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
