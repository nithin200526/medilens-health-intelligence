"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const testimonials = [
  {
    quote: "Finally, I can understand what my blood test results actually mean. This app is a game changer.",
    author: "Sarah J.",
    role: "Patient",
    avatar: "S"
  },
  {
    quote: "The trend tracking feature helped me spot a vitamin deficiency before it became a problem.",
    author: "Michael R.",
    role: "Fitness Enthusiast",
    avatar: "M"
  },
  {
    quote: "As a doctor, I recommend this to my patients to help them stay engaged with their health.",
    author: "Dr. Emily Chen",
    role: "Cardiologist",
    avatar: "E"
  },
  {
    quote: "The translation feature is incredible. My parents can finally read their reports in Hindi.",
    author: "Raj P.",
    role: "Caregiver",
    avatar: "R"
  },
  {
    quote: "Secure, fast, and beautiful. It's like having a medical interpreter in your pocket.",
    author: "David L.",
    role: "Tech Lead",
    avatar: "D"
  }
];

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, -1000]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-1000, 0]);

  return (
    <section ref={containerRef} className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      
      <div className="container mx-auto px-4 mb-16 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Trusted by thousands</h2>
        <p className="text-slate-400 text-lg">Join the community taking control of their health.</p>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Row 1 - Left */}
        <motion.div style={{ x: x1 }} className="flex gap-6 w-max pl-4">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={i} className="w-[400px] bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <p className="text-lg text-slate-200 mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold">{t.author}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Row 2 - Right */}
        <motion.div style={{ x: x2 }} className="flex gap-6 w-max pr-4">
          {[...testimonials, ...testimonials].reverse().map((t, i) => (
            <div key={i} className="w-[400px] bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <p className="text-lg text-slate-200 mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold">{t.author}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
