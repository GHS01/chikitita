import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProfilePhotoProvider } from "@/contexts/ProfilePhotoContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Nutrition from "@/pages/nutrition";
import AITrainer from "@/pages/ai-trainer";
import Profile from "@/pages/Profile";
import NotificationTest from "@/pages/NotificationTest";
import IntelligentFeedbackDemo from "@/pages/IntelligentFeedbackDemo";
import Navigation from "@/components/navigation";
import MobileNavigation from "@/components/mobile-navigation";


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
      <main className="pt-16 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/ai-trainer" component={AITrainer} />
          <Route path="/profile" component={Profile} />
          <Route path="/notification-test" component={NotificationTest} />
          <Route path="/intelligent-feedback-demo" component={IntelligentFeedbackDemo} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfilePhotoProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </ProfilePhotoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
