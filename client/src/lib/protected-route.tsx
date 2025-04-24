import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  role?: string | string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  role,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if the user has the required role
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      // Redirect based on user's role
      let redirectPath;
      switch (user.role) {
        case "jobseeker":
          redirectPath = "/dashboard/jobseeker";
          break;
        case "recruiter":
          redirectPath = "/dashboard/recruiter";
          break;
        case "admin":
          redirectPath = "/dashboard/admin";
          break;
        default:
          redirectPath = "/";
      }

      return (
        <Route path={path}>
          <Redirect to={redirectPath} />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
