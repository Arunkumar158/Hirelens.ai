import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/register-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import JobseekerDashboard from "@/pages/jobseeker-dashboard";
import RecruiterDashboard from "@/pages/recruiter-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import About from "@/pages/about";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/forgot-password" component={ForgotPasswordPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />
              <Route path="/about" component={About} />
              {/* Optional wildcard so nested sidebar URLs keep the same dashboard shell */}
              <ProtectedRoute path="/dashboard/jobseeker/*?" role="jobseeker" component={JobseekerDashboard} />
              <ProtectedRoute path="/dashboard/recruiter/*?" role="recruiter" component={RecruiterDashboard} />
              <ProtectedRoute path="/dashboard/admin/*?" role="admin" component={AdminDashboard} />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
