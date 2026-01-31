import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  proteinData?: ProteinData | null;
}

export interface ProteinData {
  name: string;
  gene: string;
  organism: string;
  function: string;
  diseases: string[];
  drugs: string[];
  structure?: {
    pdbIds: string[];
    alphaFoldUrl: string;
  };
  interactions?: any[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  activeProteinId: string | null; // For 3D viewer
  activeProteinData: any | null; // For Chat Context Persistence

  // Actions
  createSession: () => Promise<string>;
  setCurrentSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, "id" | "timestamp">) => Promise<void>;
  setLoading: (loading: boolean) => void;
  getCurrentSession: () => ChatSession | null;
  setActiveProtein: (proteinId: string | null) => void;
  setActiveProteinData: (data: any | null) => void;
  deleteSession: (id: string) => Promise<void>;
  fetchSessions: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  activeProteinId: null,
  activeProteinData: null,

  fetchSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Chats
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

    const sessions: ChatSession[] = [];

    // For each chat, fetch messages (This could be optimized with a join, but simple for now)
    for (const chat of chats) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      sessions.push({
        id: chat.id,
        title: chat.title || 'New Chat',
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at),
        messages: messages?.map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at)
        })) || []
      });
    }

    set({ sessions });
    // ChatGPT Style: Do NOT auto-select the latest chat. Start with empty.
    if (!get().currentSessionId) {
      set({ currentSessionId: null });
    }
  },

  createSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: 'New Research'
      })
      .select()
      .single();

    if (error) throw error;

    const newSession: ChatSession = {
      id: data.id,
      title: data.title,
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: newSession.id,
    }));

    return newSession.id;
  },

  setCurrentSession: (id) => {
    set({ currentSessionId: id });
  },

  setActiveProtein: (proteinId) => {
    set({ activeProteinId: proteinId });
  },

  setActiveProteinData: (data) => {
    set({ activeProteinData: data });
  },

  addMessage: async (sessionId, message) => {
    // Optimistic Update
    const tempId = Math.random().toString();
    const newMessage: Message = {
      ...message,
      id: tempId,
      timestamp: new Date(),
    };

    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
            ...session,
            messages: [...session.messages, newMessage],
            updatedAt: new Date(),
          }
          : session
      ),
    }));

    // DB Update
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: sessionId,
        role: message.role,
        content: message.content
      });

    if (error) {
      console.error("Failed to save message", error);
      // Rollback optimism? For now, we just log.
      return;
    }

    // Update Chat Title if it's the first user message
    const session = get().sessions.find(s => s.id === sessionId);
    if (session && session.messages.length <= 1 && message.role === 'user') {
      const newTitle = message.content.slice(0, 30);
      await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', sessionId);

      set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
      }));
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  getCurrentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId) || null;
  },

  deleteSession: async (id) => {
    await supabase.from('chats').delete().eq('id', id);

    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      return {
        sessions: newSessions,
        currentSessionId: state.currentSessionId === id
          ? (newSessions[0]?.id || null)
          : state.currentSessionId,
      };
    });
  },
}));
