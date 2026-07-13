import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  User, CheckCircle, Clock, Percent, Shield, AlertTriangle, 
  Camera, Eye, LogOut, Calendar, GraduationCap, ChevronRight, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDashboard() {
  const { user, logout, requestDeviceChange } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'scan', 'history'
  
  // Data States
  const [history, setHistory] = useState([]);
  const [deviceApproved, setDeviceApproved] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingDeviceRequest, setSubmittingDeviceRequest] = useState(false);

  // Scanner States
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState('');

  // Fetch Attendance History and Profile
  const fetchStudentData = async () => {
    setLoadingHistory(true);
    try {
      // 1. Fetch History
      const res = await api.get('/attendance/student-history');
      setHistory(res.data.history);

      // 2. We can check the actual device approval status on the server
      const savedUser = JSON.parse(localStorage.getItem('user'));
      // Find current status from DB (simulate via mock or get latest)
      // To get latest status, let's fetch it or let our AuthContext handle it
      // Let's assume the user object is synced or fetch latest profile
      // In this setup we can get the student object directly by requesting it
      const currentToken = localStorage.getItem('trustedDeviceToken');
      // If we don't have user.trustedDeviceToken or they mismatched, we can verify
      setDeviceApproved(user?.deviceApproved);
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync student record');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Handle Scanning QR
  useEffect(() => {
    let scanner = null;
    if (activeTab === 'scan' && scannerActive) {
      scanner = new Html5QrcodeScanner(
        'qr-reader', 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccess = async (decodedText) => {
        setScanResult(decodedText);
        setScannerActive(false);
        if (scanner) {
          scanner.clear().catch(err => console.error("Error clearing scanner", err));
        }

        // Submit attendance mark
        toast.promise(
          api.post('/attendance/mark', { 
            qrToken: decodedText,
            deviceId: localStorage.getItem('trustedDeviceToken') 
          }),
          {
            loading: 'Verifying QR code & marking attendance...',
            success: (res) => {
              fetchStudentData();
              setActiveTab('dashboard');
              return res.data.message || 'Attendance marked present!';
            },
            error: (err) => err.response?.data?.message || 'Failed to mark attendance'
          }
        );
      };

      const onScanFailure = (error) => {
        // quiet fail is standard for html5-qrcode
      };

      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Error clearing scanner on unmount", err));
      }
    };
  }, [activeTab, scannerActive]);

  // Request Device Change
  const handleRequestDeviceChange = async () => {
    setSubmittingDeviceRequest(true);
    try {
      const newToken = crypto.randomUUID();
      await requestDeviceChange(newToken);
      localStorage.setItem('trustedDeviceToken', newToken);
      setDeviceApproved(false);
      toast.success('Device change request submitted. Please wait for teacher approval.');
    } catch (err) {
      toast.error(err || 'Failed to submit request');
    } finally {
      setSubmittingDeviceRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-400" />
              <span className="ml-2 font-bold tracking-wider text-lg">COLLEGE SMART ATTENDANCE</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Profile GlassCard */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-sm text-gray-400">{user?.registerNumber} • {user?.department} • {user?.year}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Trusted Device Status Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {deviceApproved ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle size={14} /> Trusted Device Active
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1.5 text-xs font-medium text-amber-400">
                  <AlertTriangle size={14} /> Device Pending Approval
                </div>
                <button
                  onClick={handleRequestDeviceChange}
                  disabled={submittingDeviceRequest}
                  className="text-left text-xs text-primary-400 hover:underline font-semibold"
                >
                  Request New Device Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mb-8">
          {['dashboard', 'scan', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'scan') setScannerActive(true);
                else setScannerActive(false);
              }}
              className={`pb-4 px-6 text-sm font-medium capitalize border-b-2 transition-all ${
                activeTab === tab 
                  ? 'border-primary-500 text-primary-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'scan' ? 'Scan QR Code' : tab}
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
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Stat card 1: Percentage */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">Attendance Rate</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Percent size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{user?.attendancePercentage || 0}%</h3>
                  <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${user?.attendancePercentage || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Calculated from total completed sessions</p>
                </div>
              </div>

              {/* Stat card 2: Total Classes */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">Classes Attended</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{history.length}</h3>
                  <p className="text-xs text-gray-400 mt-4">Total present records saved</p>
                </div>
              </div>

              {/* Quick Actions / Today's status */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">Quick QR Scan</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    <Camera size={18} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Scan dynamic QR generated by your teacher to mark attendance.</p>
                  <button
                    onClick={() => {
                      setActiveTab('scan');
                      setScannerActive(true);
                    }}
                    disabled={!deviceApproved}
                    className="w-full mt-4 flex items-center justify-center rounded-lg bg-primary-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 disabled:opacity-50"
                  >
                    {!deviceApproved ? 'Attendance Blocked' : 'Start Camera Scan'}
                  </button>
                </div>
              </div>

              {/* Recent Attendance List (Full Width) */}
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-primary-400" /> Recent Attendance Logs
                </h3>
                {loadingHistory ? (
                  <div className="flex py-8 justify-center items-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary-500"></div>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">No attendance logs found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-6 py-3 rounded-l-lg">Subject</th>
                          <th className="px-6 py-3">Subject Code</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3 rounded-r-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 5).map((log) => (
                          <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                            <td className="px-6 py-4 font-semibold">{log.subject?.name}</td>
                            <td className="px-6 py-4">{log.subject?.code}</td>
                            <td className="px-6 py-4">{new Date(log.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{log.time}</td>
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
              </div>
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center"
            >
              <h3 className="text-lg font-bold mb-2">QR Code Scanner</h3>
              <p className="text-xs text-gray-400 mb-6">
                Grant camera permission and hold the dynamic QR code generated by the teacher in front of the camera.
              </p>

              {!deviceApproved ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
                  <AlertTriangle className="mx-auto mb-3" size={32} />
                  <h4 className="font-bold">Attendance Blocked</h4>
                  <p className="text-xs text-red-300 mt-2">
                    Your current browser token does not match the database trusted device. 
                    Please return to dashboard and request a Device Change.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl bg-black/35 border border-white/5 p-2">
                  {scannerActive ? (
                    <div id="qr-reader" className="w-full"></div>
                  ) : (
                    <div className="py-12 flex flex-col items-center">
                      <CheckCircle className="text-emerald-400 mb-3 animate-bounce" size={48} />
                      <p className="text-sm font-semibold">Ready to Scan</p>
                      <button
                        onClick={() => setScannerActive(true)}
                        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold hover:bg-primary-700"
                      >
                        Activate Camera
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Full Attendance History</h3>
                <span className="text-xs text-gray-400">Total logs: {history.length}</span>
              </div>

              {loadingHistory ? (
                <div className="flex py-12 justify-center items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary-500"></div>
                </div>
              ) : history.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center animate-pulse">No attendance logs recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                      <tr>
                        <th className="px-6 py-3 rounded-l-lg">Subject</th>
                        <th className="px-6 py-3">Subject Code</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Time</th>
                        <th className="px-6 py-3 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log) => (
                        <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="px-6 py-4 font-semibold">{log.subject?.name}</td>
                          <td className="px-6 py-4">{log.subject?.code}</td>
                          <td className="px-6 py-4">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{log.time}</td>
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
