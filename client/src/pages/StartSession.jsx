import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { FiPlay, FiBook, FiClock, FiUsers, FiRefreshCw, FiStopCircle, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StartSession = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Setup fields
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(10); // Minutes
  const [starting, setStarting] = useState(false);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [liveCheckins, setLiveCheckins] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  // Timers and references
  const rotationIntervalRef = useRef(null);
  const checkinsUnsubscribeRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchSubjects();
    }
    return () => {
      clearAllTimers();
    };
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const q = query(collection(db, 'subjects'), where('teacher._id', '==', user._id));
      const res = await getDocs(q);
      const list = res.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setSubjects(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load subjects list');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTimers = () => {
    if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
    if (checkinsUnsubscribeRef.current) {
      checkinsUnsubscribeRef.current();
      checkinsUnsubscribeRef.current = null;
    }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!subjectId || !duration) {
      return toast.error('Please select subject and duration');
    }

    setStarting(true);
    try {
      // 1. Close any other active sessions for this subject
      const activeQuery = query(
        collection(db, 'attendanceSessions'),
        where('subject._id', '==', subjectId),
        where('active', '==', true)
      );
      const activeSnap = await getDocs(activeQuery);
      for (const d of activeSnap.docs) {
        await updateDoc(doc(db, 'attendanceSessions', d.id), { active: false });
      }

      // 2. Fetch subject details
      const subjectRef = doc(db, 'subjects', subjectId);
      const subjectSnap = await getDoc(subjectRef);
      if (!subjectSnap.exists()) {
        throw new Error('Subject not found');
      }
      const subjectData = subjectSnap.data();

      // 3. Create session parameters
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60 * 1000);
      const initialToken = crypto.randomUUID();

      const docRef = await addDoc(collection(db, 'attendanceSessions'), {
        subject: {
          _id: subjectId,
          name: subjectData.name,
          code: subjectData.code
        },
        qrToken: initialToken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        active: true
      });

      const session = {
        _id: docRef.id,
        subject: { _id: subjectId, name: subjectData.name, code: subjectData.code },
        qrToken: initialToken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        active: true
      };

      toast.success('Attendance session started successfully!');
      setActiveSession(session);
      
      const secondsRemaining = Math.max(0, Math.floor((endTime - new Date()) / 1000));
      setTimeLeft(secondsRemaining);

      // Generate QR code for first token
      generateQRCode(session._id, session.qrToken);

      // Setup timers
      setupSessionTimers(session);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const generateQRCode = async (sessionId, qrToken) => {
    try {
      const qrData = JSON.stringify({ sessionId, qrToken });
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR', err);
    }
  };

  const setupSessionTimers = (session) => {
    clearAllTimers();

    // 1. Rotation Timer (Every 30 seconds)
    rotationIntervalRef.current = setInterval(async () => {
      try {
        const sessionRef = doc(db, 'attendanceSessions', session._id);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) throw new Error('Session not found');

        const sessionData = sessionSnap.data();
        const now = new Date();
        if (!sessionData.active || now > new Date(sessionData.endTime)) {
          await updateDoc(sessionRef, { active: false });
          throw new Error('Session has expired or is inactive');
        }

        const newQrToken = crypto.randomUUID();
        await updateDoc(sessionRef, { qrToken: newQrToken });
        generateQRCode(session._id, newQrToken);
      } catch (error) {
        console.error('Failed to rotate QR Token', error);
        handleEndSession(true);
      }
    }, 30000);

    // 2. Real-time Check-ins subscription (replaces polling interval)
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('session', '==', session._id)
    );
    checkinsUnsubscribeRef.current = onSnapshot(attendanceQuery, (snap) => {
      const records = snap.docs.map(d => ({
        _id: d.id,
        ...d.data()
      }));
      // Sort in descending order of time on the client side
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLiveCheckins(records);
    }, (err) => {
      console.error('Check-ins subscription error:', err);
    });

    // 3. Countdown Timer (Every second)
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEndSession = async (isAutomatic = false) => {
    if (!activeSession) return;
    
    if (!isAutomatic) {
      if (!window.confirm('Are you sure you want to end this attendance marking session?')) return;
    }

    try {
      await updateDoc(doc(db, 'attendanceSessions', activeSession._id), { active: false });
      toast.success(isAutomatic ? 'Session completed automatically!' : 'Session ended manually!');
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      clearAllTimers();
      setActiveSession(null);
      setQrCodeUrl('');
      setLiveCheckins([]);
      setTimeLeft(0);
    }
  };

  // Helper to format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="max-w-md mx-auto">
          <div className="glass-card p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-350 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence mode="wait">
        {!activeSession ? (
          // STEP 1: Launch Form
          <motion.div
            key="start-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <FiPlay className="text-primary-500" />
                <span>Start Live Session</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Generate rotating QR code for secure attendance</p>
            </div>

            <div className="glass-card p-6">
              <form onSubmit={handleStartSession} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center space-x-1">
                    <FiBook />
                    <span>Select Subject</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="glass-input w-full text-sm appearance-none"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center space-x-1">
                    <FiClock />
                    <span>Session Duration (Minutes)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 10"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={starting}
                  className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-650 text-white font-bold text-sm shadow-lg shadow-primary-500/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
                >
                  <FiPlay />
                  <span>{starting ? 'Starting Session...' : 'Launch Attendance Session'}</span>
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          // STEP 2: Live Rotation Page
          <motion.div
            key="live-session"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left QR Column */}
            <div className="lg:col-span-1 space-y-6 flex flex-col items-center">
              <div className="w-full">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span>Live Attendance Board</span>
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class is active and accepting check-ins</p>
              </div>

              <div className="glass-card p-6 flex flex-col items-center justify-center w-full space-y-6">
                <div className="w-full text-center space-y-1.5">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{liveCheckins[0]?.subject?.name || 'Class Subject'}</h3>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-600 dark:text-red-400 text-xs font-bold">
                    <FiClock className="animate-spin" />
                    <span>Time Left: {formatTime(timeLeft)}</span>
                  </div>
                </div>

                {qrCodeUrl ? (
                  <motion.div
                    animate={{ rotate: [0, 360], transition: { duration: 0.5, ease: 'easeOut' } }}
                    key={qrCodeUrl}
                    className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-64 h-64 flex items-center justify-center"
                  >
                    <img src={qrCodeUrl} alt="Active QR Code" className="w-full h-full" />
                  </motion.div>
                ) : (
                  <div className="w-64 h-64 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400">
                    Generating code...
                  </div>
                )}

                <div className="w-full space-y-2">
                  <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">QR Code Token Rotates in:</p>
                  {/* Visual Progress ring/bar for rotation */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      key={qrCodeUrl}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 30, ease: 'linear' }}
                      className="bg-primary-500 h-full"
                    ></motion.div>
                  </div>
                </div>

                <button
                  onClick={() => handleEndSession(false)}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/15 flex items-center justify-center space-x-2 transition-all"
                >
                  <FiStopCircle />
                  <span>End Session Manually</span>
                </button>
              </div>
            </div>

            {/* Right Live Feed Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center space-x-2">
                    <FiUsers className="text-primary-550" />
                    <span>Real-time Check-ins ({liveCheckins.length})</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">Live feed polling</span>
                  </div>
                </div>

                {liveCheckins.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-450">
                    <FiUsers className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-bounce mb-2" />
                    <p className="text-sm font-semibold">Waiting for students to check in</p>
                    <p className="text-xs text-slate-400 mt-0.5">Students must scan the QR code displayed on this screen.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {liveCheckins.map((rec) => (
                        <div key={rec._id} className="py-3 flex items-center justify-between hover:bg-slate-55/20 dark:hover:bg-slate-900/10 px-2 rounded-lg transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-850 dark:text-slate-250">{rec.student?.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-500">{rec.student?.registerNumber} • Dept: {rec.student?.department} • Year: {rec.student?.year}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                              <FiCheckCircle />
                              <span>{rec.time}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartSession;
