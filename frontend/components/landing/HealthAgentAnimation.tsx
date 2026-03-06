"use client";

import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function HealthAgentAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotationOffset, setRotationOffset] = useState(0);

  // Mouse interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth - 0.5);
      mouseY.set(e.clientY / innerHeight - 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 50, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 50, damping: 20 });

  // Continuous rotation loop
  useAnimationFrame((time, delta) => {
    setRotationOffset(prev => (prev + delta * 0.05) % 360);
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center perspective-1000 overflow-visible"
    >
      {/* Interactive Container */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-[300px] h-[600px] flex items-center justify-center"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[80px] transform scale-110 pointer-events-none" />

        {/* Diagonal Tilt Container */}
        <div
          className="relative w-full h-full transform -rotate-[35deg] scale-110"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* DNA Structure */}
          <DNAStructure rotation={rotationOffset} />
        </div>
      </motion.div>
    </div>
  );
}

function DNAStructure({ rotation }: { rotation: number }) {
  const numPairs = 40;
  const height = 700;
  const radius = 60;
  const turns = 3;

  // Generate pairs deterministically
  const pairs = Array.from({ length: numPairs }).map((_, i) => {
    const progress = i / numPairs;
    const y = progress * height - height / 2;
    const baseAngle = (progress * turns * 360);
    const angle = baseAngle + rotation;

    // Calculate 3D positions
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const z = Math.sin(rad) * radius;

    // Deterministic color choice
    const isAT = (i * 7) % 2 === 0;

    return { id: i, y, x, z, angle, isAT };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
      {/* Central Axis Line */}
      <div className="absolute w-[1px] h-[120%] bg-gradient-to-b from-transparent via-blue-300/10 to-transparent blur-[0.5px]" />

      {pairs.map((pair) => (
        <DNAPair key={pair.id} {...pair} />
      ))}
    </div>
  );
}

function DNAPair({ x, y, z, isAT }: { x: number, y: number, z: number, angle: number, isAT: boolean }) {
  // Scale based on Z-depth for pseudo-perspective sizing
  // z ranges from -radius to +radius (-60 to 60)
  // scale range: 0.6 to 1.2
  const scale = 0.8 + (z / 120) * 0.4;
  const opacity = 0.4 + (z / 120) * 0.6 + 0.5; // Fade out back items slightly

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        transform: `translate3d(${0}px, ${y}px, 0px)`, // Y is handled by container layout, X/Z by children
        transformStyle: "preserve-3d",
      }}
    >
      {/* Simplified Approach: Position Strand A and Strand B explicitly */}

      {/* Strand A Node */}
      <div
        className={`absolute w-3 h-3 rounded-full shadow-lg ${isAT ? 'bg-blue-500' : 'bg-indigo-500'}`}
        style={{
          transform: `translate3d(${x.toFixed(4)}px, 0, ${z.toFixed(4)}px) scale(${scale.toFixed(4)})`,
          opacity: opacity.toFixed(4),
          boxShadow: `0 0 ${(10 * scale).toFixed(4)}px ${isAT ? 'rgba(59,130,246,0.6)' : 'rgba(99,102,241,0.6)'}`
        }}
      />

      {/* Strand B Node (Opposite side) */}
      <div
        className={`absolute w-3 h-3 rounded-full shadow-lg ${isAT ? 'bg-cyan-400' : 'bg-emerald-400'}`}
        style={{
          transform: `translate3d(${(-x).toFixed(4)}px, 0, ${(-z).toFixed(4)}px) scale(${scale.toFixed(4)})`,
          opacity: opacity.toFixed(4),
          boxShadow: `0 0 ${(10 * scale).toFixed(4)}px ${isAT ? 'rgba(34,211,238,0.6)' : 'rgba(52,211,153,0.6)'}`
        }}
      />

      {/* Connector Bond */}
      <div
        className="absolute h-[1.5px] bg-white/30"
        style={{
          width: '120px',
          transform: `rotateY(${(Math.atan2(z, x) * (180 / Math.PI)).toFixed(4)}deg)`,
          opacity: (opacity * 0.5).toFixed(4)
        }}
      >
        {/* Texture dots on bond */}
        <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-1 h-1 bg-white/60 rounded-full" />
        <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-1 h-1 bg-white/60 rounded-full" />
      </div>

    </div>
  );
}
