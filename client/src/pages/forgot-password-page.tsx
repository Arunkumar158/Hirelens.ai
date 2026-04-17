import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Monitor } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await apiRequest("POST", "/api/forgot-password", values);
      const data = await response.json();
      setFeedback({ type: "success", message: data.message || "Reset link sent successfully." });
      form.reset();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not send reset link. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div className="mb-8 flex items-center justify-center">
          <Monitor className="h-9 w-9 text-primary" />
          <span className="ml-2 text-2xl font-bold text-primary">HireLens</span>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Forgot password?</h2>
        <p className="mb-6 text-center text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>

        {feedback && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {feedback.message}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Back to{" "}
          <Link href="/auth" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
