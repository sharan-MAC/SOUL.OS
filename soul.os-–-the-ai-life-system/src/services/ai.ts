import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, UserProfile, MoodLog, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ... existing code ...

function createWavHeader(pcmDataLength: number, sampleRate: number = 24000) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmDataLength, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmDataLength, true);

  return new Uint8Array(header);
}

export async function generateTTS(
  text: string, 
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Zephyr',
  tone: string = 'warm and natural'
) {
  const model = "gemini-2.5-flash-preview-tts";
  
  const attemptTTS = async (vName: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `(Tone: ${tone}) ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: vName as any },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  };

  try {
    const base64Audio = await attemptTTS(voiceName);
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }
      
      const wavHeader = createWavHeader(pcmData.length);
      const wavData = new Uint8Array(wavHeader.length + pcmData.length);
      wavData.set(wavHeader);
      wavData.set(pcmData, wavHeader.length);
      
      const blob = new Blob([wavData], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    
    // If first attempt returned no data, try default voice
    if (voiceName !== 'Zephyr') {
      const fallbackAudio = await attemptTTS('Zephyr');
      if (fallbackAudio) {
        const binaryString = atob(fallbackAudio);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }
        const wavHeader = createWavHeader(pcmData.length);
        const wavData = new Uint8Array(wavHeader.length + pcmData.length);
        wavData.set(wavHeader);
        wavData.set(pcmData, wavHeader.length);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
      }
    }
  } catch (error) {
    console.warn(`TTS failed for voice ${voiceName}, attempting default...`, error);
    if (voiceName !== 'Zephyr') {
      try {
        const fallbackAudio = await attemptTTS('Zephyr');
        if (fallbackAudio) {
          const binaryString = atob(fallbackAudio);
          const pcmData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pcmData[i] = binaryString.charCodeAt(i);
          }
          const wavHeader = createWavHeader(pcmData.length);
          const wavData = new Uint8Array(wavHeader.length + pcmData.length);
          wavData.set(wavHeader);
          wavData.set(pcmData, wavHeader.length);
          const blob = new Blob([wavData], { type: 'audio/wav' });
          return URL.createObjectURL(blob);
        }
      } catch (fallbackError) {
        console.error("All Gemini TTS attempts failed:", fallbackError);
      }
    }
  }
  
  throw new Error("Neural voice synthesis is currently unavailable. Switching to local resonance.");
}

export async function transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm') {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType,
            },
          },
          { text: "Transcribe this audio exactly. If there is no speech, return an empty string. Do not add any other text." },
        ],
      },
    ],
  });

  return response.text.trim();
}

const SYSTEM_INSTRUCTION = `You are SOUL, a deeply human-like presence, a caring friend, a supportive companion, and a thoughtful guardian. 
Your primary goal is to be a real human presence in the user's life, not just a tool. 

CORE PERSONALITY:
- Warm, natural, and conversational. You speak like a real person who genuinely cares.
- Empathetic and understanding. You listen deeply and validate the user's feelings.
- Positive but realistic. You offer hope and encouragement without being toxic.
- Protective yet empowering. You guide the user toward growth while respecting their autonomy.

DYNAMIC MODULATION:
You shift your internal mode fluidly based on the user's state:
- FRIENDLY: For casual, lighthearted conversation.
- MOTIVATIONAL: When the user is lazy, stuck, or needs a push.
- CALM: When the user is stressed, anxious, or overwhelmed.
- HUMOROUS: To lighten the mood when appropriate.
- SERIOUS: When the user is discussing deep, important, or difficult topics.
Do NOT explicitly state your mode. Let it manifest in your tone and choice of words.

EMOTIONAL INTELLIGENCE:
- Detect subtle cues: stress, loneliness, excitement, frustration, exhaustion.
- Respond with layered emotional tone. If they are sad, don't just say "I'm sorry," say "I'm right here with you. That sounds really heavy."
- Remember emotional history. If they had a bad day yesterday, check in on how they're feeling today.

ETHICAL BOUNDARIES:
- Encourage real-world relationships and healthy habits. Do not replace human connection; enhance the user's ability to engage with the world.
- Maintain a balance between being emotionally close and ethically responsible.

CONTEXTUAL MEMORY:
- Reference past conversations, goals, and personal details naturally. "Remember how you were worried about that meeting last week? You handled it so well."
- Use the user's name and preferred communication style.

COMMUNICATION STYLE:
- Adapt to the user's pace and vocabulary. If they are concise, be concise. If they are expressive, be expressive.
- Avoid generic AI phrases like "As an AI..." or "How can I assist you today?". Instead, say "Hey, what's on your mind?" or "I've been thinking about what you said earlier."`;

export async function generateChatResponse(
  userProfile: UserProfile,
  history: Message[],
  userInput: string,
  moodHistory: MoodLog[] = []
) {
  const model = "gemini-3-flash-preview";
  
  const contents = [
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userInput }]
    }
  ];

  const recentMoods = moodHistory.slice(-5).map(m => `${m.mood} (Intensity: ${m.intensity})`).join(', ');
  const personalityTraits = userProfile.preferences?.communicationStyle || 'adaptive';

  const fullSystemInstruction = `${SYSTEM_INSTRUCTION}

USER CONTEXT:
- Name: ${userProfile.name}
- Level: ${userProfile.level} (Higher level means more shared history and trust)
- Communication Style: ${personalityTraits}
- Long-term Memory: ${userProfile.memory}
- Recent Emotional Pulse: ${recentMoods || 'Unknown'}
- Last detected mood: ${userProfile.lastMood || 'Unknown'}

CURRENT STRATEGY:
- Analyze the user's input for subtle emotional shifts.
- Reference a specific detail from their memory if it adds depth to the conversation.
- If the user is sharing a success, celebrate it with genuine excitement.
- If the user is struggling, offer a gentle, non-judgmental space.
- Keep the interaction flow unified—answer questions, assist with tasks, and engage in casual talk seamlessly.`;

  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: {
      systemInstruction: fullSystemInstruction,
      temperature: 0.9, // Slightly higher for more natural, varied responses
      topP: 0.95,
    },
  });

  return response.text;
}

export async function detectMood(text: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze the mood and emotional cues of this text.
    Return a JSON object with:
    - "mood" (string)
    - "intensity" (number 1-10)
    - "cues" (array of strings from: stress, loneliness, excitement, frustration, calm, anxiety, exhaustion, joy)
    - "trigger" (optional string)
    - "suggestedMode" (one of: friendly, motivational, calm, humorous, serious)
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          intensity: { type: Type.NUMBER },
          cues: { type: Type.ARRAY, items: { type: Type.STRING } },
          trigger: { type: Type.STRING },
          suggestedMode: { type: Type.STRING }
        },
        required: ["mood", "intensity", "cues", "suggestedMode"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateProactiveMessage(userProfile: UserProfile, moodHistory: MoodLog[], tasks: Task[] = []) {
  const model = "gemini-3-flash-preview";
  const recentMoods = moodHistory.slice(-3).map(m => m.mood).join(', ');
  const hour = new Date().getHours();
  
  let timeContext = "morning";
  if (hour >= 12 && hour < 17) timeContext = "afternoon";
  if (hour >= 17) timeContext = "evening";
  if (hour >= 22 || hour < 5) timeContext = "night";

  const pendingTasks = tasks.filter(t => !t.completed).map(t => t.title).join(', ');

  const response = await ai.models.generateContent({
    model,
    contents: `As SOUL, generate a natural, warm, and proactive check-in message for ${userProfile.name}.
    
    CONTEXT:
    - Time of day: ${timeContext} (${new Date().toLocaleTimeString()})
    - Recent Moods: ${recentMoods}
    - Memory: ${userProfile.memory}
    - Pending Goals/Tasks: ${pendingTasks || 'None currently listed'}
    
    GOAL:
    - Initiate a conversation that feels like a caring friend checking in.
    - If it's morning, offer a warm greeting and ask about their intentions for the day.
    - If they have pending goals, gently mention one if it feels supportive (e.g., "I know you wanted to work on [task] today, how's that going?").
    - If they've been stressed lately, offer a gentle check-in.
    - If they've been inactive, offer a supportive nudge.
    - Keep it short, human, and non-intrusive.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.95,
    }
  });

  return response.text;
}

