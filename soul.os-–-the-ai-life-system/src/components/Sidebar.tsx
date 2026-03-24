import React, { useState } from 'react';
import { 
  MessageSquare, 
  CheckSquare, 
  Activity, 
  Compass, 
  Settings as SettingsIcon, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase } from '../hooks/useFirebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { profile, user, logout } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'chat', label: 'Presence', icon: MessageSquare },
    { id: 'tasks', label: 'Progression', icon: CheckSquare },
    { id: 'mood', label: 'Pulse', icon: Heart },
    { id: 'simulate', label: 'Simulation', icon: Compass },
    { id: 'settings', label: 'System', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-lg rounded-lg text-white"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-black/60 backdrop-blur-2xl border-r border-white/10 flex flex-col p-6"
          >
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter">SOUL.OS</h1>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id 
                      ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <UserIcon size={16} className="text-white/60" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Lvl {profile?.level}</p>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${(profile?.experience || 0) % 100}%` }} />
                </div>
              </div>

              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
              >
                <LogOut size={20} />
                <span className="font-bold tracking-tight">Disconnect</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
