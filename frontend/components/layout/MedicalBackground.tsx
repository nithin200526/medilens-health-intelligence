"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function MedicalBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-slate-50">
      {/* Premium SaaS Gradient Background */}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100/50" />

      {/* Grid Pattern Overlay for texture */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.2
        }}
      />

      {/* Subtle glowing orbs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />
    </div>
  );
}