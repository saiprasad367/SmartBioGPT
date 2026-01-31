import { Search, User, Menu, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { bio } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

const DashboardHeader = ({ onToggleSidebar }: DashboardHeaderProps) => {
  const [query, setQuery] = useState("");
  const { setActiveProtein, setLoading, setActiveProteinData, addMessage, currentSessionId, createSession, setCurrentSession } = useChatStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchRes = await bio.search(query);
      if (searchRes.data) {
        const pId = searchRes.data.accession || searchRes.data.name;
        // Update Global State
        setActiveProtein(pId);
        if (setActiveProteinData) setActiveProteinData(searchRes.data);

        // Save Search to Chat
        // ChatGPT Style: Search always creates a NEW context/chat
        const sessionId = await createSession();
        setCurrentSession(sessionId);

        // We specifically DO NOT add messages here, so the user starts with a clean slate
        // but with the context of the protein they just searched for in the 3D viewer.

        toast.success(`Found ${pId}`);
      }
    } catch (err) {
      toast.error("Protein not found");
    } finally {
      setLoading(false);
    }
  };

  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">Research Dashboard</h1>
        </div>
      </div>

      {/* Centre - Search (Visible on all screens) */}
      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 h-10 w-full rounded-xl bg-secondary border-none focus:ring-1 focus:ring-primary text-sm"
          />
        </form>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
              <User className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="font-medium">{user?.user_metadata?.full_name || 'User'}</span>
              <span className="ml-auto text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
