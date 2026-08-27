import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const TOKEN_KEY = "sbg.token";
const REFRESH_KEY = "sbg.refreshToken";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (token: string, refresh?: string | null) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Transparent one-shot refresh on 401.
let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    tokenStore.set(data.token, data.refreshToken);
    return data.token as string;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing = refreshing || tryRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      window.dispatchEvent(new CustomEvent("sbg:signed-out"));
    }
    return Promise.reject(error);
  }
);

/** Normalize backend `{ error: { message } }` shape into a plain string. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const e = err as AxiosError<{ error?: { message?: string; details?: unknown } }>;
  return e?.response?.data?.error?.message || e?.message || fallback;
}

// ---- typed endpoints -------------------------------------------------

export interface Disease { id: string; acronym: string | null; description: string | null }
export interface Drug { id: string; name: string }
export interface Interaction { partner: string; accession: string | null; source: string; score: number | null }
export interface ProteinStructure {
  source: "pdb" | "alphafold" | null;
  id?: string;
  format?: "pdb" | "mmcif";
  url?: string;
  provider?: string;
  pdbIds: string[];
  alphaFoldId: string | null;
}
export interface ProteinDossier {
  query: string;
  accession: string;
  name: string;
  gene: string | null;
  geneSynonyms: string[];
  organism: string | null;
  taxonId: number | null;
  length: number | null;
  sequence: string | null;
  function: string | null;
  keywords: string[];
  diseases: Disease[];
  drugs: Drug[];
  interactions: Interaction[];
  chembl: { prefName?: string; targetType?: string } | null;
  structure: ProteinStructure;
  sources: string[];
  retrievedAt: string;
}

export interface ChatMessageDTO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  degraded?: boolean;
  created_at: string;
}
export interface ChatSummary {
  id: string;
  title: string;
  protein_accession: string | null;
  created_at: string;
  updated_at: string;
}
export interface Favorite {
  accession: string;
  name: string | null;
  gene: string | null;
  organism: string | null;
  created_at: string;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    api.post("/auth/register", body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post("/auth/login", body).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data.user),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};

export const bioApi = {
  search: (query: string) =>
    api.post<{ data: ProteinDossier }>("/bio/search", { query }).then((r) => r.data.data),
  protein: (accession: string) =>
    api.get<{ data: ProteinDossier }>(`/bio/protein/${accession}`).then((r) => r.data.data),
};

export const structureApi = {
  resolve: (identifier: string) =>
    api.get<{ data: ProteinStructure & { url: string; format: string } }>(
      `/structure/${identifier}`
    ).then((r) => r.data.data),
};

export const chatApi = {
  list: () => api.get<{ data: ChatSummary[] }>("/chat").then((r) => r.data.data),
  get: (id: string) =>
    api.get<{ data: ChatSummary & { messages: ChatMessageDTO[] } }>(`/chat/${id}`).then((r) => r.data.data),
  send: (body: { chatId?: string; message: string; proteinAccession?: string }) =>
    api
      .post<{ chatId: string; message: ChatMessageDTO; degraded: boolean }>("/chat/message", body)
      .then((r) => r.data),
  rename: (id: string, title: string) =>
    api.patch(`/chat/${id}`, { title }).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/chat/${id}`).then(() => undefined),
};

export const userApi = {
  favorites: () => api.get<{ data: Favorite[] }>("/user/favorites").then((r) => r.data.data),
  addFavorite: (body: Partial<Favorite> & { accession: string }) =>
    api.post<{ data: Favorite }>("/user/favorites", body).then((r) => r.data.data),
  removeFavorite: (accession: string) =>
    api.delete(`/user/favorites/${accession}`).then(() => undefined),
  history: () => api.get<{ data: { query: string; accession: string | null; created_at: string }[] }>(
    "/user/history"
  ).then((r) => r.data.data),
};

export default api;
