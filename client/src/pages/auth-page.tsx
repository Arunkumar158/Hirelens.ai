import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Monitor } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    const redirectPath =
      user.role === "jobseeker"
        ? "/dashboard/jobseeker"
        : user.role === "recruiter"
          ? "/dashboard/recruiter"
          : user.role === "admin"
            ? "/dashboard/admin"
            : "/";
    navigate(redirectPath);
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div
      className="flex items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}
    >
      <div
        className="max-w-6xl w-full flex flex-col md:flex-row rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Left column: Auth forms */}
        <div className="w-full md:w-1/2 p-10 sm:p-12">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <Monitor className="h-9 w-9 text-primary" />
            <span className="ml-2 text-2xl font-bold text-primary">HireLens</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome to HireLens</h2>
            <p className="mt-2 text-sm text-gray-500">
              AI-powered resume screening and feedback platform
            </p>
          </div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <div className="mt-2 text-right">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </Form>
        </div>

        {/* Right column: Hero image and info */}
        <div className="hidden md:block md:w-1/2 bg-primary-600 p-10 text-white">
          <div className="h-full flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-4">AI-Powered Resume Analysis</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Get instant feedback on your resume's match with job descriptions</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Identify missing skills and get tailored improvement suggestions</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>For recruiters: Screen multiple resumes at once with AI-powered ranking</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Get detailed analytics and visualizations of your skills versus job requirements</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link href="/">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
