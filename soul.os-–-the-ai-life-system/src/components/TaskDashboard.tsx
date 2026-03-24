import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Trophy, Zap, Sparkles, Target, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase } from '../hooks/useFirebase';
import { GoogleGenAI } from "@google/genai";

export default function TaskDashboard() {
  const { tasks, profile, addTask, toggleTask, deleteTask } = useFirebase();
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'productivity' | 'health' | 'learning' | 'other'>('productivity');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const getAiSuggestion = async () => {
    if (!profile) return;
    setLoadingSuggestion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the user's current level (${profile.level}), mood (${profile.lastMood || 'Unknown'}), and memory (${profile.memory}), suggest ONE short, actionable task for their personal growth. 
        Return ONLY the task title (max 50 chars).`,
      });
      setSuggestion(response.text.trim());
    } catch (error) {
      console.error('Suggestion error:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask({
      title: newTask,
      completed: false,
      xpReward: 15,
      category
    });
    setNewTask('');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
        <div className="scanline" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <Target className="text-yellow-400" size={28} />
              Life Progression
            </h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">Neural growth mapping active</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/[0.03] p-4 rounded-3xl border border-white/5">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Current Level</p>
              <h3 className="text-2xl font-black text-yellow-400 leading-none">{profile?.level}</h3>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${(profile?.experience || 0) % 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Experience</p>
              <h3 className="text-sm font-black text-white/80 leading-none">{profile?.experience % 100}/100</h3>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Define a new life goal..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 transition-all focus:bg-white/[0.08]"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm font-bold focus:outline-none focus:border-yellow-400/50 transition-all"
            >
              <option value="productivity">Productivity</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="other">Other</option>
            </select>
            <button 
              type="submit" 
              className="bg-yellow-400 hover:bg-yellow-300 text-black p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </form>

        {/* AI Suggestion */}
        <div className="mb-12 p-8 bg-yellow-400/[0.03] border border-yellow-400/20 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={80} className="text-yellow-400" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-400" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Guardian Suggestion</h4>
              </div>
              {suggestion ? (
                <p className="text-xl font-black text-white tracking-tight leading-tight">{suggestion}</p>
              ) : (
                <p className="text-white/30 text-sm font-bold italic">Need a nudge? Let SOUL.OS analyze your path.</p>
              )}
            </div>
            
            <div className="flex-shrink-0">
              {suggestion ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSuggestion(null)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => {
                      addTask({ title: suggestion, completed: false, xpReward: 20, category: 'productivity' });
                      setSuggestion(null);
                    }}
                    className="bg-yellow-400 text-black text-xs font-black px-8 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-yellow-400/20"
                  >
                    Accept Goal
                  </button>
                </div>
              ) : (
                <button 
                  onClick={getAiSuggestion}
                  disabled={loadingSuggestion}
                  className="flex items-center gap-3 px-8 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-black uppercase tracking-widest hover:bg-yellow-400/20 transition-all disabled:opacity-50"
                >
                  {loadingSuggestion ? (
                    <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Goal
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 group ${
                  task.completed 
                    ? 'bg-white/[0.02] border-white/5 opacity-40' 
                    : 'bg-white/[0.04] border-white/10 hover:border-yellow-400/30 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => toggleTask(task.id!, !task.completed)}
                    className="relative flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="text-green-400" size={32} strokeWidth={2.5} />
                    ) : (
                      <div className="w-8 h-8 rounded-xl border-2 border-white/20 group-hover:border-yellow-400/50 transition-colors" />
                    )}
                  </button>
                  <div>
                    <h3 className={`text-lg font-black tracking-tight transition-all ${task.completed ? 'line-through text-white/40' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black">{task.category}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black text-yellow-400/60">+{task.xpReward} XP</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteTask(task.id!)} 
                  className="p-3 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="text-center py-24 opacity-20">
              <Trophy size={80} className="mx-auto text-white/10 mb-6 animate-float" />
              <p className="text-2xl font-black tracking-tighter">No active goals. Let's build your future.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
