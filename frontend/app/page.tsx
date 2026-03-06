import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, Activity, FileText, Shield, Globe, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import MedicalBackground from "@/components/layout/MedicalBackground";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import BackgroundGenerator from "@/components/admin/BackgroundGenerator";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-x-hidden">
      <MedicalBackground />
      <Navbar />

      <HeroSection />
      <BackgroundGenerator />

      {/* Social Proof */}
      <section className="py-12 border-b border-slate-100 relative z-10">
        <ScrollReveal className="container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto neo-glass rounded-3xl p-8 md:p-10 shadow-lg border-slate-100">
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-8">Trusted by leading healthcare providers</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 hover:opacity-100 transition-all duration-500">
              <div className="text-2xl font-black text-slate-600 hover:text-blue-700 transition-colors cursor-default tracking-tight">HealthCare+</div>
              <div className="text-2xl font-black text-slate-600 hover:text-cyan-700 transition-colors cursor-default tracking-tight">MedTech</div>
              <div className="text-2xl font-black text-slate-600 hover:text-emerald-700 transition-colors cursor-default tracking-tight">FamilyDoc</div>
              <div className="text-2xl font-black text-slate-600 hover:text-purple-700 transition-colors cursor-default tracking-tight">LabCorp</div>
              <div className="text-2xl font-black text-slate-600 hover:text-indigo-700 transition-colors cursor-default tracking-tight">BioGen</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Problem vs Solution */}
      <section className="py-24 lg:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal delay={0.1} className="h-full">
              <div className="neo-glass p-10 rounded-[2.5rem] h-full border border-white/40 hover:shadow-2xl transition-all duration-500 group">
                <div className="inline-flex items-center justify-center p-4 bg-red-100/80 text-red-600 rounded-2xl mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6">The Old Way</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 text-slate-600 text-lg group-hover:translate-x-2 transition-transform duration-300">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold mt-0.5">✕</span>
                    Confusing medical jargon and raw numbers
                  </li>
                  <li className="flex items-start gap-4 text-slate-600 text-lg group-hover:translate-x-2 transition-transform duration-300 delay-75">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold mt-0.5">✕</span>
                    Anxiety from Google searches
                  </li>
                  <li className="flex items-start gap-4 text-slate-600 text-lg group-hover:translate-x-2 transition-transform duration-300 delay-100">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold mt-0.5">✕</span>
                    Hard to track changes over time
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} className="h-full">
              <div className="neo-glass p-10 rounded-[2.5rem] h-full border border-blue-200/50 shadow-blue-900/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transform rotate-3 z-10">
                  New Standard
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center p-4 bg-blue-100/80 text-blue-600 rounded-2xl mb-8 shadow-sm group-hover:scale-110 transition-transform">
                    <Activity className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-6">The MediLens Way</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4 text-slate-700 font-medium text-lg group-hover:translate-x-2 transition-transform duration-300">
                      <CheckCircle className="h-8 w-8 text-blue-500 mt-0.5 flex-shrink-0" />
                      Simple, plain English explanations
                    </li>
                    <li className="flex items-start gap-4 text-slate-700 font-medium text-lg group-hover:translate-x-2 transition-transform duration-300 delay-75">
                      <CheckCircle className="h-8 w-8 text-blue-500 mt-0.5 flex-shrink-0" />
                      Visual trends and health scores
                    </li>
                    <li className="flex items-start gap-4 text-slate-700 font-medium text-lg group-hover:translate-x-2 transition-transform duration-300 delay-100">
                      <CheckCircle className="h-8 w-8 text-blue-500 mt-0.5 flex-shrink-0" />
                      Multilingual support (Hindi, Telugu, etc.)
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Features />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">How It Works</h2>
            <p className="text-slate-600 text-xl">Three simple steps to peace of mind.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 -z-10 transform -translate-y-1/2"></div>

            {[
              {
                icon: Upload,
                title: "1. Upload Report",
                desc: "Simply drag and drop your PDF lab report. We support most major lab formats."
              },
              {
                icon: Activity,
                title: "2. AI Analysis",
                desc: "Our secure AI extracts values, compares them to benchmarks, and identifies trends."
              },
              {
                icon: Globe,
                title: "3. Get Insights",
                desc: "Receive a visual summary, simple explanation, and audio report in your language."
              }
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.2} className="bg-white p-8 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/20 mx-auto md:mx-0">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <FAQ />

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <ScrollReveal className="container mx-auto px-4 text-center">
          <div className="neo-glass-dark rounded-[3rem] p-12 md:p-20 max-w-5xl mx-auto relative overflow-hidden shadow-2xl group">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/90 to-slate-900/90 z-0"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl -ml-20 -mb-20 group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-8 text-glow">
                Ready to understand your health?
              </h2>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-blue-50 px-12 h-16 text-xl rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-8 text-blue-200 text-sm font-medium">No credit card required • HIPAA Compliant Security</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
