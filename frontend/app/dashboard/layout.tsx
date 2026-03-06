"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Activity,
  FileText,
  Home,
  LogOut,
  Settings,
  User,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquareText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MedicalBackground from "@/components/layout/MedicalBackground";
import NavItem from "@/components/dashboard/NavItem";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  const user = session?.user as { name?: string | null; email?: string | null; id?: string; image?: string | null } | undefined;

  const getTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.includes("/dashboard/history")) return "Medical History";
    if (pathname.includes("/dashboard/profiles")) return "Family Hub";
    if (pathname.includes("/dashboard/results")) return "Analysis Results";
    if (pathname.includes("/dashboard/upload")) return "New Analysis";
    if (pathname.includes("/dashboard/assistant")) return "AI Assistant";
    if (pathname.includes("/dashboard/profile")) return "Profile & Preferences";
    return "Dashboard";
  };

  const handleLogout = async () => {
    // Clear user-specific localStorage key
    if (user?.id) localStorage.removeItem(`medilens_result_${user.id}`);
    await signOut({ callbackUrl: "/login" });
  };

  const avatarText = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() ?? "US";

  return (
    <div className="min-h-screen flex font-sans text-slate-900 relative overflow-hidden bg-slate-50">
      <MedicalBackground />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isDesktopExpanded ? 280 : 88 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white/60 backdrop-blur-2xl border-r border-white/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full flex flex-col relative">

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="hidden lg:flex absolute -right-3.5 top-8 h-7 w-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm z-10 transition-colors"
          >
            {isDesktopExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-slate-200/50">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <AnimatePresence mode="wait">
                {isDesktopExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight whitespace-nowrap"
                  >
                    MediLens
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavItem href="/dashboard" icon={Home} label="Overview" expanded={isDesktopExpanded} />
            <NavItem href="/dashboard/history" icon={FileText} label="Medical History" expanded={isDesktopExpanded} />
            <NavItem href="/dashboard/profiles" icon={Users} label="Family Hub" expanded={isDesktopExpanded} />
            <NavItem href="/dashboard/assistant" icon={MessageSquareText} label="AI Assistant" expanded={isDesktopExpanded} />

            <div className="pt-6 pb-2">
              <AnimatePresence mode="wait">
                {isDesktopExpanded ? (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Account
                  </motion.p>
                ) : (
                  <div className="w-full flex justify-center"><div className="w-4 h-px bg-slate-300 rounded-full" /></div>
                )}
              </AnimatePresence>
            </div>

            <NavItem href="/dashboard/profile" icon={User} label="Profile & Preferences" expanded={isDesktopExpanded} />
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-slate-200/50">
            {isDesktopExpanded && user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {avatarText}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "User"}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className={`flex items-center ${isDesktopExpanded ? 'justify-start px-4' : 'justify-center'} gap-3 w-full py-3 h-12 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 overflow-hidden`}>
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {isDesktopExpanded && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full">
        {/* Top Header */}
        <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2.5 text-slate-500 hover:bg-white/80 rounded-xl transition-colors shadow-sm border border-slate-200/50 bg-white/50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 hidden sm:block tracking-tight">
              {getTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-full relative transition-colors shadow-sm border border-slate-200/50 bg-white/60">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <Link href="/dashboard/profile">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white ml-2 cursor-pointer hover:scale-105 transition-transform overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  avatarText
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
