"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, Home, FileText, Settings, LogIn, UserPlus } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "motion/react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      const shouldBeScrolled = latest > 100;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
        // Close sidebar when transitioning back to top
        if (!shouldBeScrolled) setIsSidebarOpen(false);
      }
    });
  }, [scrollY, isScrolled]);

  // Smooth spring animations for position transitions
  const springConfig = { stiffness: 300, damping: 30 };

  return (
    <>
      {/* 
        TOP NAVIGATION (Visible when at top) 
        We use AnimatePresence to smoothly swap between Top Nav and Side Fab
      */}
      <AnimatePresence mode="wait">
        {!isScrolled && (
          <motion.nav
            key="top-nav"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto neo-glass rounded-full px-6 py-3 flex items-center justify-between gap-8 max-w-5xl w-full shadow-xl shadow-blue-900/5 border border-slate-200">
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div
                  layoutId="nav-logo-bg"
                  className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-full shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110"
                >
                  <Activity className="h-5 w-5 text-white" />
                </motion.div>
                <span className="text-xl font-bold text-slate-800 tracking-tight font-display">MediLens</span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                {['Features', 'How it Works', 'Pricing'].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full hidden sm:flex font-medium">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg rounded-full px-6 font-medium transition-transform hover:scale-105 active:scale-95">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 
        SIDE FLOATING ACTION BUTTON (Visible when scrolled) 
        Moves to the right side
      */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            key="side-fab"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4"
          >
            {/* The Toggle Button */}
            <motion.button
              layoutId="nav-logo-bg"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`
                h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                ${isSidebarOpen ? 'bg-white text-slate-900' : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white'}
              `}
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
            </motion.button>

            {/* The Sidebar Menu (Expands from the button) */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-16 top-1/2 -translate-y-1/2 neo-glass-dark rounded-3xl p-6 min-w-[240px] backdrop-blur-2xl border border-white/10 shadow-2xl origin-right"
                >
                  <div className="flex flex-col gap-2">
                    <div className="mb-4 px-2">
                      <h3 className="text-white font-display font-bold text-lg">Menu</h3>
                      <p className="text-slate-400 text-xs">Navigation</p>
                    </div>

                    <NavMenuItem href="/" icon={Home} label="Home" delay={0.05} />
                    <NavMenuItem href="#features" icon={FileText} label="Features" delay={0.1} />
                    <NavMenuItem href="#how-it-works" icon={Settings} label="How it Works" delay={0.15} />

                    <div className="h-px bg-white/10 my-2" />

                    <NavMenuItem href="/login" icon={LogIn} label="Log in" delay={0.2} />
                    <NavMenuItem href="/signup" icon={UserPlus} label="Sign up" delay={0.25} active />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavMenuItem({ href, icon: Icon, label, delay, active }: { href: string, icon: any, label: string, delay: number, active?: boolean }) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'}
        `}
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{label}</span>
      </motion.div>
    </Link>
  );
}
