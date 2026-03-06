"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import HealthAgentAnimation from "@/components/landing/HealthAgentAnimation";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  imageContent?: React.ReactNode;
}

export default function AuthLayout({ children, title, subtitle, imageContent }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#E0E7FF] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1200px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
      >
        {/* Left Side - Decorative */}
        <div className="w-full lg:w-[45%] bg-gradient-to-br from-indigo-500 to-blue-600 relative p-8 lg:p-12 flex flex-col justify-between text-white overflow-hidden">
          {/* Background Patterns */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          </div>

          {/* Back to Home */}
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white transition-colors z-10 w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Main Content */}
          <div className="relative z-10 mt-8 lg:mt-0">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              {title}
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-md">
              {subtitle}
            </p>
          </div>

          {/* 3D Illustration Area */}
          <div className="relative h-[300px] w-full flex items-center justify-center mt-8 lg:mt-0">
             {imageContent || (
               <div className="relative w-full h-full transform scale-75 lg:scale-90">
                 <HealthAgentAnimation />
               </div>
             )}
          </div>
          
          {/* Copyright/Footer */}
          <div className="relative z-10 text-xs text-indigo-200 mt-8">
            © 2026 MediLens. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] bg-white p-8 lg:p-16 flex flex-col justify-center relative">
           {/* Language Selector Mockup */}
           <div className="absolute top-8 right-8 text-slate-400 text-sm font-medium cursor-pointer hover:text-slate-600 hidden sm:block">
             English (US) ▾
           </div>

           <div className="max-w-md mx-auto w-full">
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3, duration: 0.5 }}
             >
               {children}
             </motion.div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
