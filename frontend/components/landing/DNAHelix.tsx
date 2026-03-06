"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

export default function DNAHelix() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-[2500px] overflow-visible">
      <motion.div
        style={{
          rotateX,
          rotateY,
          rotateZ: -35,
          transformStyle: "preserve-3d"
        }}
        className="relative w-96 h-[900px] z-10" // Larger volume
      >
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="w-full h-full relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Main Helix Structure - High density (100 pairs) */}
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{
                top: `${(i / 100) * 100}%`,
                transformStyle: "preserve-3d"
              }}
            >
              <DNAStrand index={i} total={100} />
            </div>
          ))}

          {/* Central Core Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-transparent via-blue-400/5 to-transparent blur-[8px]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function DNAStrand({ index, total }: { index: number; total: number }) {
  const rotation = (index / total) * 360 * 4; // 4 full turns for more spiral density
  const delay = index * 0.03;

  // Randomize color slightly for a natural tech feel
  const isCyan = (index % 3) === 0;
  const isIndigo = (index % 3) === 1;

  return (
    <div
      className="absolute left-0 top-0 w-full flex items-center justify-between"
      style={{
        transform: `rotateY(${rotation}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Left Nucleotide (Cyan side) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
          default: { delay, duration: 0.5 }
        }}
        className={`w-2 h-2 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] ${isCyan ? 'bg-cyan-400' : isIndigo ? 'bg-blue-400' : 'bg-emerald-400'
          }`}
        style={{ transform: "translate3d(-60px, 0, 70px)" } as any} // Widespread 3D
      />

      {/* Hidden Connector - Not visible in reference */}
      <div className="h-0 w-0" />

      {/* Right Nucleotide (Blue/Purple side) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.1 },
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.1 },
          default: { delay: delay + 0.1, duration: 0.5 }
        }}
        className={`w-2 h-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${isIndigo ? 'bg-blue-600' : isCyan ? 'bg-indigo-500' : 'bg-purple-500'
          }`}
        style={{ transform: "translate3d(60px, 0, -70px)" } as any} // Opposite widespread 3D
      />
    </div>
  );
}
