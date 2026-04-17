import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RecruiterContent from "@/components/dashboard/RecruiterContent";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, Switch } from "wouter";

function RecruiterSectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2">This section is under construction.</p>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  
  // Check if user has the right role
  if (user && user.role !== "recruiter") {
    // Redirect to the appropriate dashboard
    const redirectPath =
      user.role === "jobseeker"
        ? "/dashboard/jobseeker"
        : user.role === "admin"
        ? "/dashboard/admin"
        : "/";
    
    return <Redirect to={redirectPath} />;
  }
  
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard/recruiter/jobs">
          <RecruiterSectionPlaceholder title="My Jobs" />
        </Route>
        <Route path="/dashboard/recruiter/candidates">
          <RecruiterSectionPlaceholder title="Candidates" />
        </Route>
        <Route path="/dashboard/recruiter/settings">
          <RecruiterSectionPlaceholder title="Settings" />
        </Route>
        <Route path="/dashboard/recruiter" component={RecruiterContent} />
        <Route component={RecruiterContent} />
      </Switch>
    </DashboardLayout>
  );
}
