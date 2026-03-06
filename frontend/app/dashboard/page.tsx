"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; email?: string | null; id?: string } | undefined;

  const [data, setData] = useState<any>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [profilesCount, setProfilesCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // User-scoped localStorage key
  const lsKey = user?.id ? `medilens_result_${user.id}` : null;

  useEffect(() => {
    if (!user?.id) return; // Wait until session loads

    const fetchProfiles = async () => {
      try {
        const res = await fetch("/api/profiles");
        if (res.ok) {
          const profiles = await res.json();
          setProfilesCount(profiles.length);
        }
      } catch (e) {
        console.error("Failed to fetch profiles:", e);
      }
    };
    fetchProfiles();

    // Read from user-scoped localStorage
    if (lsKey) {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setData(parsed);
        } catch (e) {
          localStorage.removeItem(lsKey);
        }
      }
    }

    const fetchPreviousReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const reports = await res.json();
          setPastReports(reports);

          // Only auto-load latest report if no current session in localStorage
          const currentSession = lsKey ? localStorage.getItem(lsKey) : null;
          if (!currentSession && reports.length > 0) {
            const latest = reports[0];
            if (latest.fullPayload) {
              try {
                const parsed = typeof latest.fullPayload === 'string'
                  ? JSON.parse(latest.fullPayload)
                  : latest.fullPayload;
                setData(parsed);
              } catch (e) {
                console.error("Failed to parse latest report payload", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch past reports:", e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchPreviousReports();
  }, [user?.id, lsKey]);

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  if (!isLoaded && !user?.id) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="spinner text-primary" />
      </div>
    );
  }

  const hasData = !!data;
  const analytics = data?.analytics || { total: 0, abnormal: 0 };
  const patientInfo = data?.patient_info || {};

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 fade-up">

      {/* ── Welcome Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden liquid-glass p-12 rounded-[3rem] border-white/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/15 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -ml-32 -mb-32" />

        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/40 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
            <Sparkles className="w-3 h-3" /> Digital Medical Archive
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome back, <br />
            <span className="text-primary italic">{firstName}</span>!
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-md">
            {hasData
              ? "Your latest clinical report is analyzed and ready for review."
              : "Upload your medical report and let our AI translate it into human insights."}
          </p>
        </div>

        <div className="relative z-10">
          <Link href="/dashboard/upload">
            <Button className="rounded-full px-10 h-16 text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all bg-primary hover:bg-blue-600 border-none group">
              <Plus className="h-6 w-6 mr-2 transition-transform group-hover:rotate-90" />
              New Analysis
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Visual Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        <StatCard
          title="Reports Analyzed"
          value={pastReports.length.toString()}
          trend="Total Archive"
          trendUp={true}
          icon={FileText}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Family Added"
          value={profilesCount.toString()}
          trend="Members Tracked"
          trendUp={true}
          icon={Plus}
          color="emerald"
          delay={0.2}
        />
      </div>

      {/* ── Active Intelligence ────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between px-2">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Active Insights</h3>
            <p className="text-slate-500 font-medium">Your most recent clinical correlation</p>
          </div>
          {hasData && (
            <Link href="/dashboard/results" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
              View Full Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        <div className="liquid-glass rounded-[2.5rem] p-4 border-white/40 shadow-xl">
          {hasData ? (
            <Link href="/dashboard/results">
              <div className="bg-white/40 hover:bg-white/60 p-8 rounded-[2rem] border border-white/60 transition-all group flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{patientInfo.patient_name || "Patient Record"}</h4>
                    <p className="text-lg text-slate-500 font-medium">{patientInfo.report_date || "Recent Analysis"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-6 py-2 rounded-full bg-emerald-100/50 border border-emerald-200/50 text-emerald-700 text-sm font-bold uppercase tracking-widest">
                    Analysis Complete
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg group-hover:translate-x-2 transition-transform">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-center py-20 bg-white/20 rounded-[2rem] border border-dashed border-slate-300">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="text-2xl font-bold text-slate-700">No Historical Data</h4>
              <p className="text-slate-400 max-w-sm mx-auto font-medium mt-2 mb-8">
                Your health journey starts with a single scan. Upload your first report to begin.
              </p>
              <Link href="/dashboard/upload">
                <Button variant="outline" className="rounded-full px-8 h-12 border-slate-300 font-bold hover:bg-white transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── History Sub-Grid ──────────────────────────────────────────────── */}
      {pastReports.length > 1 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight px-2">Archived Analyses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastReports.slice(1, 4).map((report) => (
              <div key={report.id} className="liquid-glass p-6 rounded-[2rem] border-white/40 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className={`w-3 h-3 rounded-full ${report.overallRisk === 'Stable' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight truncate w-32">{report.patientName || "Patient"}</h4>
                    <p className="text-xs text-slate-400 font-bold">{report.reportDate || "History"}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (lsKey) localStorage.setItem(lsKey, report.fullPayload);
                    window.location.href = "/dashboard/results";
                  }}
                  variant="ghost"
                  className="w-full rounded-xl hover:bg-primary/5 hover:text-primary font-bold text-xs uppercase tracking-widest text-slate-400 border border-slate-100"
                >
                  Review Payload
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
