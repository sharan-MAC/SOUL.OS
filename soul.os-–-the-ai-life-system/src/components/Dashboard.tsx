import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Heart, 
  TrendingUp, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  Bot,
  User as UserIcon,
  Activity,
  BrainCircuit,
  ShieldCheck
} from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';
import AvatarDisplay from './AvatarDisplay';
import { format } from 'date-fns';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { profile, tasks, moodLogs, messages } = useFirebase();
  const [greeting, setGreeting] = useState("Initializing System...");

  useEffect(() => {
    if (profile) {
      const hour = new Date().getHours();
      let timeGreeting = "Good morning";
      if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
      if (hour >= 17) timeGreeting = "Good evening";
      
      const greetings = [
        `${timeGreeting}, ${profile.name}. How are you feeling right now?`,
        `Welcome back, ${profile.name}. I've been keeping an eye on your goals.`,
        `It's good to see you, ${profile.name}. Ready to make some progress?`,
        `System presence stable. I'm here for you, ${profile.name}.`
      ];
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }
  }, [profile?.name]);

  const lastMood = moodLogs[0];
  const pendingTasks = tasks.filter(t => !t.completed);
  const recentMessages = messages.slice(-3);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] p-12 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 glass-panel shadow-2xl">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-cyan-500/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
            <AvatarDisplay mood={profile?.lastMood} />
          </motion.div>
          
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 text-glow-cyan leading-tight">
                {greeting}
              </h2>
              <p className="text-xl text-white/60 font-medium max-w-2xl leading-relaxed">
                I've analyzed your recent emotional patterns and task progress. You're doing better than you think. Let's focus on what matters today.
              </p>
            </motion.div>

            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Neural Resonance: 98%</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 shadow-lg">
                <Zap className="text-yellow-400" size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Lvl {profile?.level} • {profile?.experience % 100}/100 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chat Preview & Mood */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Chat Preview */}
          <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden group">
            <div className="scanline opacity-10" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-4">
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <MessageSquare className="text-cyan-400" size={24} />
                </div>
                Recent Dialogue
              </h3>
              <button 
                onClick={() => setActiveTab('chat')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                Enter Core <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="space-y-6">
              {recentMessages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/10 ${msg.role === 'user' ? 'bg-white/10' : 'bg-cyan-500/20'}`}>
                    {msg.role === 'user' ? <UserIcon size={18} className="text-white/60" /> : <Bot size={18} className="text-cyan-400" />}
                  </div>
                  <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-white/[0.03] text-white/80' : 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/20'}`}>
                    <p className="line-clamp-2">{msg.content}</p>
                  </div>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-center py-12 text-white/20 italic font-medium">No recent neural logs. Start a conversation.</p>
              )}
            </div>
          </div>

          {/* Progression Preview */}
          <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-4">
                <div className="p-2 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                  <Zap className="text-yellow-400" size={24} />
                </div>
                Active Missions
              </h3>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:text-yellow-300 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                Mission Hub <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTasks.slice(0, 4).map((task, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-yellow-400/30 hover:bg-white/[0.06] transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/20 group-hover:bg-yellow-400 transition-all shadow-[0_0_10px_rgba(250,204,21,0.2)]" />
                    <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{task.title}</span>
                  </div>
                  <span className="text-[10px] font-black text-yellow-400/60 group-hover:text-yellow-400 transition-colors">+{task.xpReward} XP</span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="col-span-2 text-center py-12 text-white/20 italic font-medium">All missions complete. Great work.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Emotional Pulse & Stats */}
        <div className="space-y-8">
          {/* Mood Summary */}
          <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden bg-red-500/[0.02]">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Activity size={120} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 mb-8">
              <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                <Heart className="text-red-400" size={24} />
              </div>
              Emotional Pulse
            </h3>
            
            {lastMood ? (
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-red-400/10 flex items-center justify-center border border-red-400/20 shadow-2xl shadow-red-400/10">
                    <Heart size={40} className="text-red-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Current State</p>
                    <h4 className="text-3xl font-black text-white capitalize tracking-tighter">{lastMood.mood}</h4>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    <span>Intensity Matrix</span>
                    <span className="text-red-400">{lastMood.intensity}/10</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(lastMood.intensity || 5) * 10}%` }}
                      className="h-full bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]"
                    />
                  </div>
                </div>

                {lastMood.cues && lastMood.cues.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lastMood.cues.map((cue, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400">
                        {cue}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-white/50 font-medium leading-relaxed italic border-l-2 border-red-500/20 pl-4">
                  "{lastMood.trigger || 'No specific trigger detected.'}"
                </p>
              </div>
            ) : (
              <p className="text-center py-16 text-white/20 italic font-medium">Awaiting emotional telemetry...</p>
            )}
            
            <button 
              onClick={() => setActiveTab('mood')}
              className="mt-8 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
            >
              Neural History
            </button>
          </div>

          {/* Neural Insights */}
          <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden bg-purple-500/[0.02]">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 mb-8">
              <div className="p-2 bg-purple-400/10 rounded-xl border border-purple-400/20">
                <BrainCircuit className="text-purple-400" size={24} />
              </div>
              Neural Insights
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-1">
                  <TrendingUp className="text-emerald-400" size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 mb-1">Growth Pattern</p>
                  <p className="text-[10px] text-white/40 leading-relaxed">Your productivity peaks during morning hours. I suggest scheduling deep work then.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 mt-1">
                  <Activity className="text-rose-400" size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 mb-1">Stress Trigger</p>
                  <p className="text-[10px] text-white/40 leading-relaxed">I've noticed increased tension when tasks exceed 5. Let's break them down.</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 mb-8">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="text-emerald-400" size={24} />
              </div>
              System Integrity
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Neural Uptime</span>
                <span className="text-sm font-mono text-cyan-400 font-black">99.99%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Sync Latency</span>
                <span className="text-sm font-mono text-cyan-400 font-black">12ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Memory Matrix</span>
                <span className="text-sm font-mono text-cyan-400 font-black">{profile?.memory.length || 0} bits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
