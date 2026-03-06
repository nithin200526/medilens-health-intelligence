"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: "Normal" | "Borderline" | "High" | "Low";
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  referenceRange: string;
}

export default function MetricCard({ 
  title, 
  value, 
  unit, 
  status, 
  trend, 
  trendValue,
  referenceRange 
}: MetricCardProps) {
  const statusColors = {
    Normal: "bg-green-100 text-green-700 border-green-200",
    Borderline: "bg-yellow-100 text-yellow-700 border-yellow-200",
    High: "bg-red-100 text-red-700 border-red-200",
    Low: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const trendColors = {
    up: "text-red-500", // Usually bad in health context if high, but depends. keeping generic for now.
    down: "text-green-500",
    stable: "text-slate-400",
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 truncate" title={title}>{title}</h3>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", statusColors[status])}>
          {status}
        </span>
      </div>
      
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className="text-sm text-slate-500 font-medium">{unit}</span>
      </div>

      <div className="flex justify-between items-end mt-4">
        <div className="text-xs text-slate-400">
          Ref: <span className="font-medium text-slate-600">{referenceRange}</span>
        </div>
        
        {trend && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400')}>
            {trend === "up" && <ArrowUp className="h-3 w-3" />}
            {trend === "down" && <ArrowDown className="h-3 w-3" />}
            {trend === "stable" && <Minus className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
