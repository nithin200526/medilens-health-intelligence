"use client";

import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// I'll implement a simpler custom dropdown to avoid dependency on complex shadcn components I haven't fully scaffolded.
// Or I can just use a native select for simplicity and robustness in this environment.

export default function LanguageSelector() {
  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
        <Globe className="h-4 w-4 text-slate-500" />
        <select className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer appearance-none pr-6">
          <option value="en">English</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="te">Telugu (తెలుగు)</option>
          <option value="ta">Tamil (தமிழ்)</option>
          <option value="es">Spanish (Español)</option>
          <option value="zh">Chinese (中文)</option>
        </select>
        <ChevronsUpDown className="h-3 w-3 text-slate-400 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
}
