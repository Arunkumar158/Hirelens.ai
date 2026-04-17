import DashboardLayout from "@/components/dashboard/DashboardLayout";
import JobSeekerContent from "@/components/dashboard/JobSeekerContent";
import ResumePage from "@/pages/dashboard/resume";
import JobSeekerSettings from "@/pages/jobseeker-settings";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, Switch } from "wouter";

export default function JobseekerDashboard() {
  const { user } = useAuth();
  
  // Check if user has the right role
  if (user && user.role !== "jobseeker") {
    // Redirect to the appropriate dashboard
    const redirectPath =
      user.role === "recruiter"
        ? "/dashboard/recruiter"
        : user.role === "admin"
        ? "/dashboard/admin"
        : "/";
    
    return <Redirect to={redirectPath} />;
  }
  
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard/jobseeker/resumes" component={ResumePage} />
        <Route path="/dashboard/jobseeker/settings" component={JobSeekerSettings} />
        <Route path="/dashboard/jobseeker" component={JobSeekerContent} />
        <Route component={JobSeekerContent} />
      </Switch>
    </DashboardLayout>
  );
}
