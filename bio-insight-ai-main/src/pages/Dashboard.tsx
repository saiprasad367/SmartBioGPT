import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChatInterface from "@/components/chat/ChatInterface";
import ProteinViewer from "@/components/protein/ProteinViewer";
import { useChatStore } from "@/store/chatStore";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

const Dashboard = () => {
  const [showProteinViewer, setShowProteinViewer] = useState(false); // Default: Closed as requested
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu
  const currentSession = useChatStore((state) => state.getCurrentSession());
  const { activeProteinId, fetchSessions } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    // Auto-open 3D viewer when a protein is selected
    if (activeProteinId) {
      setShowProteinViewer(true); // Or logic to open the right panel if separate
    }
  }, [activeProteinId]);

  const handleToggleSidebar = () => {
    // Check if mobile (using simple width check)
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full flex-none">
        <DashboardSidebar isCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 w-72 h-full z-50 shadow-2xl"
          >
            <DashboardSidebar isCollapsed={false} />
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onToggleSidebar={handleToggleSidebar} />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Chat Area */}
          <motion.div
            className={`flex-1 flex flex-col overflow-hidden ${showProteinViewer ? 'hidden lg:flex' : 'flex'}`}
            layout
          >
            <ChatInterface />
          </motion.div>

          {/* Protein Viewer Panel */}
          {showProteinViewer && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full lg:w-[400px] border-l border-border p-4 bg-background h-[50vh] lg:h-auto flex-none z-40 lg:z-auto absolute lg:relative bottom-0 lg:bottom-auto shadow-2xl lg:shadow-none border-t lg:border-t-0"
            >
              <ProteinViewer />
            </motion.div>
          )}
        </div>

        {/* Toggle Protein Viewer Button */}
        <button
          onClick={() => setShowProteinViewer(!showProteinViewer)}
          className="flex fixed right-4 bottom-24 lg:bottom-8 z-50 w-12 h-12 items-center justify-center rounded-full bg-primary text-primary-foreground border border-border shadow-lg hover:scale-110 transition-transform"
        >
          {showProteinViewer ? (
            <PanelRightClose className="w-6 h-6" />
          ) : (
            <PanelRightOpen className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};


export default Dashboard;
