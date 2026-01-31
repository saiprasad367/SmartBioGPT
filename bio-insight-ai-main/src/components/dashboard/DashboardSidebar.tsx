import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  Clock,
  Trash2,
  Moon,
  Sun
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isCollapsed?: boolean;
}

const DashboardSidebar = ({ isCollapsed = false }: DashboardSidebarProps) => {
  const navigate = useNavigate();

  const { sessions, currentSessionId, createSession, setCurrentSession, deleteSession } = useChatStore();
  const { signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const handleNewChat = async () => {
    const newId = await createSession();
    setCurrentSession(newId);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSession(id);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "h-full bg-secondary border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">SB</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">Smart Bio GPT</span>
          )}
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-accent transition-all duration-200",
            isCollapsed && "justify-center px-3"
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">New Chat</span>}
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Recent
          </div>
        )}

        <div className="space-y-1">
          {sessions.map((session) => (
            // Changed from button to div to avoid nesting issues
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group cursor-pointer",
                session.id === currentSessionId
                  ? "bg-accent"
                  : "hover:bg-accent/50",
                isCollapsed && "justify-center"
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate text-sm">
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-border space-y-1">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          <Star className="w-4 h-4 text-muted-foreground" />
          {!isCollapsed && <span className="text-sm">Favorites</span>}
        </button>

        {/* Removed API Status as requested */}

        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
          {!isCollapsed && <span className="text-sm">Dark Mode</span>}
        </button>

        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-destructive/10 transition-colors text-destructive",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
