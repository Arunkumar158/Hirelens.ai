import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RecruiterContent from "@/components/dashboard/RecruiterContent";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

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
      <RecruiterContent />
    </DashboardLayout>
  );
}
