"use client";

import { motion } from "motion/react";
import { Brain, Shield, Zap, Activity, FileText, Smartphone, Globe, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Our advanced neural networks understand medical context better than any standard OCR.",
    color: "text-purple-500",
    bg: "bg-purple-100/50"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Instantly translate complex medical reports into your native language (Hindi, Telugu, Spanish, etc.).",
    color: "text-blue-500",
    bg: "bg-blue-100/50"
  },
  {
    icon: Activity,
    title: "Trend Tracking",
    description: "Visualize your health journey. We plot your vitals over time to spot trends early.",
    color: "text-emerald-500",
    bg: "bg-emerald-100/50"
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your health data is encrypted with AES-256 and fully HIPAA compliant.",
    color: "text-slate-800",
    bg: "bg-slate-100/50"
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get a comprehensive breakdown in seconds, not days. No waiting for appointments.",
    color: "text-amber-500",
    bg: "bg-amber-100/50"
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Access your health records anywhere, anytime. Optimized for all devices.",
    color: "text-cyan-500",
    bg: "bg-cyan-100/50"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6"
          >
            Everything you need to <br/>
            <span className="text-blue-600">understand your health</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600"
          >
            We've packed MediLens with powerful features to give you complete control over your medical data.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="neo-glass p-8 rounded-[2rem] border border-white/60 hover:border-blue-200/60 transition-colors group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-7 w-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
