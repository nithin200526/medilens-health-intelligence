"use client";

import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: any;
  color: "blue" | "indigo" | "emerald" | "purple";
  delay?: number;
}

export default function StatCard({ title, value, trend, trendUp, icon: Icon, color, delay = 0 }: StatCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="liquid-glass p-8 rounded-[2rem] border-white/60 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-2xl ${(colorStyles as any)[color]} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${trendUp ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100' : 'bg-red-50/80 text-red-600 border-red-100'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
