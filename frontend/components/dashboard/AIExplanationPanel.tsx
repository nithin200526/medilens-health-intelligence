"use client";

import { Sparkles, BookOpen, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIExplanationPanel() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-200">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">AI Health Insights</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">What this means</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your LDL cholesterol is slightly elevated at 145 mg/dL. This is often called "bad cholesterol" because it can build up in your arteries.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Why it matters</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                High LDL levels over time can increase the risk of heart disease. Keeping this in check helps maintain good cardiovascular health.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Trend Analysis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Compared to your last report (6 months ago), your LDL has increased by 12%. This might be due to recent dietary changes or reduced activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-blue-200/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 italic">
            *This is for educational purposes only. Consult a doctor for medical advice.
          </p>
          <Button variant="outline" size="sm" className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200">
            Ask a Follow-up
          </Button>
        </div>
      </div>
    </div>
  );
}