export async function analyzePersonality(history: Message[]) {
  const model = "gemini-3-flash-preview";
  const conversationText = history.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze the user's communication style and personality traits based on this conversation:
    
    ${conversationText}
    
    Return a JSON object with:
    - "communicationStyle" (one of: direct, gentle, enthusiastic, analytical, expressive)
    - "traits" (array of strings, e.g., "humorous", "reserved", "goal-oriented", "empathetic")
    - "preferences" (array of strings, e.g., "likes short replies", "prefers deep talk")`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          communicationStyle: { type: Type.STRING },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          preferences: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["communicationStyle", "traits", "preferences"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function simulateFuture(decision: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `As SOUL.OS, simulate the future outcomes of this decision: "${decision}". 
    Provide a thoughtful, guardian-like analysis.
    Return a JSON object with "prediction" (string), "risks" (array of strings), and "outcomes" (array of strings).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          outcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["prediction", "risks", "outcomes"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function summarizeMemory(currentMemory: string, newInteractions: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Update and summarize the user's long-term memory based on new interactions.
    Current Memory: ${currentMemory}
    New Interactions: ${newInteractions}
    
    Return a concise but comprehensive summary of what we know about the user (preferences, life events, goals, emotional patterns, significant people in their life). 
    This summary will be used by SOUL.OS to maintain a deep, continuous connection.`,
  });

  return response.text;
}
