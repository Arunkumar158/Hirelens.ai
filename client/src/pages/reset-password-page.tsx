import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Monitor } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const [token, setToken] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenIsValid, setTokenIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1] || "");
    const tokenFromUrl = searchParams.get("token") || "";
    setToken(tokenFromUrl);

    const validateToken = async () => {
      if (!tokenFromUrl) {
        setTokenIsValid(false);
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/reset-password/validate?token=${encodeURIComponent(tokenFromUrl)}`, {
          credentials: "include",
        });
        setTokenIsValid(response.ok);
      } catch {
        setTokenIsValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [location]);

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      const data = await response.json();
      setFeedback({ type: "success", message: data.message || "Password reset successful." });
      form.reset();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not reset password. Please try again.",
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

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Reset password</h2>
        <p className="mb-6 text-center text-sm text-gray-500">Set a new password for your account.</p>

        {isValidatingToken ? (
          <div className="py-6 text-center text-sm text-gray-500">Validating reset link...</div>
        ) : !tokenIsValid ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            This reset link is invalid or expired. Request a new one from the forgot password page.
          </div>
        ) : (
          <>
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
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}

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
