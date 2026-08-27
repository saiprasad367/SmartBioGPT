import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChatInterface from "@/components/chat/ChatInterface";
import ProteinViewer from "@/components/protein/ProteinViewer";
import { useChatStore } from "@/store/chatStore";

const Dashboard = () => {
  const [mobileNav, setMobileNav] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const activeProtein = useChatStore((s) => s.activeProtein);

  // Auto-open the structure panel when a protein becomes active.
  useEffect(() => {
    if (activeProtein) setPanelOpen(true);
  }, [activeProtein]);

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background">
      {/* desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <DashboardSidebar />
      </div>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute left-0 top-0 bottom-0 shadow-2xl"
            >
              <DashboardSidebar onNavigate={() => setMobileNav(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader
          onToggleSidebar={() => setMobileNav((v) => !v)}
          onTogglePanel={() => setPanelOpen((v) => !v)}
          onOpenPanel={() => setPanelOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface />
          </div>

          <AnimatePresence>
            {panelOpen && (
              <motion.div
                key="panel"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] p-3 bg-background border-l border-border
                           lg:static lg:z-auto lg:w-[400px] lg:shrink-0"
              >
                <div className="h-full flex flex-col">
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="lg:hidden self-end mb-2 text-xs text-muted-foreground px-2 py-1"
                  >
                    Close
                  </button>
                  <div className="flex-1 min-h-0">
                    <ProteinViewer />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
