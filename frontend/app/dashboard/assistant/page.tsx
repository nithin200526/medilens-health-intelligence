"use client";
import { useEffect, useState } from "react";
import { Bot, FileText, Activity, Calendar, ShieldCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "@/components/ChatPanel";

type ReportHistoryItem = {
    id: string;
    patientName: string;
    reportDate: string | null;
    overallRisk: string;
    totalTests: number;
    createdAt: string;
    fullPayload: string;
};

export default function AssistantPage() {
    const [reports, setReports] = useState<ReportHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/reports");
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
    }, []);

    const filteredReports = reports.filter(r =>
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.reportDate && r.reportDate.includes(searchQuery))
    );

    const selectedReport = reports.find(r => r.id === selectedReportId);
    let chatProps = {
        tests: {}, analytics: {}, alert: {}, explanation: "",
        language: "English", patient_info: {}, panels: [], dynamic_analysis: {},
        isGeneralMode: true
    };

    if (selectedReport) {
        try {
            const parsed = typeof selectedReport.fullPayload === 'string'
                ? JSON.parse(selectedReport.fullPayload)
                : selectedReport.fullPayload;

            chatProps = {
                tests: parsed.tests || {},
                analytics: parsed.analytics || {},
                alert: parsed.alert || {},
                explanation: parsed.card_explanations?.map((c: any) => `${c.parameter}: ${c.what_this_means}`).join("\n") || "",
                language: parsed.language || "English",
                patient_info: parsed.patient_info || {},
                panels: parsed.panels || [],
                dynamic_analysis: parsed.dynamic_analysis || {},
                isGeneralMode: false
            };
        } catch (e) {
            console.error("Failed to parse report payload", e);
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 relative">
            {/* ── Left Sidebar: Context Selection ────────────────────────────── */}
            <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 h-full">

                {/* General Medical Modal Selection */}
                <button
                    onClick={() => setSelectedReportId(null)}
                    className={`p-5 rounded-3xl text-left transition-all duration-300 relative overflow-hidden group border ${selectedReportId === null
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10'
                            : 'liquid-glass border-slate-200/50 hover:border-primary/30'
                        }`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedReportId === null ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                            }`}>
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${selectedReportId === null ? 'text-white' : 'text-slate-900'}`}>
                                General Assistant
                            </h3>
                            <p className={`text-xs font-medium uppercase tracking-widest mt-1 ${selectedReportId === null ? 'text-white/70' : 'text-slate-400'}`}>
                                Medical Knowledge
                            </p>
                        </div>
                    </div>
                </button>

                {/* History Reports List */}
                <div className="flex-1 liquid-glass rounded-3xl border border-slate-200/50 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-md">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Report Context</h4>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {reports.length}
                        </div>
                    </div>

                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/60 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
                            ))
                        ) : filteredReports.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReportId(report.id)}
                                className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedReportId === report.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white/40 border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-bold text-slate-900 truncate pr-2">{report.patientName}</div>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${report.overallRisk.includes('Critical') ? 'bg-danger/10 text-danger border-danger/20' :
                                            report.overallRisk.includes('High') ? 'bg-warning/10 text-warning border-warning/20' :
                                                'bg-accent/10 text-accent border-accent/20'
                                        }`}>
                                        {report.overallRisk === "Review Recommended" ? "High" : report.overallRisk.split(" ")[0]}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {report.totalTests}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Main Area: Chat Panel ────────────────────────────────── */}
            <div className="flex-1 h-full liquid-glass rounded-3xl shadow-xl overflow-hidden border border-white/60 flex flex-col relative">

                {/* Context Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/40 backdrop-blur-xl shrink-0 absolute top-0 left-0 right-0 z-20">
                    <div className="flex items-center gap-3">
                        {selectedReportId === null ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">General Medical Intelligence</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Context:</span>
                                    <span className="font-bold text-slate-800 text-sm">{selectedReport?.patientName}'s Report</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Encrypted
                    </div>
                </div>

                {/* Chat Area */}
                {/* Notice the pt-16 to account for the absolute header */}
                <div className="flex-1 pt-16 h-full relative">
                    <ChatPanel {...chatProps} />
                </div>
            </div>
        </div>
    );
}
