/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";

type ProfileStore = {
  profile: any;
  loading: boolean;
  error: any;
  setProfile: (profile: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: any) => void;
};

export const useProfileStore = create<ProfileStore>()((set) => ({
  profile: null,
  loading: false,
  error: null,
  setProfile: (profile: any) => set({ profile }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: any) => set({ error }),
}));
