import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminContent from "@/components/dashboard/AdminContent";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Check if user has the right role
  if (user && user.role !== "admin") {
    // Redirect to the appropriate dashboard
    const redirectPath =
      user.role === "jobseeker"
        ? "/dashboard/jobseeker"
        : user.role === "recruiter"
        ? "/dashboard/recruiter"
        : "/";
    
    return <Redirect to={redirectPath} />;
  }
  
  return (
    <DashboardLayout>
      <AdminContent />
    </DashboardLayout>
  );
}
