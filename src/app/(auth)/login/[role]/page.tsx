/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Leaf, Lock, Mail, RotateCcw, Truck } from "lucide-react";

// UI Components
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Custom Components
import FormBuilder, { FormType } from "@/components/core/FormBuilder";

// Hooks & Utils
import useAuth from "@/hooks/useAuth";
import { supabaseClient } from "@/utils/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IconPackages } from "@tabler/icons-react";

// ============================================================================
// SCHEMAS
// ============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

// ============================================================================
// TYPES
// ============================================================================

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type StepType = "login" | "forgotPassword" | "otp" | "resetPassword";
type RoleType = "aggregator" | "bulk-trader" | "farmer";

// ============================================================================
// ROLE CONFIGURATIONS
// ============================================================================

const roleConfig = {
  aggregator: {
    title: "Aggregator",
    description: "Connect farmers with bulk traders",
    icon: <IconPackages />,
    accentColor: "text-primary dark:text-primary",
    iconBg: "bg-secondary dark:bg-secondary/30",
  },
  "bulk-trader": {
    title: "Bulk Trader",
    description: "Purchase produce at scale",
    icon: <Truck />,
    accentColor: "text-primary dark:text-primary",
    iconBg: "bg-secondary dark:bg-secondary/30",
  },
  farmer: {
    title: "Farmer",
    description: "Sell your produce directly",
    icon: <Leaf />,
    accentColor: "text-primary dark:text-primary",
    iconBg: "bg-secondary dark:bg-secondary/30",
  },
};

// ============================================================================
// FORM CONFIGURATIONS
// ============================================================================

const loginFormConfig: FormType = [
  {
    label: "Email",
    name: "email",
    input_type: "email",
    leftIcon: <Mail size={16} />,
  },
  {
    label: "Password",
    name: "password",
    input_type: "password",
    leftIcon: <Lock size={16} />,
  },
];

const forgotPasswordFormConfig: FormType = [
  {
    label: "Email",
    name: "email",
    input_type: "email",
    placeholder: "example@gmail.com",
    leftIcon: <Mail size={16} />,
  },
];

const otpFormConfig: FormType = [
  {
    name: "otp",
    input_type: "otp",
    placeholder: "Enter 6-digit OTP",
  },
];

