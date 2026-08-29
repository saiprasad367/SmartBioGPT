import { create } from "zustand";
import {
  chatApi,
  apiErrorMessage,
  type ChatMessageDTO,
  type ChatSummary,
  type ProteinDossier,
} from "@/lib/api";

type UiMessage = ChatMessageDTO & { pending?: boolean; error?: boolean };

interface ChatState {
  chats: ChatSummary[];
  currentChatId: string | null;
  messages: UiMessage[];
  isSending: boolean;
  isLoadingChat: boolean;

  /** The protein whose dossier is held in context for the AI + the 3D viewer. */
  activeProtein: ProteinDossier | null;

  fetchChats: () => Promise<void>;
  selectChat: (id: string) => Promise<void>;
  startNewChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  setActiveProtein: (dossier: ProteinDossier | null) => void;
  reset: () => void;
}

let tempId = 0;
const nextTempId = () => `tmp-${Date.now()}-${tempId++}`;

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  isSending: false,
  isLoadingChat: false,
  activeProtein: null,

  fetchChats: async () => {
    try {
      set({ chats: await chatApi.list() });
    } catch (err) {
      console.error("fetchChats", apiErrorMessage(err));
    }
  },

  selectChat: async (id) => {
    if (get().currentChatId === id && get().messages.length) return;
    set({ isLoadingChat: true, currentChatId: id });
    try {
      const chat = await chatApi.get(id);
      set({ messages: chat.messages, isLoadingChat: false });
    } catch (err) {
      console.error("selectChat", apiErrorMessage(err));
      set({ isLoadingChat: false });
    }
  },

  startNewChat: () => set({ currentChatId: null, messages: [] }),

  sendMessage: async (text) => {
    const content = text.trim();
    if (!content || get().isSending) return;

    const optimistic: UiMessage = {
      id: nextTempId(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, optimistic], isSending: true }));

    try {
      const res = await chatApi.send({
        chatId: get().currentChatId ?? undefined,
        message: content,
        proteinAccession: get().activeProtein?.accession,
      });

      set((s) => ({
        currentChatId: res.chatId,
        messages: [
          ...s.messages.filter((m) => m.id !== optimistic.id),
          { ...optimistic, id: `${optimistic.id}-final` },
          res.message,
        ],
        isSending: false,
      }));
      get().fetchChats();
    } catch (err) {
      set((s) => ({
        isSending: false,
        messages: [
          ...s.messages,
          {
            id: nextTempId(),
            role: "assistant",
            content: `⚠️ ${apiErrorMessage(err, "Could not reach the research service.")}`,
            created_at: new Date().toISOString(),
            error: true,
          },
        ],
      }));
    }
  },

  renameChat: async (id, title) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)) }));
    try {
      await chatApi.rename(id, title);
    } catch (err) {
      console.error("renameChat", apiErrorMessage(err));
      get().fetchChats();
    }
  },

  deleteChat: async (id) => {
    const wasCurrent = get().currentChatId === id;
    set((s) => ({ chats: s.chats.filter((c) => c.id !== id) }));
    if (wasCurrent) set({ currentChatId: null, messages: [] });
    try {
      await chatApi.remove(id);
    } catch (err) {
      console.error("deleteChat", apiErrorMessage(err));
      get().fetchChats();
    }
  },

  setActiveProtein: (dossier) => set({ activeProtein: dossier }),

  reset: () =>
    set({ chats: [], currentChatId: null, messages: [], activeProtein: null, isSending: false }),
}));
