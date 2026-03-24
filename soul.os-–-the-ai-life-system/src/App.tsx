import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Sparkles, Shield, Heart, LogOut } from 'lucide-react';
import { useFirebase } from './hooks/useFirebase';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TaskDashboard from './components/TaskDashboard';
import MoodTracker from './components/MoodTracker';
import FutureSimulator from './components/FutureSimulator';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, loading, login, logout } = useFirebase();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 shadow-2xl shadow-cyan-500/20"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020203] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl text-center z-10"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-purple-600 mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-cyan-500/40 relative group">
            <div className="absolute inset-0 rounded-[2rem] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-white font-black text-5xl tracking-tighter">S</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            SOUL.OS
          </h1>
          <p className="text-xl text-white/60 mb-12 font-medium leading-relaxed max-w-xl mx-auto">
            The AI Life System. More than software, a presence that grows with you, 
            understands your journey, and guards your growth.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
            {[
              { icon: Heart, title: "Emotional Intelligence", desc: "A companion that truly listens and feels." },
              { icon: Sparkles, title: "Life Gamification", desc: "Turn growth into a rewarding progression." },
              { icon: Shield, title: "Guardian Logic", desc: "AI-driven simulations for better decisions." }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-500 group">
                <feature.icon className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="font-bold mb-2 text-white/90">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-snug">{feature.desc}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={login}
            className="group relative px-10 py-5 bg-white text-black font-black rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
              Initialize Connection
              <LogIn size={20} />
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 relative p-4 lg:p-10 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto min-h-full flex flex-col">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-4xl font-black tracking-tighter capitalize text-glow-cyan">
                {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'chat' ? 'Presence' : activeTab === 'tasks' ? 'Progression' : activeTab === 'mood' ? 'Emotional Pulse' : activeTab === 'simulate' ? 'Simulation Engine' : 'System Configuration'}
              </h2>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">System operational • Syncing memory...</p>
            </div>

            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </header>

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
                {activeTab === 'chat' && <ChatInterface />}
                {activeTab === 'tasks' && <TaskDashboard />}
                {activeTab === 'mood' && <MoodTracker />}
                {activeTab === 'simulate' && <FutureSimulator />}
                {activeTab === 'settings' && <Settings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
