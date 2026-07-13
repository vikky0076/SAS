import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { 
  Users, CheckCircle, Clock, BookOpen, UserCheck, ShieldAlert,
  Download, RefreshCw, AlertCircle, Play, Check, X, Calendar, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'devices', 'reports'

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Session states
  const [activeSession, setActiveSession] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [liveAttendees, setLiveAttendees] = useState([]);
  const [sessionCountdown, setSessionCountdown] = useState(0); // in seconds
  const [qrRotationCountdown, setQrRotationCountdown] = useState(30); // in seconds

  // Session create form
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState(5); // defaults to 5 minutes

  // Report states
  const [selectedReportSubject, setSelectedReportSubject] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Interval references
  const livePollRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const qrRotateIntervalRef = useRef(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subjects linked to this teacher
      // Since subjects are linked to teacher ID, we can get them from the global subject API or custom endpoint
      // We'll query a global subjects endpoint and filter by teacher, or fetch from teacher-scoped route
      // Let's create an endpoint GET /api/admin/subjects, but since we are a teacher, we can hit a teacher route
      // Wait, we can get teacher sessions and subjects. Let's get subjects:
      const subRes = await api.get('/admin/subjects'); // Since admin has CRUD, let's filter in frontend or backend
      const filteredSubjects = subRes.data.subjects.filter(s => s.teacher?._id === user?._id);
      setSubjects(filteredSubjects);
      if (filteredSubjects.length > 0) {
        setSelectedSubject(filteredSubjects[0]._id);
        setSelectedReportSubject(filteredSubjects[0]._id);
      }

      // 2. Fetch Sessions
      const sessRes = await api.get('/attendance/teacher-sessions');
      setSessions(sessRes.data.sessions);
      
      // Check if there is an active session currently running
      const running = sessRes.data.sessions.find(s => s.active && new Date(s.endTime) > new Date());
      if (running) {
        resumeSession(running);
      }

      // 3. Fetch Device Requests
      const reqRes = await api.get('/device/requests');
      setDeviceRequests(reqRes.data.requests);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    return () => clearIntervals();
  }, []);

  const clearIntervals = () => {
    if (livePollRef.current) clearInterval(livePollRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (qrRotateIntervalRef.current) clearInterval(qrRotateIntervalRef.current);
  };

  // Resume Session UI after refreshing or on load
  const resumeSession = (session) => {
    setActiveSession(session);
    setActiveTab('dashboard');
    generateQrCode(session.qrToken);
    
    // Calculate remaining seconds
    const remainingMs = new Date(session.endTime).getTime() - Date.now();
    setSessionCountdown(Math.max(0, Math.floor(remainingMs / 1000)));

    // Start countdown
    startCountdownTimer();
    // Start QR rotation checking and live attendees polling
    startLivePolling(session._id);
    startQrRotation(session._id);
  };

  // Start Attendance Session
  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      return toast.error('Please create/select a subject first');
    }

    setLoading(true);
    try {
      const res = await api.post('/attendance/start-session', {
        subjectId: selectedSubject,
        duration: Number(duration)
      });
      
      const session = res.data.session;
      toast.success('Attendance session started!');
      resumeSession(session);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR Code data URL
  const generateQrCode = async (token) => {
    try {
      const url = await QRCode.toDataURL(token, { width: 300, margin: 2 });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR', err);
    }
  };

  // Timers and Polling
  const startCountdownTimer = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setSessionCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          clearIntervals();
          setActiveSession(null);
          fetchInitialData();
          toast.error('Session has expired.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startQrRotation = (sessionId) => {
    if (qrRotateIntervalRef.current) clearInterval(qrRotateIntervalRef.current);
    setQrRotationCountdown(30);
    qrRotateIntervalRef.current = setInterval(async () => {
      setQrRotationCountdown((prev) => {
        if (prev <= 1) {
          // Trigger backend QR token rotation
          rotateSessionQr(sessionId);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const rotateSessionQr = async (sessionId) => {
    try {
      const res = await api.post(`/attendance/rotate-qr/${sessionId}`);
      generateQrCode(res.data.qrToken);
    } catch (err) {
      console.error('QR rotation error:', err);
    }
  };

  const startLivePolling = (sessionId) => {
    if (livePollRef.current) clearInterval(livePollRef.current);
    
    const poll = async () => {
      try {
        const res = await api.get(`/attendance/live/${sessionId}`);
        setLiveAttendees(res.data.records);
      } catch (err) {
        console.error('Live polling error:', err);
      }
    };
    poll(); // run immediately once
    livePollRef.current = setInterval(poll, 3000); // poll every 3 seconds
  };

  // Device Approvals
  const handleApproveDevice = async (requestId) => {
    try {
      await api.post(`/device/approve/${requestId}`);
      toast.success('Device request approved successfully!');
      // Refresh requests list
      const res = await api.get('/device/requests');
      setDeviceRequests(res.data.requests);
    } catch (err) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectDevice = async (requestId) => {
    try {
      await api.post(`/device/reject/${requestId}`);
      toast.success('Device request rejected');
      // Refresh requests
      const res = await api.get('/device/requests');
      setDeviceRequests(res.data.requests);
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  // Fetch Report Data
  const handleFetchReport = async () => {
    if (!selectedReportSubject) return;
    setLoadingReport(true);
    try {
      const res = await api.get(`/attendance/report/${selectedReportSubject}`);
      setReportData(res.data.report);
    } catch (err) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoadingReport(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (reportData.length === 0) return toast.error('No records to export');
    
    // Construct CSV String
    const headers = ['Student Name', 'Register Number', 'Email', 'Department', 'Year', 'Date', 'Time', 'Status'];
    const rows = reportData.map(r => [
      r.studentName,
      `"${r.registerNumber}"`, // escape quotes for security
      r.email,
      r.department,
      r.year,
      r.date,
      r.time,
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${selectedReportSubject}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported successfully!');
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-400" />
              <span className="ml-2 font-bold tracking-wider text-lg">TEACHER PORTAL</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-300">Welcome, Prof. {user?.name}</span>
              <button 
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mb-8">
          {['dashboard', 'devices', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-6 text-sm font-medium capitalize border-b-2 transition-all ${
                activeTab === tab 
                  ? 'border-primary-500 text-primary-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'devices' ? `Device Approvals (${deviceRequests.length})` : tab}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {activeSession ? (
                /* LIVE SESSION VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* QR Code Card */}
                  <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-bold mb-1">Dynamic Attendance QR</h3>
                    <p className="text-xs text-gray-400 mb-6">Rotates every 30 seconds to prevent sharing</p>

                    <div className="overflow-hidden rounded-xl bg-white p-3 mb-6 shadow-2xl">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Session QR Code" className="h-60 w-60 object-contain" />
                      ) : (
                        <div className="h-60 w-60 animate-pulse bg-gray-200" />
                      )}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4">
                      {/* Timer 1: QR Rotations */}
                      <div className="bg-black/35 rounded-xl border border-white/5 p-3">
                        <span className="block text-[10px] text-gray-500 uppercase font-bold">QR Rotates In</span>
                        <span className="text-xl font-extrabold text-amber-400 mt-1 flex items-center justify-center gap-1">
                          <RefreshCw size={16} className="animate-spin" /> {qrRotationCountdown}s
                        </span>
                      </div>
                      
                      {/* Timer 2: Session Countdown */}
                      <div className="bg-black/35 rounded-xl border border-white/5 p-3">
                        <span className="block text-[10px] text-gray-500 uppercase font-bold">Session Closes In</span>
                        <span className="text-xl font-extrabold text-primary-400 mt-1 flex items-center justify-center gap-1">
                          <Clock size={16} /> {formatTime(sessionCountdown)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendees Live Stats */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                      <div>
                        <h3 className="text-lg font-bold">Live Check-ins</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Polling updates automatically in real-time</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-emerald-400">{liveAttendees.length}</span>
                        <span className="block text-[10px] text-gray-500 uppercase font-bold">Students Present</span>
                      </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto pr-2 space-y-3">
                      {liveAttendees.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                          <Activity size={32} className="mx-auto mb-3 animate-pulse text-gray-600" />
                          Waiting for students to check in...
                        </div>
                      ) : (
                        liveAttendees.map((att, i) => (
                          <div key={att._id} className="flex items-center justify-between bg-black/25 border border-white/5 rounded-xl p-3.5 hover:bg-black/40 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                {i + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">{att.student?.name}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">{att.student?.registerNumber} • {att.student?.department}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Present
                              </span>
                              <span className="block text-[9px] text-gray-500 mt-1">Checked in at {att.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* START SESSION FORM */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Form Card */}
                  <div className="md:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Play size={18} className="text-primary-400" /> Start Attendance
                    </h3>
                    <form onSubmit={handleStartSession} className="space-y-4">
                      {/* Subject Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Class</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none text-gray-300 transition-all focus:border-primary-500 focus:bg-white/10"
                        >
                          {subjects.map((sub) => (
                            <option key={sub._id} className="bg-[#0f172a]" value={sub._id}>
                              {sub.name} ({sub.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Duration Input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Session Duration: {duration} mins
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                          <span>1 min</span>
                          <span>15 mins</span>
                          <span>30 mins</span>
                        </div>
                      </div>

                      {/* Launch Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 flex items-center justify-center rounded-lg bg-primary-600 py-3 text-xs font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 disabled:opacity-50"
                      >
                        Generate Dynamic QR Code
                      </button>
                    </form>
                  </div>

                  {/* Past Sessions List */}
                  <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Calendar size={18} className="text-primary-400" /> Past Sessions
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                          <tr>
                            <th className="px-6 py-3 rounded-l-lg">Subject</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Closed At</th>
                            <th className="px-6 py-3 rounded-r-lg">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.slice(0, 5).map((s) => (
                            <tr key={s._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                              <td className="px-6 py-4 font-semibold">{s.subject?.name}</td>
                              <td className="px-6 py-4">{new Date(s.startTime).toLocaleDateString()}</td>
                              <td className="px-6 py-4">{new Date(s.endTime).toLocaleTimeString()}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-gray-400 border border-white/10">
                                  Closed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Trusted Device Approval Requests</h3>
                <span className="text-xs text-gray-400">Pending: {deviceRequests.length}</span>
              </div>

              {deviceRequests.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  <CheckCircle size={32} className="mx-auto mb-3 text-emerald-500" />
                  All device change requests have been approved!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deviceRequests.map((req) => (
                    <div key={req._id} className="rounded-xl border border-white/5 bg-black/25 p-5 flex items-center justify-between hover:bg-black/40 transition-all">
                      <div>
                        <h4 className="font-semibold text-base">{req.student?.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{req.student?.registerNumber} • {req.student?.department} • {req.student?.year}</p>
                        <p className="text-[10px] text-gray-500 mt-2">Requested: {new Date(req.requestedTime).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectDevice(req._id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleApproveDevice(req._id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold">Attendance Records</h3>
                  <select
                    value={selectedReportSubject}
                    onChange={(e) => setSelectedReportSubject(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0f172a] py-1.5 px-3 text-xs outline-none text-gray-300 transition-all focus:border-primary-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleFetchReport}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary-700"
                  >
                    Load Report
                  </button>
                </div>
                {reportData.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
                  >
                    <Download size={14} /> Export CSV (Excel)
                  </button>
                )}
              </div>

              {loadingReport ? (
                <div className="flex py-12 justify-center items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary-500"></div>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  <BookOpen size={32} className="mx-auto mb-3 text-gray-600" />
                  Select a subject and click "Load Report" to preview attendance lists.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                      <tr>
                        <th className="px-6 py-3 rounded-l-lg">Student Name</th>
                        <th className="px-6 py-3">Register Number</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Year</th>
                        <th className="px-6 py-3">Checked In At</th>
                        <th className="px-6 py-3 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="px-6 py-4 font-semibold">{r.studentName}</td>
                          <td className="px-6 py-4">{r.registerNumber}</td>
                          <td className="px-6 py-4">{r.department}</td>
                          <td className="px-6 py-4">{r.year}</td>
                          <td className="px-6 py-4">{r.date} {r.time}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                              Present
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
