"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Calendar, User, ArrowRight, Activity, Search, Filter } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type ReportHistoryItem = {
    id: string;
    patientName: string;
    reportDate: string | null;
    overallRisk: string;
    totalTests: number;
    abnormalTests: number;
    createdAt: string;
};

function HistoryContent() {
    const searchParams = useSearchParams();
    const profileId = searchParams.get("profileId");

    const [reports, setReports] = useState<ReportHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const url = profileId ? `/api/reports?profileId=${profileId}` : "/api/reports";
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data);
                }
            } catch (e) {
                console.error("Fetch history failed", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [profileId]);

    const filteredReports = reports.filter(r =>
        r.patientName.toLowerCase().includes(filter.toLowerCase()) ||
        (r.reportDate || "").includes(filter)
    );

    return (
        <div className="min-h-screen pb-20 fade-up">
            <div className="max-w-7xl mx-auto px-6 pt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Medical History</h1>
                        </div>
                        <p className="text-slate-500 max-w-md">
                            {profileId ? "Showing all reports for this family member." : "A complete timeline of your analyzed medical reports."}
                        </p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or date..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="h-12 pl-11 pr-6 rounded-full bg-white/60 border border-slate-200/50 w-full md:w-80 focus:w-full md:focus:w-96 transition-all focus:ring-4 focus:ring-primary/5 outline-none font-medium"
                        />
                    </div>
                </div>

                {/* Reports List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-[3rem] border border-slate-100 border-dashed">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No reports found</h3>
                        <p className="text-slate-500 max-w-xs mb-8">
                            {filter ? "Try a different search term or clear the filter." : "Start by uploading your first lab report for analysis."}
                        </p>
                        <Link href="/dashboard/upload">
                            <Button className="rounded-full px-8">Upload New Report</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredReports.map((report) => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="liquid-glass group overflow-hidden"
                                >
                                    <Link
                                        href={`/dashboard/results?id=${report.id}`}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 gap-6 transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-50 text-primary shrink-0 transition-transform group-hover:scale-110">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-1">
                                                    {report.patientName}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 font-sans">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        {report.totalTests} Markers
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-8">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${report.overallRisk.includes('Critical') ? 'bg-danger/10 text-danger border-danger/20' :
                                                        report.overallRisk.includes('High') ? 'bg-warning/10 text-warning border-warning/20' :
                                                            'bg-accent/10 text-accent border-accent/20'
                                                    }`}>
                                                    {report.overallRisk}
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-slate-400">Loading history...</div>}>
            <HistoryContent />
        </Suspense>
    );
}
