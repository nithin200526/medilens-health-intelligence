"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Sparkles, ShieldCheck } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue } from "motion/react";
import HealthAgentAnimation from "@/components/landing/HealthAgentAnimation";


export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yCard = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Parallax for background elements
  const yBg1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative pt-20 pb-10 lg:pt-24 lg:pb-16 px-2 sm:px-4 lg:px-6 h-screen min-h-[600px] flex items-center justify-center overflow-hidden perspective-1000"
    >
      {/* Parallax Background Elements */}
      <motion.div style={{ y: yBg1 }} className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none z-0" />
      <motion.div style={{ y: yBg2 }} className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-cyan-100/40 to-emerald-100/40 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none z-0" />

      <div className="container mx-auto max-w-[95%] xl:max-w-[1600px] relative z-10 h-full flex items-center">
        {/* Main Glass Card Container */}
        <motion.div
          style={{ y: yCard, opacity } as any}
          className="rounded-[2.5rem] p-6 md:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-blue-200 w-full bg-blue-50/80 backdrop-blur-xl"
        >
          {/* Decorative Gradients inside card */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-t from-cyan-200/20 to-emerald-200/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">

            {/* Left Column: Text Content */}
            <motion.div style={{ y: yText }} className="text-left space-y-6 lg:space-y-8 order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 text-slate-800 backdrop-blur-md shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
                <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-slate-700">Next-Gen Health AI</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-950 leading-[1.1]"
              >
                Medical Data. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 pb-2">
                  Decoded.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl text-slate-700 max-w-xl leading-relaxed font-medium"
              >
                Transform complex lab reports into clear, actionable insights.
                Precision health intelligence for patients and providers.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 border-none px-8 h-14 text-base rounded-full shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 w-full font-semibold">
                    Analyze Report <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#demo" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="bg-white/60 border-white/80 text-slate-700 hover:bg-white/90 px-8 h-14 text-base rounded-full w-full backdrop-blur-md transition-all font-semibold hover:scale-105">
                    View Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap items-center gap-6 pt-4 text-slate-600 text-xs font-semibold tracking-wider uppercase"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Clinical Accuracy</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Agent Animation */}
            <div className="relative h-[400px] lg:h-[600px] w-full perspective-1000 flex items-center justify-center order-1 lg:order-2">

              {/* DNA Helix Animation */}
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <HealthAgentAnimation />
              </div>

              {/* Background Blur Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
