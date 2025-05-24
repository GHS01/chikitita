import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Nutrition from "@/pages/nutrition";
import Progress from "@/pages/progress";
import Navigation from "@/components/navigation";
import MobileNavigation from "@/components/mobile-navigation";
import FloatingActionButton from "@/components/floating-action-button";

// Update queryClient to include auth headers
const originalFetch = queryClient.getDefaultOptions().queries?.queryFn;
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          ...authService.getAuthHeader(),
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const text = (await response.text()) || response.statusText;
        throw new Error(`${response.status}: ${text}`);
      }

      return await response.json();
    },
  },
});

import { authService } from "@/lib/auth";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/progress" component={Progress} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <FloatingActionButton />
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
