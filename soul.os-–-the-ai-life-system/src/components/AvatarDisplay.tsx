import React from 'react';
import { motion } from 'framer-motion';

interface AvatarDisplayProps {
  mood?: string;
  isTyping?: boolean;
}

export default function AvatarDisplay({ mood, isTyping }: AvatarDisplayProps) {
  // Determine color based on mood
  const getMoodColor = () => {
    const m = mood?.toLowerCase() || '';
    if (m.includes('happy') || m.includes('joy')) return 'cyan';
    if (m.includes('sad') || m.includes('depressed')) return 'blue';
    if (m.includes('stress') || m.includes('anxious')) return 'red';
    if (m.includes('motivate') || m.includes('excite')) return 'green';
    return 'purple';
  };

  const color = getMoodColor();
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-400 to-blue-500',
    blue: 'from-blue-500 to-indigo-600',
    red: 'from-red-400 to-rose-600',
    green: 'from-emerald-400 to-teal-600',
    purple: 'from-purple-400 to-fuchsia-600',
  };

  const glowMap: Record<string, string> = {
    cyan: 'shadow-[0_0_40px_rgba(34,211,238,0.3)]',
    blue: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]',
    red: 'shadow-[0_0_40px_rgba(248,113,113,0.3)]',
    green: 'shadow-[0_0_40px_rgba(52,211,153,0.3)]',
    purple: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Outer Pulse Rings */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full border border-${color}-500/30`}
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.05, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full border border-${color}-500/20`}
      />

      {/* Core Avatar */}
      <motion.div
        animate={isTyping ? {
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        } : {
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${colorMap[color]} ${glowMap[color]} flex items-center justify-center overflow-hidden`}
      >
        {/* Internal Glow/Particles */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_70%)]" />
        
        {/* "Eyes" or Core Indicator */}
        <div className="flex gap-2">
          <motion.div
            animate={isTyping ? { height: [4, 8, 4] } : { height: [6, 2, 6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-1.5 bg-white rounded-full opacity-80"
          />
          <motion.div
            animate={isTyping ? { height: [4, 8, 4] } : { height: [6, 2, 6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.1 }}
            className="w-1.5 bg-white rounded-full opacity-80"
          />
        </div>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />
      </motion.div>

      {/* Status Indicator */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
        <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />
        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Active</span>
      </div>
    </div>
  );
}
