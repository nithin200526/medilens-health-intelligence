import DashboardLayout from "@/app/dashboard/layout";
import { FileText, Calendar, ChevronRight } from "lucide-react";

export default function AnalysisHistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analysis History</h1>
          <p className="text-slate-500">View your past reports and trends.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Complete Blood Count (CBC)</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Oct {24 - i}, 2024</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
