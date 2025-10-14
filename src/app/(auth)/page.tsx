/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, X, AlertCircle, RotateCcw } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom Components
import FormBuilder, { FormType } from "@/components/core/FormBuilder";

// Hooks & Utils
import useAuth from "@/hooks/useAuth";
import { supabaseClient } from "@/utils/client";
import { toast } from "sonner";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

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
type RoleType = "aggregator" | "bulk_trader";

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
// SUB-COMPONENTS
// ============================================================================

const CustomAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <Alert className="mb-6 border-destructive/50 bg-destructive/10 text-destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span className="text-sm font-medium text-destructive">{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-auto p-1 text-destructive hover:text-destructive/80"
      >
        <X className="h-4 w-4" />
      </Button>
    </AlertDescription>
  </Alert>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LoginScreen = () => {
  // ========================================================================
  // HOOKS & STATE
  // ========================================================================

  const router = useRouter();
  const { login, forgotPassword, verifyOtp, userLoading } = useAuth();

  const params = useSearchParams();
  const default_role = params.get("role") as RoleType;

  const [step, setStep] = useState<StepType>("login");
  const [role, setRole] = useState<RoleType>(default_role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState<string>("");
  const [showNonAdminAlert, setShowNonAdminAlert] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_DURATION);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // set default role
    if (default_role) {
      setRole(default_role);
    } else {
      setRole("aggregator");
      setCookie("intended_role", "aggregator", 60 * 5);
      router.push(`?role=aggregator`);
    }
  }, [default_role]);

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

  // Auto-dismiss non-admin alert after 5 seconds
  useEffect(() => {
    if (showNonAdminAlert) {
      const timer = setTimeout(() => {
        setShowNonAdminAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNonAdminAlert]);

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

  const getRoleLabel = () => {
    return role === "aggregator" ? "Aggregator" : "Bulk Trader";
  };

  const getRoleIcon = () => {
    if (role === "aggregator") {
      return (
        <svg
          width="32"
          height="33"
          viewBox="0 0 32 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.23762 13.3491C6.42085 13.3491 6.59207 13.2635 6.933 13.0938L9.67398 11.73C10.8875 11.1248 11.4943 10.8229 11.4943 10.3453V4.33767M6.23762 13.3491C6.05439 13.3491 5.88317 13.2635 5.54224 13.0938L2.80126 11.73C1.58773 11.1248 0.980957 10.8229 0.980957 10.3453V4.33767M6.23762 13.3491V7.34148M11.4943 4.33767C11.4943 3.86007 10.8875 3.55668 9.67398 2.95292L6.933 1.58919C6.59207 1.41947 6.42236 1.33386 6.23762 1.33386C6.05439 1.33386 5.88317 1.41947 5.54224 1.58919L2.80126 2.95292C1.58773 3.55818 0.980957 3.86007 0.980957 4.33767M11.4943 4.33767C11.4943 4.81528 10.8875 5.11866 9.67398 5.72243L6.933 7.08616C6.59207 7.25587 6.42236 7.34148 6.23762 7.34148M0.980957 4.33767C0.980957 4.81528 1.58773 5.11866 2.80126 5.72243L5.54224 7.08616C5.88317 7.25587 6.05289 7.34148 6.23762 7.34148M25.7624 13.3491C25.9456 13.3491 26.1168 13.2635 26.4578 13.0938L29.1987 11.73C30.4123 11.1248 31.019 10.8229 31.019 10.3453V4.33767M25.7624 13.3491C25.5791 13.3491 25.4079 13.2635 25.067 13.0938L22.326 11.73C21.1125 11.1248 20.5057 10.8229 20.5057 10.3453V4.33767M25.7624 13.3491V7.34148M31.019 4.33767C31.019 3.86007 30.4123 3.55668 29.1987 2.95292L26.4578 1.58919C26.1168 1.41947 25.9471 1.33386 25.7624 1.33386C25.5791 1.33386 25.4079 1.41947 25.067 1.58919L22.326 2.95292C21.1125 3.55818 20.5057 3.86007 20.5057 4.33767M31.019 4.33767C31.019 4.81528 30.4123 5.11866 29.1987 5.72243L26.4578 7.08616C26.1168 7.25587 25.9471 7.34148 25.7624 7.34148M20.5057 4.33767C20.5057 4.81528 21.1125 5.11866 22.326 5.72243L25.067 7.08616C25.4079 7.25587 25.5776 7.34148 25.7624 7.34148"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.249 7.34149H16.751M0.980957 16.3529V21.6096C0.980957 23.7183 0.980957 24.7741 1.4871 25.5311C1.70631 25.8592 1.98803 26.1409 2.31615 26.3601C3.07311 26.8662 4.12895 26.8662 6.23762 26.8662M31.019 16.3529V21.6096C31.019 23.7183 31.019 24.7741 30.5129 25.5311C30.2937 25.8592 30.012 26.1409 29.6838 26.3601C28.9269 26.8662 27.8711 26.8662 25.7624 26.8662"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 31.3719C16.1832 31.3719 16.3544 31.2878 16.6953 31.1166L19.4363 29.7529C20.6498 29.1491 21.2566 28.8457 21.2566 28.3681V22.3605M16 31.3719C15.8167 31.3719 15.6455 31.2878 15.3046 31.1166L12.5636 29.7529C11.3501 29.1491 10.7433 28.8457 10.7433 28.3681V22.3605M16 31.3719V25.3643M21.2566 22.3605C21.2566 21.8829 20.6498 21.5795 19.4363 20.9757L16.6953 19.612C16.3544 19.4408 16.1847 19.3567 16 19.3567C15.8167 19.3567 15.6455 19.4408 15.3046 19.612L12.5636 20.9757C11.3501 21.5795 10.7433 21.8829 10.7433 22.3605M21.2566 22.3605C21.2566 22.8381 20.6498 23.1415 19.4363 23.7453L16.6953 25.109C16.3544 25.2802 16.1847 25.3643 16 25.3643M10.7433 22.3605C10.7433 22.8381 11.3501 23.1415 12.5636 23.7453L15.3046 25.109C15.6455 25.2802 15.8152 25.3643 16 25.3643"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    return (
      <svg
        width="38"
        height="31"
        viewBox="0 0 38 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27.5403 29.0181C28.4463 29.0181 29.3152 28.6582 29.9559 28.0175C30.5965 27.3769 30.9564 26.5079 30.9564 25.6019C30.9564 24.6959 30.5965 23.827 29.9559 23.1864C29.3152 22.5457 28.4463 22.1858 27.5403 22.1858C26.6343 22.1858 25.7654 22.5457 25.1247 23.1864C24.4841 23.827 24.1241 24.6959 24.1241 25.6019C24.1241 26.5079 24.4841 27.3769 25.1247 28.0175C25.7654 28.6582 26.6343 29.0181 27.5403 29.0181ZM10.4596 29.0181C11.3656 29.0181 12.2345 28.6582 12.8752 28.0175C13.5158 27.3769 13.8757 26.5079 13.8757 25.6019C13.8757 24.6959 13.5158 23.827 12.8752 23.1864C12.2345 22.5457 11.3656 22.1858 10.4596 22.1858C9.55358 22.1858 8.68467 22.5457 8.04402 23.1864C7.40337 23.827 7.04346 24.6959 7.04346 25.6019C7.04346 26.5079 7.40337 27.3769 8.04402 28.0175C8.68467 28.6582 9.55358 29.0181 10.4596 29.0181Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M30.9565 13.6454H36.0807M36.0807 13.6454V17.0616C36.0807 21.0875 36.0807 23.0996 34.8304 24.3516C33.9986 25.1835 32.8302 25.4619 30.9565 25.5541M36.0807 13.6454L33.9012 9.59732C32.7226 7.40758 32.1333 6.31271 31.1205 5.70976C30.1093 5.1051 28.8675 5.1051 26.3806 5.1051H23.2702M7.04352 25.5541C5.16977 25.4619 4.00316 25.1835 3.16962 24.3516C1.91931 23.0996 1.91931 21.0875 1.91931 17.0616V10.2293C1.91931 6.20339 1.91931 4.18958 3.16962 2.93927C4.41992 1.68896 6.43374 1.68896 10.4597 1.68896H16.0963C18.0042 1.68896 18.9573 1.68896 19.7293 1.94005C20.4984 2.18995 21.1973 2.61828 21.7691 3.19005C22.3409 3.76182 22.7692 4.46078 23.0191 5.22979C23.2702 6.00184 23.2702 6.95494 23.2702 8.86285C23.2702 10.9467 23.2702 11.9903 22.6997 12.6958C22.5869 12.8347 22.4605 12.9611 22.3205 13.075C21.6151 13.6454 20.5731 13.6454 18.4876 13.6454H12.1677M24.1242 25.6019H13.8758"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.5839 17.0615C15.5839 17.0615 14.436 16.1118 13.4266 15.21C12.7143 14.6361 12.1677 14.1459 12.1677 13.6539C12.1677 13.2184 12.5947 12.8136 13.2882 12.1782C14.2721 11.36 15.5839 10.2292 15.5839 10.2292"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getLoginButtonText = () => {
    return `Sign in as ${getRoleLabel()}`;
  };

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
            if (userData && userData.isAdmin) {
              router.push("/dashboard");
            } else {
              setShowNonAdminAlert(true);
            }
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

  const handleBackToLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setStep("login");
    setShowNonAdminAlert(false);
    // Reset forms
    forgotPasswordForm.reset();
    otpForm.reset();
    resetPasswordForm.reset();
  };

  const setCookie = (
    name: string,
    value: string,
    maxAgeSeconds: number = 60 * 5
  ) => {
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; path=/; max-age=${maxAgeSeconds}`;
  };

  // ========================================================================
  // RENDER METHODS
  // ========================================================================

  const renderLoginStep = () => (
    <Card className=" p-0  border-0  bg-transparent overflow-hidden relative">
      <CardHeader className="p-0">
        <div className="text-start flex items-center justify-between w-full  px-3 relative z-10 ">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Login as {getRoleLabel()}
            </CardTitle>
            <CardDescription className="  text-gray-500 ">
              Sign in to your dashboard
            </CardDescription>
          </div>

          <div className="bg-secondary w-12 text-primary flex flex-col justify-center items-center h-12 rounded-lg">
            {getRoleIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 relative z-10 pb-12">
        {showNonAdminAlert && (
          <CustomAlert
            message="You are not authorized to access this dashboard. Please contact the superadmin."
            onClose={() => setShowNonAdminAlert(false)}
          />
        )}

        <Tabs
          value={role}
          onValueChange={(value) => {
            const newRole = value as RoleType;
            setRole(newRole);
            // Set the intended_role cookie when user switches tabs
            const roleValue =
              newRole === "aggregator" ? "aggregator" : "bulk-trader";
            setCookie("intended_role", roleValue, 60 * 5); // 5 minutes
            // Set url params
            router.push(`?role=${value}`);
          }}
          className="w-full mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aggregator">Aggregator</TabsTrigger>
            <TabsTrigger value="bulk_trader">Bulk Trader</TabsTrigger>
          </TabsList>
        </Tabs>

        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
            className="space-y-6"
          >
            <FormBuilder formConfig={loginFormConfig} />
            <Button
              size="lg"
              className="w-full h-11 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              type="submit"
              disabled={isSubmitting || userLoading}
            >
              {isSubmitting || userLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Signing in...
                </div>
              ) : (
                getLoginButtonText()
              )}
            </Button>
          </form>
        </Form>

        <div className="space-y-4 mt-16 text-center">
          <a
            href="#"
            className="block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setStep("forgotPassword");
            }}
          >
            Forgot your password?
          </a>

          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 hover:gap-2 duration-200"
            >
              Sign up
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="text-xs mt-10 font-normal text-center">
          By clicking login you agree to the{" "}
          <span className="text-primary underline">terms and conditions</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderForgotPasswordStep = () => (
    <Card className="border-0  overflow-hidden relative">
      <div className=" flex size-full items-center top-0  justify-center absolute overflow-hidden h-[20%] bg-card p-15">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
          )}
        />
      </div>
      <CardHeader className="text-center py-5 z-10">
        <CardTitle className="text-xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription className=" text-muted-foreground mt-2 max-w-sm mx-auto">
          Enter your email address and we&apos;ll <br /> send you a verification
          code
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-12 z-10">
        <Form {...forgotPasswordForm}>
          <form
            onSubmit={forgotPasswordForm.handleSubmit(
              handleForgotPasswordSubmit
            )}
            className="space-y-6"
          >
            <FormBuilder formConfig={forgotPasswordFormConfig} />
            <Button
              size="lg"
              className="w-full h-11 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Sending code...
                </div>
              ) : (
                "Send verification code"
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              Remember your password?
            </span>
          </div>
        </div>

        <div className="text-center">
          <a
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 hover:gap-2 duration-200"
            onClick={handleBackToLogin}
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
          </a>
        </div>
      </CardContent>
    </Card>
  );

  const renderOtpStep = () => (
    <Card className="border-0  overflow-hidden relative">
      <div className=" flex size-full items-center top-0  justify-center absolute overflow-hidden h-[20%] bg-card p-15">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
          )}
        />
      </div>

      <CardHeader className="text-center py-5 z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          Enter verification code
        </CardTitle>
        <CardDescription className=" text-muted-foreground mt-2 max-w-sm mx-auto">
          We&apso;ve sent a 6-digit code to{" "}
          <span className="font-semibold text-foreground">{emailForOtp}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-12 z-10">
        <Form {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <FormBuilder formConfig={otpFormConfig} />
              </div>
            </div>
            <Button
              size="lg"
              className="w-full h-11 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Verifying...
                </div>
              ) : (
                "Verify code"
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              Didn&apos;t receive the code?
            </span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={handleResendOtp}
            disabled={!canResend || isSubmitting}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
              !canResend || isSubmitting
                ? "text-muted-foreground cursor-not-allowed"
                : "text-primary hover:text-primary/80 hover:gap-3"
            }`}
          >
            {canResend ? (
              <>
                Resend code
                <RotateCcw className="h-4 w-4" />
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"></div>
                Resend in {resendTimer}s
              </>
            )}
          </button>

          <div>
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 hover:gap-2 duration-200"
              onClick={handleBackToLogin}
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
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderResetPasswordStep = () => (
    <Card className="border-0  overflow-hidden relative">
      <div className=" flex size-full items-center top-0  justify-center absolute overflow-hidden h-[20%] bg-card p-15">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
          )}
        />
      </div>
      <CardHeader className="text-center py-5 z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          Create new password
        </CardTitle>
        <CardDescription className=" text-muted-foreground mt-2 max-w-sm mx-auto">
          Choose a strong password to secure your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-12 z-10">
        <Form {...resetPasswordForm}>
          <form
            onSubmit={resetPasswordForm.handleSubmit(handleResetPasswordSubmit)}
            className="space-y-6"
          >
            <FormBuilder formConfig={resetPasswordFormConfig} />
            <Button
              size="lg"
              className="w-full h-11 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Updating password...
                </div>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              All set?
            </span>
          </div>
        </div>

        <div className="text-center">
          <a
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 hover:gap-2 duration-200"
            onClick={handleBackToLogin}
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
          </a>
        </div>
      </CardContent>
    </Card>
  );

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className=" flex items-center justify-center  rounded-2xl ">
      <div className="relative w-full  z-10">
        {step === "login" && renderLoginStep()}
        {step === "forgotPassword" && renderForgotPasswordStep()}
        {step === "otp" && renderOtpStep()}
        {step === "resetPassword" && renderResetPasswordStep()}
      </div>
    </div>
  );
};

export default LoginScreen;
