import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, MessageSquare, Star, LogOut, Trash2, Loader2, Dna } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { userApi, bioApi, apiErrorMessage, type Favorite } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate?: () => void;
}

const DashboardSidebar = ({ onNavigate }: Props) => {
  const navigate = useNavigate();
  const {
    chats,
    currentChatId,
    fetchChats,
    selectChat,
    startNewChat,
    deleteChat,
    setActiveProtein,
  } = useChatStore();
  const { signOut } = useAuthStore();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingFav, setLoadingFav] = useState<string | null>(null);
  const [tab, setTab] = useState<"chats" | "favorites">("chats");

  useEffect(() => {
    fetchChats();
    userApi.favorites().then(setFavorites).catch(() => undefined);
  }, [fetchChats]);

  const openFavorite = async (accession: string) => {
    setLoadingFav(accession);
    try {
      const dossier = await bioApi.protein(accession);
      setActiveProtein(dossier);
      startNewChat();
      onNavigate?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not load protein"));
    } finally {
      setLoadingFav(null);
    }
  };

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SB</span>
          </div>
          <span className="font-semibold text-lg">Smart Bio GPT</span>
        </Link>
      </div>

      <div className="p-3">
        <button
          onClick={() => {
            startNewChat();
            onNavigate?.();
          }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New research session
        </button>
      </div>

      <div className="px-3 flex gap-1 text-xs">
        {(["chats", "favorites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium capitalize transition-colors",
              tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {tab === "chats" ? (
          chats.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4">No sessions yet.</p>
          ) : (
            <div className="space-y-0.5">
              {chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    selectChat(c.id);
                    onNavigate?.();
                  }}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                    c.id === currentChatId ? "bg-accent" : "hover:bg-accent/60"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : favorites.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-4">
            No favorites. Save proteins from the structure panel.
          </p>
        ) : (
          <div className="space-y-0.5">
            {favorites.map((f) => (
              <button
                key={f.accession}
                onClick={() => openFavorite(f.accession)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/60 text-sm text-left transition-colors"
              >
                {loadingFav === f.accession ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                  <Dna className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{f.gene || f.name || f.accession}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
