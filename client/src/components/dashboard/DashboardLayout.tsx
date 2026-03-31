import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Home,
  FileText,
  Users,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { LucideIcon } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const navItems = (() => {
    switch(user.role) {
      case "jobseeker":
        return [
          { href: "/dashboard/jobseeker", label: "Dashboard", icon: Home },
          { href: "/dashboard/jobseeker/resumes", label: "My Resumes", icon: FileText },
          { href: "/dashboard/jobseeker/settings", label: "Settings", icon: Settings },
        ];
      case "recruiter":
        return [
          { href: "/dashboard/recruiter", label: "Dashboard", icon: Home },
          { href: "/dashboard/recruiter/jobs", label: "My Jobs", icon: FileText },
          { href: "/dashboard/recruiter/candidates", label: "Candidates", icon: Users },
          { href: "/dashboard/recruiter/settings", label: "Settings", icon: Settings },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: Home },
          { href: "/dashboard/admin/users", label: "Users", icon: Users },
          { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart },
          { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
        ];
      default:
        return [];
    }
  })();

  const navButtonClass = (isActive: boolean) =>
    `w-full justify-start rounded-lg border-l-4 px-3 py-2.5 transition-colors ${
      isActive
        ? "border-l-primary bg-primary/10 text-primary hover:bg-primary/15"
        : "border-l-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-white h-[calc(100vh-4rem)] border-r border-slate-200 overflow-y-auto">
          <div className="p-3 space-y-1.5">
            {navItems.map((item: { href: string; label: string; icon: LucideIcon }) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost"
                  className={navButtonClass(location === item.href)}
                >
                  <item.icon className="mr-3 h-5 w-5 shrink-0" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 p-2">
          <div className="flex justify-around">
            {navItems.slice(0, 3).map((item: { href: string; label: string; icon: LucideIcon }) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`flex h-16 flex-col px-2 ${
                    location === item.href ? "bg-primary/10 text-primary" : "text-gray-600"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Button>
              </Link>
            ))}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="flex flex-col h-16 px-2">
                  <Menu className="h-4 w-4" />
                  <span className="text-xs mt-1">More</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-72">
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-end">
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <div className="space-y-1">
                    {navItems.slice(3).map((item: { href: string; label: string; icon: LucideIcon }) => (
                      <Link key={item.href} href={item.href}>
                        <SheetClose asChild>
                          <Button 
                            variant="ghost" 
                            className={navButtonClass(location === item.href)}
                          >
                            <item.icon className="mr-3 h-5 w-5 shrink-0" />
                            {item.label}
                          </Button>
                        </SheetClose>
                      </Link>
                    ))}
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700" 
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
