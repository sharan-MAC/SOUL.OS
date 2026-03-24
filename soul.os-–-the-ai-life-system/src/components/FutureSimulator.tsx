import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, CheckCircle, Zap, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateFuture } from '../services/ai';
import { SimulationResult } from '../types';

export default function FutureSimulator() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await simulateFuture(input);
      setResult(res);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
        <div className="scanline" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Compass className="text-purple-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Future Simulation Engine</h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">AI-driven outcome prediction mapping</p>
          </div>
        </div>

        <form onSubmit={handleSimulate} className="mb-12">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What if I start a new career path in neural engineering?"
              className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 min-h-[160px] resize-none transition-all focus:bg-white/[0.06] text-lg font-medium"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 hidden md:block">Ready for computation</p>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20 font-black uppercase tracking-widest text-xs"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={18} />
                    Initialize Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              <div className="p-8 bg-purple-500/[0.05] border border-purple-500/20 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain size={120} className="text-purple-400" />
                </div>
                <h3 className="text-purple-400 font-black text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Sparkles size={16} />
                  Primary Prediction
                </h3>
                <p className="text-2xl font-black text-white leading-tight tracking-tight max-w-3xl relative z-10">
                  {result.prediction}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-red-500/[0.03] border border-red-500/10 rounded-[2rem] hover:border-red-500/30 transition-all group">
                  <h3 className="text-red-400 font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <AlertTriangle size={18} />
                    Potential Risks
                  </h3>
                  <ul className="space-y-4">
                    {result.risks.map((risk, i) => (
                      <li key={i} className="text-white/70 flex gap-4 text-sm font-medium leading-relaxed group-hover:text-white/90 transition-colors">
                        <span className="text-red-400 font-black">0{i+1}</span> 
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 bg-green-500/[0.03] border border-green-500/10 rounded-[2rem] hover:border-green-500/30 transition-all group">
                  <h3 className="text-green-400 font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <CheckCircle size={18} />
                    Expected Outcomes
                  </h3>
                  <ul className="space-y-4">
                    {result.outcomes.map((outcome, i) => (
                      <li key={i} className="text-white/70 flex gap-4 text-sm font-medium leading-relaxed group-hover:text-white/90 transition-colors">
                        <span className="text-green-400 font-black">0{i+1}</span> 
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setResult(null);
                  setInput('');
                }}
                className="w-full py-4 rounded-2xl border border-white/5 text-white/20 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white/40 hover:bg-white/[0.02] transition-all"
              >
                Reset Simulation Matrix
              </button>
            </motion.div>
          ) : (
            <div className="text-center py-20 opacity-20">
              <Compass size={80} className="mx-auto text-white/10 mb-6 animate-pulse" />
              <p className="text-2xl font-black tracking-tighter">Awaiting simulation parameters...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
