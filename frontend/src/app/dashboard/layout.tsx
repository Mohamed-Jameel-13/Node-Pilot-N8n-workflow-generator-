"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, CreditCard, Network, PenTool, Settings2, ArrowLeft, PanelLeftClose, PanelLeftOpen, History, Key, LogOut, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const navItems = [
    { name: "Canvas", href: `/dashboard/default/canvas`, icon: PenTool },
    { name: "API & Settings", href: "/dashboard/keys", icon: Key },
    { name: "Audit Trail", href: `/dashboard/default/audit`, icon: History },
    { name: "Pricing & Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Contact Us", href: "/contact", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:relative z-50 transition-all duration-300 ease-in-out border-r border-border bg-sidebar flex flex-col h-full ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center gap-2 font-bold text-lg overflow-hidden whitespace-nowrap hover:text-primary transition-colors">
              <Network className="w-5 h-5 text-primary flex-shrink-0" />
              <span>NodePilot</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors flex items-center justify-center w-8 h-8 md:mx-auto"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border text-xs text-muted-foreground flex flex-col gap-4 bg-sidebar">
          <div className="flex items-center justify-between">
            {isSidebarOpen && <span className="flex-1">Logged in</span>}
            <ThemeToggle />
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/auth/login");
            }}
            className={`flex items-center text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive p-2 rounded-md transition-colors ${isSidebarOpen ? 'justify-start gap-2' : 'justify-center'}`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden bg-background relative">
        {/* Mobile menu toggle (visible only when sidebar is hidden on mobile) */}
        {children}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-3 left-3 z-[45] p-2 bg-background border border-border rounded-md shadow-sm text-foreground hover:bg-muted transition-colors flex items-center justify-center"
            title="Open Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
}
