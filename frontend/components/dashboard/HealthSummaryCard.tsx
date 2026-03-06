"use client";

import { Activity, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthSummaryCardProps {
  status: "Stable" | "Needs Attention" | "Critical";
  score: number;
  summary: string;
}

export default function HealthSummaryCard({ status, score, summary }: HealthSummaryCardProps) {
  const statusConfig = {
    Stable: {
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-100",
      icon: CheckCircle
    },
    "Needs Attention": {
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-100",
      icon: AlertCircle
    },
    Critical: {
      color: "bg-red-500",
      lightColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-100",
      icon: Activity
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className={cn("absolute top-0 left-0 w-1 h-full", config.color)}></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-1.5 rounded-full", config.lightColor)}>
              <Icon className={cn("h-5 w-5", config.textColor)} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Overall Health Status</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">{summary}</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[140px] justify-center">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Health Score</div>
            <div className={cn("text-3xl font-black", config.textColor)}>{score}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
