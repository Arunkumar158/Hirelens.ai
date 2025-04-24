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
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { extractInitials } from "@/lib/utils";

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
          { href: "/dashboard/jobseeker", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/jobseeker/resumes", label: "My Resumes", icon: <FileText className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/jobseeker/settings", label: "Settings", icon: <Settings className="mr-2 h-4 w-4" /> },
        ];
      case "recruiter":
        return [
          { href: "/dashboard/recruiter", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/recruiter/jobs", label: "My Jobs", icon: <FileText className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/recruiter/candidates", label: "Candidates", icon: <Users className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/recruiter/settings", label: "Settings", icon: <Settings className="mr-2 h-4 w-4" /> },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/admin/users", label: "Users", icon: <Users className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/admin/analytics", label: "Analytics", icon: <BarChart className="mr-2 h-4 w-4" /> },
          { href: "/dashboard/admin/settings", label: "Settings", icon: <Settings className="mr-2 h-4 w-4" /> },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-white h-[calc(100vh-4rem)] border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {extractInitials(user.name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{user.name || user.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={location === item.href ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  {item.icon}
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
            {navItems.slice(0, 3).map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={location === item.href ? "secondary" : "ghost"} 
                  size="sm"
                  className="flex flex-col h-16 px-2"
                >
                  {item.icon.props.children}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                          {extractInitials(user.name || user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || user.username}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <div className="space-y-1">
                    {navItems.slice(3).map((item) => (
                      <Link key={item.href} href={item.href}>
                        <SheetClose asChild>
                          <Button 
                            variant={location === item.href ? "secondary" : "ghost"} 
                            className="w-full justify-start"
                          >
                            {item.icon}
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
