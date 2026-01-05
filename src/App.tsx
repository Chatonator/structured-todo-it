import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { TeamManagement } from "./components/team/TeamManagement";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { TeamProvider } from "@/contexts/TeamContext";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { logger } from "@/lib/logger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        logger.warn('Query failed', { failureCount, error: error.message });
        return failureCount < 3;
      },
    },
  },
});

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    logger.debug('Theme applied', { theme });
  }, [theme]);

  return <>{children}</>;
};


// ⚠️ DEV MODE: Bypass authentication for visual development
const DEV_BYPASS_AUTH = true;

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  // Bypass auth in dev mode
  if (DEV_BYPASS_AUTH) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirects to main app if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.error('Application error caught by boundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }, error);
    }}
  >
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <ThemeProvider>
          <TeamProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter basename={import.meta.env.DEV ? '/' : '/structured-todo-it/'}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/teams" 
                    element={
                      <ProtectedRoute>
                        <TeamManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/auth" 
                    element={
                      <PublicRoute>
                        <Auth />
                      </PublicRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TeamProvider>
        </ThemeProvider>
      </UserPreferencesProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;


    

    
