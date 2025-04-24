import DashboardLayout from "@/components/dashboard/DashboardLayout";
import JobSeekerContent from "@/components/dashboard/JobSeekerContent";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

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
      <JobSeekerContent />
    </DashboardLayout>
  );
}
