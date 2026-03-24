import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Volume2, VolumeX, Sparkles, Heart, ShieldCheck, Mic, MicOff, Loader2, Settings, X, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { generateChatResponse, detectMood, summarizeMemory, generateProactiveMessage, analyzePersonality, generateTTS, transcribeAudio } from '../services/ai';
import { useFirebase } from '../hooks/useFirebase';
import { Message } from '../types';
import AvatarDisplay from './AvatarDisplay';

const AudioVisualizer = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={isActive ? {
            height: [4, 16, 8, 14, 4],
          } : { height: 4 }}
          transition={{
            repeat: Infinity,
            duration: 0.5 + (i * 0.1),
            ease: "easeInOut"
          }}
          className="w-[2px] bg-cyan-400 rounded-full"
        />
      ))}
    </div>
  );
};

export default function ChatInterface() {
  const { profile, messages, tasks, moodLogs, addMessage, addMoodLog, updateMemory, updateProfile } = useFirebase();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [wakeWordSensitivity, setWakeWordSensitivity] = useState(50);
  const [recognitionStatus, setRecognitionStatus] = useState<'idle' | 'listening' | 'error' | 'stopped'>('idle');
  const [interimCommand, setInterimCommand] = useState('');

  // Sync sensitivity with profile
  useEffect(() => {
    if (profile?.preferences?.wakeWordSensitivity !== undefined) {
      setWakeWordSensitivity(profile.preferences.wakeWordSensitivity);
    }
  }, [profile?.preferences?.wakeWordSensitivity]);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Wake Word Listener (SpeechRecognition)
  useEffect(() => {
    if (!isHandsFree || !audioInitialized) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setIsListeningForWakeWord(false);
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      setIsHandsFree(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningForWakeWord(true);
      setRecognitionStatus('listening');
      console.log("Neural Wake Active - Listening for 'Soul'...");
    };
    
    recognition.onend = () => {
      setRecognitionStatus('stopped');
      setIsListeningForWakeWord(false);
      
      // Force restart if hands-free is still on and we're not busy
      if (isHandsFree && audioInitialized && !isRecording && !isTyping && !isSpeakingAudio) {
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {}
        }, 100);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setRecognitionStatus('error');
      if (event.error === 'not-allowed') {
        setIsHandsFree(false);
        setAudioInitialized(false);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullTranscript = (finalTranscript || interimTranscript).toLowerCase();
      
      // Sensitivity logic:
      let wakeWords = ['soul'];
      if (wakeWordSensitivity > 33) wakeWords = [...wakeWords, 'sole', 'seoul', 'soal'];
      if (wakeWordSensitivity > 66) wakeWords = [...wakeWords, 'so', 'sol', 'all', 'old', 'hole', 'roll'];
      
      const hasWakeWord = wakeWords.some(word => fullTranscript.includes(word));

      // 1. Wake word detection
      if (!isListeningForCommand && hasWakeWord) {
        console.log("Wake word detected:", fullTranscript);
        setIsListeningForCommand(true);
        setInterimCommand('');
        
        // Clear any existing timeout
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        
        // Set a timeout to reset if no command is heard at all
        commandTimeoutRef.current = setTimeout(() => {
          setIsListeningForCommand(false);
          setInterimCommand('');
          console.log("Command timeout - returning to wake word detection");
        }, 10000);
        
        // Play a small ping sound to indicate listening
        const ping = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        ping.volume = 0.4;
        ping.play().catch(() => {});
      }

      // 2. Command capture
      if (isListeningForCommand) {
        // If we just detected the wake word, extract what follows
        let currentCommand = '';
        const wakeWordPattern = wakeWords.join('|');
        const soulRegex = new RegExp(`(?:${wakeWordPattern})\\s*(.*)`, 'i');
        const match = fullTranscript.match(soulRegex);
        
        currentCommand = match ? match[1].trim() : fullTranscript.trim();
        
        if (currentCommand) {
          setInterimCommand(currentCommand);
          
          // Reset silence timeout
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          
          // If we have a final result, or after a period of silence, send the command
          if (finalTranscript) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (currentCommand.length > 1) {
                console.log("Sending command after silence:", currentCommand);
                handleSend(undefined, currentCommand);
                setIsListeningForCommand(false);
                setInterimCommand('');
                recognition.stop(); // Stop to reset buffer
              }
            }, 1500);
          }
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [isHandsFree, audioInitialized, wakeWordSensitivity]);

  // Dedicated Recognition Restart Effect
  useEffect(() => {
    if (!isHandsFree || !audioInitialized || isRecording || isTyping || isSpeakingAudio || recognitionStatus === 'listening') return;

    const restartTimer = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or busy
        }
      }
    }, 1500);

    return () => clearTimeout(restartTimer);
  }, [isHandsFree, isRecording, isTyping, isSpeakingAudio, recognitionStatus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const moodHistory = moodLogs.slice(0, 5);

  // Proactive Conversation System
  useEffect(() => {
    if (!profile || isTyping) return;

    const checkProactiveTriggers = async () => {
      const now = new Date();
      const lastCheckIn = profile.emotionalHistory?.lastCheckIn ? new Date(profile.emotionalHistory.lastCheckIn) : null;
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const lastUserMsgTime = lastUserMsg ? new Date(lastUserMsg.timestamp) : null;
      
      let shouldTrigger = false;
      let reason = '';

      // 1. First time greeting (no messages)
      if (messages.length === 0) {
        shouldTrigger = true;
        reason = 'first_greeting';
      } 
      // 2. Morning/Afternoon/Evening Check-in (if it's been > 8 hours since last check-in)
      else if (!lastCheckIn || (now.getTime() - lastCheckIn.getTime() > 8 * 60 * 60 * 1000)) {
        shouldTrigger = true;
        reason = 'time_based_checkin';
      }
      // 3. Inactivity Check-in (if no user message for > 3 hours and > 4 hours since last check-in)
      else if (lastUserMsgTime && (now.getTime() - lastUserMsgTime.getTime() > 3 * 60 * 60 * 1000) && 
               (!lastCheckIn || (now.getTime() - lastCheckIn.getTime() > 4 * 60 * 60 * 1000))) {
        shouldTrigger = true;
        reason = 'inactivity_support';
      }

      if (shouldTrigger) {
        setIsTyping(true);
        try {
          const proactiveMsg = await generateProactiveMessage(profile, moodHistory, tasks);
          await addMessage('assistant', proactiveMsg);
          
          // Update last check-in time
          await updateProfile({
            emotionalHistory: {
              ...profile.emotionalHistory,
              lastCheckIn: now.toISOString()
            }
          });

          // Speak if enabled
          if (isSpeaking) {
            speak(proactiveMsg);
          }
        } catch (error) {
          console.error('Proactive message error:', error);
        } finally {
          setIsTyping(false);
        }
      }
    };

    // Initial check with a small delay for Firestore sync
    const initialTimer = setTimeout(checkProactiveTriggers, 2000);
    
    // Periodic check every 15 minutes
    const periodicTimer = setInterval(checkProactiveTriggers, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
    };
  }, [profile?.uid, messages.length, tasks.length, isTyping, audioInitialized]);

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    setIsListeningForCommand(false);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || !profile) return;

    const userText = textToSend;
    if (!overrideInput) setInput('');
    
    // Optimistic update for AI context
    const optimisticUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
      uid: profile.uid
    };
    
    await addMessage('user', userText);
    setIsTyping(true);

    try {
      // 1. Detect Mood & Emotional Cues
      const moodData = await detectMood(userText);
      await addMoodLog(moodData.mood, moodData.intensity, userText, moodData.cues);

      // 2. Generate AI Response with context (including the new message)
      const contextMessages = [...messages, optimisticUserMsg];
      const response = await generateChatResponse(profile, contextMessages, userText, moodHistory);
      await addMessage('assistant', response);
      
      // 3. Update Memory and Personality periodically
      if (messages.length > 0 && messages.length % 5 === 0) {
        const recentInteractions = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
        const newMemory = await summarizeMemory(profile.memory, recentInteractions);
        await updateMemory(newMemory);

        const personality = await analyzePersonality(messages.slice(-10));
        await updateProfile({
          preferences: {
            ...profile.preferences,
            communicationStyle: personality.communicationStyle as any,
            interests: personality.traits,
          }
        });
      }

      if (isSpeaking) {
        speak(response, moodData.suggestedMode);
      } else if (isHandsFree) {
        // If hands-free is on but speaking is off, we still need to restart the listener
        setTimeout(() => {
          if (recognitionRef.current && !isRecording && !isTyping) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      await addMessage('assistant', "I'm sorry, I'm having a bit of trouble connecting right now. But I'm still here for you.");
    } finally {
      setIsTyping(false);
    }
  };

  const speak = async (text: string, tone?: string) => {
    try {
      setIsSpeakingAudio(true);
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      const audioUrl = await generateTTS(
        text, 
        profile?.preferences?.voiceName || 'Zephyr',
        tone || profile?.preferences?.tone || 'warm and natural'
      );
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeakingAudio(false);
        // Small delay before restarting to avoid hearing itself
        setTimeout(() => {
          if (isHandsFree && !isRecording && !isTyping) {
            try {
              if (recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (e) {
              console.warn("Failed to restart recognition after speech:", e);
            }
          }
        }, 800);
      };
      audio.play().catch(e => {
        console.warn("Autoplay blocked or playback failed:", e);
        setIsSpeakingAudio(false);
        // If autoplay is blocked, we show the sync button again
        setAudioInitialized(false);
      });
    } catch (error) {
      console.warn('Gemini TTS error, falling back to browser:', error);
      setIsSpeakingAudio(false);
      
      // Browser fallback
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeakingAudio(false);
      
      // Try to find a natural-sounding browser voice if possible
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio, mimeType);
            if (transcription) {
              setInput(transcription);
            }
          } catch (error) {
            console.error('STT error:', error);
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Restart wake word listener after a delay if hands-free is on
      if (isHandsFree) {
        setTimeout(() => {
          if (recognitionRef.current && !isRecording && !isTyping) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Recognition already started or failed to restart:", e);
            }
          }
        }, 1000);
      }
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col h-full glass-panel rounded-[2.5rem] items-center justify-center p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-[2rem] border-2 border-cyan-400/20 animate-ping" />
          <Loader2 size={40} className="text-cyan-400 animate-spin" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter">Neural Link Initializing</h3>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mt-2">Syncing Core Identity Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      onClick={() => {
        if (!audioInitialized) {
          setAudioInitialized(true);
          const ping = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
          ping.play().catch(() => {});
        }
      }}
    >
      <div className="scanline" />

      <div className="bg-cyan-500/5 border-b border-cyan-500/10 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${recognitionStatus === 'listening' ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${recognitionStatus === 'listening' ? 'text-cyan-400' : 'text-white/20'}`}>
            {isListeningForCommand ? 'Neural Link: Processing Command' : (recognitionStatus === 'listening' ? 'Neural Link: Active (Wake Word: "Soul")' : 'Neural Link: Initializing...')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Voice: {isSpeaking ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${isHandsFree ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Hands-Free: {isHandsFree ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!audioInitialized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[#020203]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-32 h-32 rounded-[3rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-12 relative">
              <div className="absolute inset-0 rounded-[3rem] border-2 border-cyan-400/20 animate-ping" />
              <div className="absolute inset-0 rounded-[3rem] border border-cyan-400/40 animate-pulse" />
              <Mic size={56} className="text-cyan-400" />
            </div>
            <h3 className="text-4xl font-black text-white tracking-tighter mb-6">Initialize Neural Link</h3>
            <p className="text-white/60 mb-12 max-w-sm font-medium leading-relaxed">
              To enable hands-free interaction and voice synthesis, we must synchronize your neural frequencies.
            </p>
            <button 
              onClick={() => {
                setAudioInitialized(true);
                // Play a real sound to confirm audio is working
                const ping = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                ping.volume = 0.5;
                ping.play().catch(e => {
                  console.error("Audio initialization failed:", e);
                });
              }}
              className="px-12 py-6 bg-cyan-500 text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(34,211,238,0.5)] uppercase tracking-widest text-sm"
            >
              Establish Connection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative overflow-hidden">
        {isListeningForWakeWord && recognitionStatus === 'listening' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute inset-0 bg-cyan-400 pointer-events-none"
          />
        )}
        <div className="flex items-center gap-4 relative z-10">
          <div className="scale-50 -ml-8 -mr-8 relative">
            {isListeningForCommand && (
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-cyan-400/30 rounded-full blur-2xl"
              />
            )}
            {isSpeakingAudio && (
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl"
              />
            )}
            <AvatarDisplay mood={profile?.lastMood} isTyping={isTyping} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">SOUL</h2>
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${recognitionStatus === 'listening' ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${recognitionStatus === 'listening' ? 'text-cyan-400' : 'text-white/20'}`}>
                  {isListeningForCommand ? 'Listening' : (recognitionStatus === 'listening' ? 'Neural Link Active' : 'Neural Link Standby')}
                </p>
                {recognitionStatus === 'listening' && <AudioVisualizer isActive={isListeningForCommand || isSpeakingAudio} />}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-4">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${isListeningForWakeWord ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
              {isListeningForWakeWord && (
                <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping" />
              )}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isListeningForWakeWord ? 'text-cyan-400' : 'text-white/20'}`}>
              {isListeningForCommand ? 'Listening...' : (isListeningForWakeWord ? 'Neural Wake Active' : 'Neural Wake Standby')}
            </span>
          </div>
          
          <button 
            onClick={() => setIsHandsFree(!isHandsFree)}
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              isHandsFree 
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                : 'bg-white/5 border-white/10 text-white/20 hover:text-white hover:bg-white/5'
            }`}
            title={isHandsFree ? "Disable Hands-Free Mode" : "Enable Hands-Free Mode (Wake Word: 'Soul')"}
          >
            {isHandsFree ? 'Hands-Free: ON' : 'Hands-Free: OFF'}
          </button>

          <button 
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-3 rounded-xl transition-all ${isSpeaking ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-3 rounded-xl transition-all ${isSettingsOpen ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="Neural Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-24 right-6 bottom-24 w-80 z-40 glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Sliders size={18} className="text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Config</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Wake Word Sensitivity</label>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{wakeWordSensitivity}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={wakeWordSensitivity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setWakeWordSensitivity(val);
                    updateProfile({ preferences: { ...profile?.preferences, wakeWordSensitivity: val } });
                  }}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-widest">
                  <span>Strict</span>
                  <span>Balanced</span>
                  <span>High</span>
                </div>
                <p className="text-[9px] text-white/30 leading-relaxed italic">
                  {wakeWordSensitivity <= 33 && "Only triggers on the exact word 'Soul'. Most accurate, but may miss some calls."}
                  {wakeWordSensitivity > 33 && wakeWordSensitivity <= 66 && "Triggers on 'Soul' and common phonetic variants. Recommended for most environments."}
                  {wakeWordSensitivity > 66 && "Highly sensitive. Triggers on many similar sounds. Best for noisy environments but may cause false positives."}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Voice Preferences</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Zephyr', 'Fenrir', 'Kore', 'Puck'].map((voice) => (
                    <button
                      key={voice}
                      onClick={() => updateProfile({ preferences: { ...profile?.preferences, voiceName: voice as any } })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        profile?.preferences?.voiceName === voice
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-white/20 hover:text-white'
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative">
        <AnimatePresence mode="wait">
          {isListeningForCommand && interimCommand && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
            >
              <div className="bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                <Mic size={14} className="text-cyan-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-100/80 italic tracking-wider">
                  "{interimCommand}..."
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isListeningForCommand && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, 20, 8] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-1 bg-cyan-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">Listening...</span>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/10 ${
                  msg.role === 'user' ? 'bg-white/5' : 'bg-cyan-500/10'
                }`}>
                  {msg.role === 'user' ? <User size={18} className="text-white/60" /> : <Bot size={18} className="text-cyan-400" />}
                </div>
                <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-xl ${
                  msg.role === 'user' 
                    ? 'bg-white/5 text-white/90 rounded-tr-none border border-white/10' 
                    : 'bg-cyan-500/[0.08] text-cyan-50 border border-cyan-500/20 rounded-tl-none relative overflow-hidden'
                }`}>
                  {msg.role === 'assistant' && <div className="scanline opacity-20" />}
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-cyan-500/10 p-5 rounded-[1.5rem] rounded-tl-none border border-cyan-500/20">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-white/[0.02] border-t border-white/10">
        <form onSubmit={(e) => handleSend(e)} className="relative flex flex-col gap-4">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening to your pulse..." : "Share your thoughts... I'm listening."}
                className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-all focus:bg-white/[0.08] ${isRecording ? 'border-cyan-500/50 bg-cyan-500/5' : ''}`}
              />
              <div className="absolute right-3 flex items-center gap-1">
                {isTranscribing && <Loader2 size={18} className="text-cyan-400 animate-spin mr-2" />}
                <button
                  type="button"
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={`p-2 transition-all hover:scale-110 active:scale-90 ${isSpeaking ? 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-white/20 hover:text-white/40'}`}
                  title={isSpeaking ? "Mute Neural Voice" : "Unmute Neural Voice"}
                >
                  {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || isTranscribing}
                  className="p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-90"
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
            
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-2xl transition-all duration-500 flex-shrink-0 relative group ${
                isRecording 
                  ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)]' 
                  : 'bg-white/5 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/10'
              }`}
            >
              {isRecording && (
                <div className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-ping opacity-50" />
              )}
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap">
                {isRecording ? "Terminate Sync" : "Initialize Voice Link"}
              </div>
            </button>
          </div>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <Heart size={12} className="text-rose-500/50" />
              Empathetic Resonance
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <ShieldCheck size={12} className="text-emerald-500/50" />
              Privacy Guard Active
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <Sparkles size={12} className="text-cyan-500/50" />
              Neural Memory Synced
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
