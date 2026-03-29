// authStore — authenticated user state and token management
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPublic } from "@/types/voyage";
import { setStoredTokens, clearStoredTokens } from "@/lib/api";

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  setAuth: (
    user: UserPublic,
    accessToken: string,
    refreshToken: string,
  ) => void;
  clearAuth: () => void;
  updateUser: (user: UserPublic) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setStoredTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },

      clearAuth: () => {
        clearStoredTokens();
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: "stellar-auth",
      // Only persist the user object — tokens are in localStorage separately
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
