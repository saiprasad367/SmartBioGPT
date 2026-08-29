import { useState } from "react";
import { Search, Menu, LogOut, Loader2, PanelRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { bioApi, apiErrorMessage } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onToggleSidebar?: () => void;
  onTogglePanel?: () => void;
  onOpenPanel?: () => void;
}

const DashboardHeader = ({ onToggleSidebar, onTogglePanel, onOpenPanel }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const { setActiveProtein, startNewChat } = useChatStore();
  const { user, signOut } = useAuthStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    try {
      const dossier = await bioApi.search(q);
      setActiveProtein(dossier);
      startNewChat();
      onOpenPanel?.();
      toast.success(`Loaded ${dossier.gene || dossier.accession} — ${dossier.name}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Protein not found"));
    } finally {
      setSearching(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center gap-3 px-4 sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a gene or protein — e.g. TP53, BRCA1, EGFR"
          className="w-full h-10 pl-10 pr-10 rounded-xl bg-secondary border border-transparent focus:border-brand focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm transition-all"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </form>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onTogglePanel}
          className="p-2 hover:bg-accent rounded-lg transition-colors hidden lg:block"
          aria-label="Toggle structure panel"
        >
          <PanelRight className="w-5 h-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors text-sm font-medium">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
