export interface UserProfile {
  uid: string;
  name: string;
  preferences?: {
    tone?: string;
    interests?: string[];
    communicationStyle?: 'direct' | 'gentle' | 'enthusiastic' | 'analytical';
    emotionalTriggers?: string[];
    voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
    wakeWordSensitivity?: number;
  };
  experience: number;
  level: number;
  memory: string;
  lastMood?: string;
  role?: 'admin' | 'user';
  emotionalHistory?: {
    patterns?: string[];
    lastCheckIn?: string;
  };
  createdAt: string;
}

export interface Task {
  id?: string;
  uid: string;
  title: string;
  description?: string;
  completed: boolean;
  xpReward: number;
  category: 'productivity' | 'health' | 'learning' | 'other';
  createdAt: string;
}

export interface MoodLog {
  id?: string;
  uid: string;
  mood: string;
  intensity?: number;
  trigger?: string;
  cues?: ('stress' | 'loneliness' | 'excitement' | 'frustration' | 'calm' | 'anxiety')[];
  timestamp: string;
}

export interface Message {
  id?: string;
  uid: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SimulationResult {
  prediction: string;
  risks: string[];
  outcomes: string[];
}
