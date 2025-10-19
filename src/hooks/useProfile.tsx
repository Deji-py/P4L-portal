/* eslint-disable @typescript-eslint/no-unused-vars */
// define the fetchProfile function

import { supabaseClient } from "@/utils/client";
import { useQuery } from "@tanstack/react-query";
import useAuth from "./useAuth";

const fetchProfile = async (userId: string, tableName: string) => {
  const { data, error } = await supabaseClient
    .from(tableName)
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) {
    console.log(error);
    throw error;
  }

  if (!data) return null;

  return data;
};

function useProfile(tableName: "aggregators" | "bulk_traders") {
  const { user } = useAuth();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorData,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user?.id as string, tableName),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    profile,
    profileLoading,
    profileError,
    profileErrorData,
  };
}

export default useProfile;