const resetPasswordFormConfig: FormType = [
  {
    label: "New Password",
    name: "newPassword",
    input_type: "password",
    placeholder: "Enter new password",
    leftIcon: <Lock size={16} />,
  },
  {
    label: "Confirm New Password",
    name: "confirmNewPassword",
    input_type: "password",
    placeholder: "Confirm new password",
    leftIcon: <Lock size={16} />,
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const RESEND_TIMER_DURATION = 30;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LoginScreen = () => {
  // ========================================================================
  // HOOKS & STATE
  // ========================================================================

  const router = useRouter();
  const pathname = usePathname();
  const { login, forgotPassword, verifyOtp, userLoading } = useAuth();

  const [step, setStep] = useState<StepType>("login");
  const [role, setRole] = useState<RoleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState<string>("");
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_DURATION);
  const [canResend, setCanResend] = useState(false);

  // Extract role from pathname
  useEffect(() => {
    const extractedRole = pathname.includes("aggregator")
      ? "aggregator"
      : pathname.includes("bulk-trader")
      ? "bulk-trader"
      : pathname.includes("farmer")
      ? "farmer"
      : null;

    setRole(extractedRole);
  }, [pathname]);

  // Form instances
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Handle resend OTP timer
  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const showSuccessToast = (message: string) => {
    toast.success(message);
  };

  const resetOtpTimer = () => {
    setResendTimer(RESEND_TIMER_DURATION);
    setCanResend(false);
  };

  // Show loading screen if role is not determined
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const currentRoleConfig = roleConfig[role];

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    try {
      await login(
        { email: data.email, password: data.password, role },
        {
          onSuccess: (userData) => {
            router.push("/dashboard");
          },
        }
      );
    } catch (error) {
      // Error handling is managed by useAuth's toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await forgotPassword(data.email, {
        onSuccess: () => {
          setEmailForOtp(data.email);
          resetOtpTimer();
          setStep("otp");
        },
      });
    } catch (error) {
      // Error handling is managed by useAuth's toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);

    try {
      await forgotPassword(emailForOtp, {
        onSuccess: () => {
          resetOtpTimer();
          showSuccessToast("OTP resent successfully!");
        },
      });
    } catch (error) {
      // Error handling is managed by useAuth's toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsSubmitting(true);

    try {
      await verifyOtp(
        { email: emailForOtp, token: data.otp, type: "recovery" },
        {
          onSuccess: () => {
            setStep("resetPassword");
            showSuccessToast("OTP verified successfully!");
          },
        }
      );
    } catch (error) {
      // Error handling is managed by useAuth's toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await supabaseClient.auth.updateUser({ password: data.newPassword });
      showSuccessToast("Password reset successfully!");
      setStep("login");
      // Reset forms
      resetPasswordForm.reset();
      loginForm.reset();
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = (e: any) => {
    e.preventDefault();
    setStep("login");
    // Reset forms
    forgotPasswordForm.reset();
    otpForm.reset();
    resetPasswordForm.reset();
  };

  // ========================================================================
  // RENDER METHODS
  // ========================================================================

  const renderLoginStep = () => (
    <Card className="w-full max-w-[26rem] bg-white dark:bg-neutral-950 border">
      <CardHeader className="space-y-3 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0",
              currentRoleConfig.iconBg,
              currentRoleConfig.accentColor
            )}
          >
            {currentRoleConfig.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">
              {currentRoleConfig.title} Login
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {currentRoleConfig.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
            className="space-y-4"
          >
            <FormBuilder formConfig={loginFormConfig} />

            <Button
              size="lg"
              className="w-full font-medium"
              type="submit"
              disabled={isSubmitting || userLoading}
            >
              {isSubmitting || userLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign in</span>
              )}
            </Button>
          </form>
        </Form>

        <div className="space-y-4 pt-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              setStep("forgotPassword");
            }}
            className="block w-full text-center text-sm font-medium text-primary hover:underline"
          >
            Forgot your password?
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-950 px-2 text-muted-foreground">
                New here?
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          By signing in, you agree to our{" "}
          <button className="text-primary hover:underline">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="text-primary hover:underline">
            Privacy Policy
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderForgotPasswordStep = () => (
    <Card className="w-full max-w-md bg-white dark:bg-neutral-950 border shadow-lg">
      <CardHeader className="space-y-2 text-center pb-5">
        <div className="mx-auto w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold">Reset Password</CardTitle>
        <CardDescription className="text-xs">
          Enter your email address and we&apos;ll send you a verification code
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...forgotPasswordForm}>
          <form
            onSubmit={forgotPasswordForm.handleSubmit(
              handleForgotPasswordSubmit
            )}
            className="space-y-4"
          >
            <FormBuilder formConfig={forgotPasswordFormConfig} />

            <Button
              size="lg"
              className="w-full font-medium"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <span>Sending code...</span>
                </div>
              ) : (
                <span>Send verification code</span>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-neutral-950 px-2 text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <button
          onClick={handleBackToLogin}
          className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back to login
        </button>
      </CardContent>
    </Card>
  );

  const renderOtpStep = () => (
    <Card className="w-full max-w-md bg-white dark:bg-neutral-950 border shadow-lg">
      <CardHeader className="space-y-2 text-center pb-5">
        <div className="mx-auto w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold">
          Verify Your Email
        </CardTitle>
        <CardDescription className="text-xs">
          We&apos;ve sent a 6-digit code to{" "}
          <span className="font-semibold text-foreground block mt-1">
            {emailForOtp}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <FormBuilder formConfig={otpFormConfig} />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full font-medium"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <span>Verify code</span>
              )}
            </Button>
          </form>
        </Form>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-950 px-2 text-muted-foreground">
                Didn&apos;t receive it?
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleResendOtp}
              disabled={!canResend || isSubmitting}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-all ${
                !canResend || isSubmitting
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:underline"
              }`}
            >
              {canResend ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Resend code
                </>
              ) : (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"></div>
                  Resend in {resendTimer}s
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleBackToLogin}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Back to login
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderResetPasswordStep = () => (
    <Card className="w-full max-w-md bg-white dark:bg-neutral-950 border shadow-lg">
      <CardHeader className="space-y-2 text-center pb-5">
        <div className="mx-auto w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold">
          Create New Password
        </CardTitle>
        <CardDescription className="text-xs">
          Choose a strong password to secure your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...resetPasswordForm}>
          <form
            onSubmit={resetPasswordForm.handleSubmit(handleResetPasswordSubmit)}
            className="space-y-4"
          >
            <FormBuilder formConfig={resetPasswordFormConfig} />

            <Button
              size="lg"
              className="w-full font-medium"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <span>Updating password...</span>
                </div>
              ) : (
                <span>Update password</span>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-neutral-950 px-2 text-muted-foreground">
              all set?
            </span>
          </div>
        </div>

        <button
          onClick={handleBackToLogin}
          className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back to login
        </button>
      </CardContent>
    </Card>
  );

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="flex items-center flex-col px-4 lg:px-0 justify-center h-screen w-full bg-muted ">
      <div className=" grid grid-cols-1 max-w-md   w-full h-full ">
        <div className=" col-span-4 flex flex-col justify-center items-center">
          <div className=" absolute top-10 left-10">
            {/* back button */}
            <Button
              variant={"secondary"}
              onClick={() => router.push("/")}
              className=" rounded-full ring-0 border border-primary"
            >
              <ArrowLeft className="w-5 h-5 text-primary hover:text-primary" />
            </Button>
          </div>
          <div className="w-full max-w-md">
            {step === "login" && renderLoginStep()}
            {step === "forgotPassword" && renderForgotPasswordStep()}
            {step === "otp" && renderOtpStep()}
            {step === "resetPassword" && renderResetPasswordStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
