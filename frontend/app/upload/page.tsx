"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/upload/UploadZone";
import { ArrowRight, ShieldCheck, FileText, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function UploadPage() {
  const [currentReport, setCurrentReport] = useState<File | null>(null);
  const [previousReport, setPreviousReport] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = async () => {
    if (!currentReport) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", currentReport);
      if (previousReport) {
        formData.append("previous_file", previousReport);
      }

      // Call the FastAPI backend directly
      const response = await fetch("http://localhost:8001/api/analyze-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();

      // Store result for the dashboard/results pages
      localStorage.setItem("medilens_result", JSON.stringify(result));

      // Redirect to results
      window.location.href = "/dashboard/results";
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Failed to analyze report. Please ensure the backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mt-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Upload Your Lab Report</h1>
          <p className="mt-3 text-slate-600">
            We'll analyze your report securely and provide simple, actionable insights.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-green-800">Your data is secure</h4>
                <p className="text-xs text-green-700 mt-1">
                  We use bank-level encryption to process your files. Your reports are analyzed automatically and are not stored permanently without your permission.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-600">Cancel</Button>
            </Link>
            <Button
              onClick={handleAnalyze}
              disabled={!currentReport || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md px-8 h-11"
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
      </main>
    </div>
  );
}
