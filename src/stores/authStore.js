import { create } from "zustand";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  persistAuth,
} from "../lib/api";

export const useAuthStore = create((set) => ({
  walletAddress: null,
  token: getStoredToken(),
  user: getStoredUser(),
  isAuthenticated: false,
  authLoading: false,
  authError: null,
  authStatusMessage: null,

  setWallet: (walletAddress) => set({ walletAddress }),

  setAuthLoading: (authLoading) => set({ authLoading }),

  setAuthError: (authError) => set({ authError }),

  setAuthStatusMessage: (authStatusMessage) => set({ authStatusMessage }),

  setAuth: ({ token, user, walletAddress }) => {
    persistAuth(token, user);
    set({
      token,
      user,
      walletAddress: walletAddress ?? user?.walletAddress ?? null,
      isAuthenticated: true,
      authLoading: false,
      authError: null,
      authStatusMessage: null,
    });
  },

  hydrateFromStorage: (walletAddress) => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (
      token &&
      user?.walletAddress &&
      walletAddress &&
      user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    ) {
      set({
        token,
        user,
        walletAddress,
        isAuthenticated: true,
        authLoading: false,
        authError: null,
        authStatusMessage: null,
      });
      return true;
    }
    return false;
  },

  clearAuth: () => {
    clearStoredAuth();
    set({
      walletAddress: null,
      token: null,
      user: null,
      isAuthenticated: false,
      authLoading: false,
      authError: null,
      authStatusMessage: null,
    });
  },
}));
