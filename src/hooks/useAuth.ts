/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmailOtpType, User, createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabaseClient } from "@/utils/client";

// Define types for callbacks
type AuthCallback<T = any> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

// Define AdminData type based on admin table schema
type AdminData = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  created_at: string;
};

type CombinedUser = User & {
  isAdmin?: boolean;
  adminData?: AdminData | null;
};

// Fetch authenticated user and their admin data
const fetchUser = async (): Promise<CombinedUser | null> => {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      // console.error("Error fetching user:", error.message);
      return null;
    }
    if (!data.user) return null;

    const { data: adminData, error: adminError } = await supabaseClient
      .from("admin")
      .select("*")
      .eq("user_id", data.user.id)
      .in("role", ["admin", "superadmin"])
      .single();

    // PGRST116 means "No rows found", which is not an error for non-admin users
    if (adminError && adminError.code !== "PGRST116") {
      // console.error("Error fetching admin data:", adminError.message);
      return null;
    }

    return {
      ...data.user,
      isAdmin: !!adminData,
      adminData: adminData ? (adminData as AdminData) : null,
    };
  } catch (error) {
    // console.error("Unexpected error in fetchUser:", error);
    return null;
  }
};

// Login with email and password
const login = async (
  data: { email: string; password: string },
  callbacks?: AuthCallback<CombinedUser | null>
): Promise<CombinedUser | null> => {
  try {
    const { data: loginData, error } =
      await supabaseClient.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

    if (error || !loginData.user) {
      throw new Error(error?.message || "Login failed");
    }

    if (!loginData.user) return null;

    const { data: adminData, error: adminError } = await supabaseClient
      .from("admin")
      .select("*")
      .eq("user_id", loginData.user.id)
      .in("role", ["admin", "superadmin"])
      .single();

    if (adminError && adminError.code !== "PGRST116") {
      throw new Error(`Error fetching admin data: ${adminError.message}`);
    }

    callbacks?.onSuccess?.({
      ...loginData.user,
      isAdmin: !!adminData,
      adminData: adminData ? (adminData as AdminData) : null,
    });
    return {
      ...loginData.user,
      isAdmin: !!adminData,
      adminData: adminData ? (adminData as AdminData) : null,
    };
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Unknown error during login");
    callbacks?.onError?.(err);
    throw err;
  }
};

// Logout
const logout = async (callbacks?: AuthCallback<void>): Promise<void> => {
  try {
    const { error } = await supabaseClient.auth.signOut({ scope: "local" });
    if (error) throw error;
    callbacks?.onSuccess?.(undefined);
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Unknown error during logout");
    callbacks?.onError?.(err);
    throw err;
  }
};

// Signup with email and password
const signup = async (
  data: { email: string; password: string },
  callbacks?: AuthCallback<User>
): Promise<User> => {
  try {
    const { data: signupData, error } = await supabaseClient.auth.signUp({
      email: data.email.trim(),
      password: data.password,
    });

    if (error || !signupData.user) {
      throw new Error(error?.message || "Signup failed");
    }

    callbacks?.onSuccess?.(signupData.user);
    return signupData.user;
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Unknown error during signup");
    callbacks?.onError?.(err);
    throw err;
  }
};

// Send OTP to email for password reset
const forgotPassword = async (
  email: string,
  callbacks?: AuthCallback<void>
): Promise<void> => {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email.trim()
    );
    if (error) throw error;
    callbacks?.onSuccess?.(undefined);
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error("Unknown error during password reset");
    callbacks?.onError?.(err);
    throw err;
  }
};

// Verify OTP from email
const verifyOtp = async (
  data: { email: string; token: string; type?: EmailOtpType },
  callbacks?: AuthCallback<User>
): Promise<User> => {
  try {
    const { email, token, type = "email" } = data;
    const { data: verifyData, error } = await supabaseClient.auth.verifyOtp({
      email: email.trim(),
      token,
      type,
    });

    if (error || !verifyData.user) {
      throw new Error(error?.message || "OTP verification failed");
    }

    callbacks?.onSuccess?.(verifyData.user);
    return verifyData.user;
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error("Unknown error during OTP verification");
    callbacks?.onError?.(err);
    throw err;
  }
};

// Check if current user is admin
function checkIsAdmin(user: CombinedUser | null): boolean {
  return !!user?.isAdmin;
}

// Hook that provides auth utilities
function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery<CombinedUser | null>({
    queryKey: ["auth", "user"],
    queryFn: fetchUser,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: (args: {
      data: { email: string; password: string; role: string };
      callbacks?: AuthCallback<CombinedUser | null>;
    }) => login(args.data, args.callbacks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || "Login failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: (callbacks?: AuthCallback<void>) => logout(callbacks),
    onSuccess: (_data, callbacks) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      if (!callbacks?.onSuccess) {
        toast.success("Logged out successfully!");
      }
    },
    onError: (error: Error, callbacks) => {
      if (!callbacks?.onError) {
        toast.error(error.message || "Logout failed");
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: (args: {
      data: { email: string; password: string };
      callbacks?: AuthCallback<User>;
    }) => signup(args.data, args.callbacks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      toast.success("Signup successful! Please check your email.");
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || "Signup failed");
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (args: { email: string; callbacks?: AuthCallback<void> }) =>
      forgotPassword(args.email, args.callbacks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      toast.success("OTP sent to your email.");
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || "Failed to send OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (args: {
      data: { email: string; token: string; type?: EmailOtpType };
      callbacks?: AuthCallback<User>;
    }) => verifyOtp(args.data, args.callbacks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      toast.success("OTP verified successfully.");
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || "OTP verification failed");
    },
  });

  return {
    user,
    userLoading,

    login: (
      data: { email: string; password: string; role: string },
      callbacks?: AuthCallback<CombinedUser | null>
    ) => loginMutation.mutateAsync({ data, callbacks }),
    loginStatus: loginMutation.status,

    logout: (callbacks?: AuthCallback<void>) =>
      logoutMutation.mutateAsync(callbacks),
    logoutStatus: logoutMutation.status,

    signup: (
      data: { email: string; password: string },
      callbacks?: AuthCallback<User>
    ) => signupMutation.mutateAsync({ data, callbacks }),
    signupStatus: signupMutation.status,

    forgotPassword: (email: string, callbacks?: AuthCallback<void>) =>
      forgotPasswordMutation.mutateAsync({ email, callbacks }),
    forgotPasswordStatus: forgotPasswordMutation.status,

    verifyOtp: (
      data: { email: string; token: string; type?: EmailOtpType },
      callbacks?: AuthCallback<User>
    ) => verifyOtpMutation.mutateAsync({ data, callbacks }),
    verifyOtpStatus: verifyOtpMutation.status,

    checkIsAdmin: () => checkIsAdmin(user ?? null),
  };
}

export default useAuth;
