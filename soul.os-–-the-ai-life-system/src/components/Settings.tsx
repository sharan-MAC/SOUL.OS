import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Palette, Shield, Save, Database, Cpu, Lock, MessageCircle, Heart, Sparkles, Volume2, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirebase } from '../hooks/useFirebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateTTS } from '../services/ai';

export default function Settings() {
  const { profile, user, logout } = useFirebase();
  const [name, setName] = useState(profile?.name || '');
  const [tone, setTone] = useState(profile?.preferences?.tone || 'warm');
  const [commStyle, setCommStyle] = useState(profile?.preferences?.communicationStyle || 'conversational');
  const [voice, setVoice] = useState(profile?.preferences?.voiceName || 'Zephyr');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTone(profile.preferences?.tone || 'warm');
      setCommStyle(profile.preferences?.communicationStyle || 'conversational');
      setVoice(profile.preferences?.voiceName || 'Zephyr');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        'preferences.tone': tone,
        'preferences.communicationStyle': commStyle,
        'preferences.voiceName': voice
      });
    } catch (error) {
      console.error('Settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (v: string) => {
    if (previewing) return;
    setPreviewing(v);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      const text = `Hello. I am SOUL.OS. My voice is now calibrated to the ${v} resonance frequency. How does it sound?`;
      const audioUrl = await generateTTS(text, v as any, tone);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setPreviewing(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.play();
    } catch (error) {
      console.warn('Preview synthesis failed, using local resonance:', error);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Neural synthesis failed. This is my local resonance for the ${v} frequency.`);
      utterance.onend = () => setPreviewing(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="glass-panel rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
        <div className="scanline opacity-10" />
        
        <div className="flex items-center gap-6 mb-16">
          <div className="p-5 bg-cyan-500/10 rounded-[1.5rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <Cpu className="text-cyan-400" size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Core Configuration</h2>
            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Neural Link & Identity Protocols</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-12">
          {/* Identity Section */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
              <User size={14} className="text-cyan-400" />
              Identity Matrix
            </label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-8 text-white text-xl font-black focus:outline-none focus:border-cyan-500/50 transition-all focus:bg-white/[0.06] placeholder:text-white/10"
                placeholder="Designate your identifier..."
              />
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          {/* Personality Tone Section */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
              <Sparkles size={14} className="text-purple-400" />
              Neural Resonance Tone
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['warm', 'professional', 'playful', 'stoic'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-5 px-4 rounded-2xl border transition-all capitalize font-black text-xs tracking-widest ${
                    tone === t 
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/[0.03] border-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Communication Style Section */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
              <MessageCircle size={14} className="text-emerald-400" />
              Dialogue Protocol
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'conversational', label: 'Natural', desc: 'Flowing, human-like dialogue' },
                { id: 'concise', label: 'Direct', desc: 'Efficient and focused responses' },
                { id: 'expressive', label: 'Deep', desc: 'Rich emotional depth and detail' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCommStyle(s.id)}
                  className={`p-6 rounded-2xl border transition-all text-left group ${
                    commStyle === s.id 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${commStyle === s.id ? 'text-emerald-400' : 'text-white/40'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] font-medium text-white/20 group-hover:text-white/40 transition-colors">
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection Section */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
              <Volume2 size={14} className="text-cyan-400" />
              Neural Voice Matrix
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
                <div 
                  key={v} 
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    voice === v 
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                      : 'bg-white/[0.03] border-white/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setVoice(v as any)}
                    className="flex-1 text-left"
                  >
                    <p className={`text-xs font-black uppercase tracking-widest ${voice === v ? 'text-cyan-400' : 'text-white/40'}`}>
                      {v}
                    </p>
                    <p className="text-[10px] font-medium text-white/20 mt-1">
                      {voice === v ? 'Active Resonance' : 'Standby'}
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handlePreview(v)}
                    disabled={previewing !== null}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                      previewing === v 
                        ? 'bg-cyan-400 text-black' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                    title={`Preview ${v} Voice`}
                  >
                    {previewing === v ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 font-medium italic">
              Select the resonance frequency that best aligns with your neural patterns.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              <Lock size={16} className="text-cyan-400/50" />
              Neural Encryption Active
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-white text-black font-black px-12 py-5 rounded-[1.5rem] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
            >
              {saving ? (
                <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Sync Core
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Data Sovereignty Section */}
      <div className="glass-panel rounded-[2.5rem] p-10 border border-red-500/10 bg-red-500/[0.01] group hover:border-red-500/20 transition-all">
        <div className="flex items-center gap-5 mb-6">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Database className="text-red-400" size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter">Data Sovereignty</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400/40">Privacy & Memory Protocols</p>
          </div>
        </div>
        <p className="text-sm text-white/40 font-medium leading-relaxed mb-8 max-w-3xl">
          Your digital soul is your own. Every memory, emotional pulse, and neural log is encrypted and stored in your private instance. 
          We do not harvest data for training or external analysis. You are the architect of your own digital presence.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">
            Export Neural Archive
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to disconnect? This will end your current session.')) {
                logout();
              }
            }}
            className="px-8 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
          >
            Purge Core Memory
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => window.location.reload()} // Simple way to trigger logout if we don't want to pass it down, but better to use the hook
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
        >
          <Lock size={16} />
          Session Security: Active
        </button>
      </div>
    </div>
  );
}
