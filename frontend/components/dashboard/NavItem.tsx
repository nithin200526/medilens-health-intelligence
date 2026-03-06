"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "motion/react";

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  expanded?: boolean;
}

export default function NavItem({ href, icon: Icon, label, expanded = true }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="block w-full">
      <div
        className={`flex items-center ${expanded ? 'px-3' : 'justify-center'} py-3 rounded-xl transition-all duration-300 group relative ${isActive
            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'
          }`}
        title={!expanded ? label : undefined}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
