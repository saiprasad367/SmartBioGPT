import { create } from "zustand";
import { authApi, tokenStore, apiErrorMessage } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ emailConfirmationRequired: boolean }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    if (!tokenStore.get()) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, loading: false });
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      tokenStore.set(res.token, res.refreshToken);
      set({ user: res.user });
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Login failed"));
    }
  },

  loginWithGoogle: async (idToken) => {
    try {
      const res = await authApi.google(idToken);
      tokenStore.set(res.token, res.refreshToken);
      set({ user: res.user });
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Google sign-in failed"));
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await authApi.register({ name, email, password });
      if (res.token) {
        tokenStore.set(res.token, res.refreshToken);
        set({ user: res.user });
      }
      return { emailConfirmationRequired: Boolean(res.emailConfirmationRequired) };
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Sign up failed"));
    }
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    set({ user: null });
  },
}));

// Global sign-out when a refresh finally fails.
if (typeof window !== "undefined") {
  window.addEventListener("sbg:signed-out", () => {
    tokenStore.clear();
    useAuthStore.setState({ user: null });
  });
}
