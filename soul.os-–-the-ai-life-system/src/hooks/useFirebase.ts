import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, Task, MoodLog, Message } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const formatData = (data: any) => {
    const formatted = { ...data };
    for (const key in formatted) {
      if (formatted[key] instanceof Timestamp) {
        formatted[key] = formatted[key].toDate().toISOString();
      }
    }
    return formatted;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          // Sync Profile
          const profileRef = doc(db, 'users', u.uid);
          try {
            const profileSnap = await getDoc(profileRef);
            
            if (!profileSnap.exists()) {
              const newProfile: any = {
                uid: u.uid,
                name: u.displayName || 'User',
                experience: 0,
                level: 1,
                memory: '',
                createdAt: serverTimestamp()
              };
              try {
                await setDoc(profileRef, newProfile);
                setProfile(formatData(newProfile));
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, `users/${u.uid}`);
              }
            }
          } catch (error) {
            // Only handle if it wasn't already handled by the inner catch
            if (error instanceof Error && error.message.includes('Firestore Error')) {
              console.error(error);
            } else {
              handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
            }
          }

          const unsubProfile = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) setProfile(formatData(doc.data()) as UserProfile);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          });

          // Sync Tasks
          const tasksPath = `users/${u.uid}/tasks`;
          const tasksQuery = query(collection(db, tasksPath), orderBy('createdAt', 'desc'));
          const unsubTasks = onSnapshot(tasksQuery, (snap) => {
            setTasks(snap.docs.map(d => ({ id: d.id, ...formatData(d.data()) } as Task)));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, tasksPath);
          });

          // Sync Mood Logs
          const moodPath = `users/${u.uid}/moodLogs`;
          const moodQuery = query(collection(db, moodPath), orderBy('timestamp', 'desc'), limit(10));
          const unsubMood = onSnapshot(moodQuery, (snap) => {
            setMoodLogs(snap.docs.map(d => ({ id: d.id, ...formatData(d.data()) } as MoodLog)));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, moodPath);
          });

          // Sync Messages
          const msgPath = `users/${u.uid}/conversations`;
          const msgQuery = query(collection(db, msgPath), orderBy('timestamp', 'desc'), limit(50));
          const unsubMsg = onSnapshot(msgQuery, (snap) => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...formatData(d.data()) } as Message)).reverse());
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, msgPath);
          });

          return () => {
            unsubProfile();
            unsubTasks();
            unsubMood();
            unsubMsg();
          };
        } else {
          setProfile(null);
          setTasks([]);
          setMoodLogs([]);
          setMessages([]);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const addTask = async (task: Partial<Task>) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks`;
    try {
      await addDoc(collection(db, path), {
        ...task,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${taskId}`;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try {
      await updateDoc(taskRef, { completed });
      
      if (completed && profile) {
        // Award XP
        const task = tasks.find(t => t.id === taskId);
        const xpReward = task?.xpReward || 10;
        const newXp = profile.experience + xpReward;
        const newLevel = Math.floor(newXp / 100) + 1;
        await updateDoc(doc(db, 'users', user.uid), {
          experience: newXp,
          level: newLevel
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/tasks`, taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addMoodLog = async (mood: string, intensity: number, trigger?: string, cues?: string[]) => {
    if (!user) return;
    const path = `users/${user.uid}/moodLogs`;
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        mood,
        intensity,
        trigger,
        cues: cues || [],
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', user.uid), { lastMood: mood });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    const path = `users/${user.uid}/conversations`;
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        role,
        content,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateMemory = async (newMemory: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { memory: newMemory });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return {
    user,
    profile,
    tasks,
    moodLogs,
    messages,
    loading,
    login,
    logout,
    addTask,
    toggleTask,
    deleteTask,
    addMoodLog,
    addMessage,
    updateMemory,
    updateProfile
  };
}
