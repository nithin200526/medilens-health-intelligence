"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/upload/UploadZone";
import { ArrowRight, ShieldCheck, FileText, Loader2, ArrowLeft, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardUploadPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const lsKey = userId ? `medilens_result_${userId}` : "medilens_result";
  const [currentReport, setCurrentReport] = useState<File | null>(null);
  const [previousReport, setPreviousReport] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [detectedPatient, setDetectedPatient] = useState<any>(null);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!currentReport) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", currentReport);

      const res = await fetch("http://localhost:8001/api/analyze-report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || "Failed to analyze report");
      }

      const data = await res.json();
      setAnalyzedData(data); // Store for potential profile creation

      try {
        const dbRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: data.patient_info?.name,
            patientAge: data.patient_info?.age,
            patientGender: data.patient_info?.gender,
            reportDate: data.patient_info?.report_date,
            labName: data.patient_info?.lab_name,
            overallRisk: data.overall_risk,
            totalTests: data.analytics?.total,
            abnormalTests: data.analytics?.abnormal,
            criticalTests: data.dynamic_analysis?.analysis_summary?.critical_count,
            fullPayload: data
          })
        });

        const dbData = await dbRes.json();

        // If the backend says we should prompt for profile creation
        if (dbData.promptCreateProfile) {
          setDetectedPatient({
            name: data.patient_info?.name,
            age: data.patient_info?.age,
            gender: data.patient_info?.gender,
            reportId: dbData.id
          });
          setShowProfilePrompt(true);
          setIsProcessing(false);
          return;
        }
      } catch (dbError) {
        console.error("Failed to persist report to DB:", dbError);
      }

      // If no prompt needed, move to results
      localStorage.setItem(lsKey, JSON.stringify(data));
      setIsProcessing(false);
      router.push("/dashboard/results");
    } catch (error: any) {
      console.error(error);
      setIsProcessing(false);
      alert(error.message || "Error analyzing report. Please make sure the backend is running.");
    }
  };

  const handleCreateProfileAndProceed = async () => {
    try {
      // 1. Create the profile
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: detectedPatient.name,
          age: detectedPatient.age,
          gender: detectedPatient.gender
        }),
      });

      if (res.ok) {
        const profile = await res.json();
        // 2. Link the report to this new profile (silent update)
        await fetch("/api/reports", {
          method: "POST", // The API handles linking if profileId is passed or name matches
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...detectedPatient, profileId: profile.id, fullPayload: analyzedData })
        });
      }
    } finally {
      localStorage.setItem(lsKey, JSON.stringify(analyzedData));
      router.push("/dashboard/results");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Upload Your Lab Report</h1>
        <p className="mt-2 text-slate-600">
          We'll analyze your report securely and provide simple, actionable insights.
        </p>
      </div>

      <div className="neo-glass rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Upload Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-slate-900">Current Report</h3>
              </div>
              <UploadZone
                label="Upload your latest lab report"
                onFileSelect={setCurrentReport}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-100 p-1.5 rounded-md text-purple-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-slate-900">Previous Report (Optional)</h3>
              </div>
              <UploadZone
                label="Upload a past report for comparison"
                onFileSelect={setPreviousReport}
              />
              <p className="text-xs text-slate-500">
                Uploading a previous report allows us to show you trends and improvements over time.
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Your data is secure</h4>
              <p className="text-xs text-emerald-700 mt-1">
                We use bank-level encryption to process your files. Your reports are analyzed automatically and are not stored permanently without your permission.
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-600 hover:bg-slate-100">Cancel</Button>
          </Link>
          <Button
            onClick={handleAnalyze}
            disabled={!currentReport || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8 h-11 rounded-xl transition-all hover:scale-105"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Report
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Prompt Modal */}
      {showProfilePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => router.push("/dashboard/results")}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg liquid-glass bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border-white/40"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Users className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Patient Detected</h2>
            <p className="text-slate-500 mb-8 text-lg">
              We found a report for <span className="font-bold text-slate-900">"{detectedPatient?.name}"</span>.
              Would you like to create a new profile to track their health journey?
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleCreateProfileAndProceed}
                className="w-full sm:flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg font-bold"
              >
                Create Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem(lsKey, JSON.stringify(analyzedData));
                  router.push("/dashboard/results");
                }}
                className="w-full sm:flex-1 h-14 rounded-2xl text-lg font-bold border-slate-200"
              >
                Skip for Now
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
