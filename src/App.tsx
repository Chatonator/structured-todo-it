
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
