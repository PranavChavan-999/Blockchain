import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AUTH_STORAGE_KEY = "ugf-auth";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      address: null,
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      authStatusMessage: null,

      setAuth: (address, token, user = null) =>
        set({
          address: address?.toLowerCase() ?? null,
          token,
          user: user ?? { wallet_address: address?.toLowerCase() },
          isAuthenticated: Boolean(address && token),
          isLoading: false,
          authError: null,
          authStatusMessage: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setAuthError: (authError) =>
        set({ authError, isLoading: false, authStatusMessage: null }),

      setAuthStatusMessage: (authStatusMessage) => set({ authStatusMessage }),

      clearAuth: () =>
        set({
          address: null,
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          authError: null,
          authStatusMessage: null,
        }),

      /** True when persisted JWT matches the connected wallet */
      matchesWallet: (walletAddress) => {
        const state = get();
        if (!state.isAuthenticated || !state.token || !walletAddress) {
          return false;
        }
        return (
          state.address?.toLowerCase() === walletAddress.toLowerCase()
        );
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        address: state.address,
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
