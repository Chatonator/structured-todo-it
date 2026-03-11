import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import JoinTeam from './pages/JoinTeam';
import { TeamManagement } from './components/team/TeamManagement';
import BugReportsAdmin from './components/bugs/BugReportsAdmin';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { TeamProvider } from '@/contexts/TeamContext';
import { TimeTrackerProvider } from '@/contexts/TimeTrackerContext';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { logger } from '@/lib/logger';
import { ViewportProvider } from '@/contexts/ViewportContext';
import AppearanceProvider from '@/components/providers/AppearanceProvider';

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

const DEV_BYPASS_AUTH = true;
const ADMIN_USER_ID = 'a72dc5ca-c281-46c0-a16c-139676705564';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.id !== ADMIN_USER_ID) {
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
      <ViewportProvider>
        <UserPreferencesProvider>
          <AppearanceProvider>
            <TeamProvider>
              <TimeTrackerProvider>
                <TooltipProvider>
                  <Toaster />
                  <HashRouter>
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
                        path="/admin/bugs"
                        element={
                          <AdminRoute>
                            <BugReportsAdmin />
                          </AdminRoute>
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
                      <Route path="/join/:code" element={<JoinTeam />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </HashRouter>
                </TooltipProvider>
              </TimeTrackerProvider>
            </TeamProvider>
          </AppearanceProvider>
        </UserPreferencesProvider>
      </ViewportProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
