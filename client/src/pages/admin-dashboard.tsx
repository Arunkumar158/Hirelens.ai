import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminContent from "@/components/dashboard/AdminContent";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, Switch } from "wouter";

function AdminSectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2">This section is under construction.</p>
    </div>
  );
}

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
      <Switch>
        <Route path="/dashboard/admin/users">
          <AdminSectionPlaceholder title="Users" />
        </Route>
        <Route path="/dashboard/admin/analytics">
          <AdminSectionPlaceholder title="Analytics" />
        </Route>
        <Route path="/dashboard/admin/settings">
          <AdminSectionPlaceholder title="Settings" />
        </Route>
        <Route path="/dashboard/admin" component={AdminContent} />
        <Route component={AdminContent} />
      </Switch>
    </DashboardLayout>
  );
}
