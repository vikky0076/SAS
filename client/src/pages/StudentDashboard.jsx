import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiCheckCircle, FiClock, FiCamera, FiAlertTriangle, FiSmartphone, FiAward, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { CardSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;

    fetchDashboardData();

    // 1. Subscribe to student's pending/approved/rejected attendance requests for today in real-time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attReqQuery = query(
      collection(db, 'attendanceRequests'),
      where('student._id', '==', user._id),
      where('createdAt', '>=', today.toISOString())
    );

    const unsubRequests = onSnapshot(attReqQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAttendanceRequests(list);
    }, (err) => {
      console.error('Real-time attendance requests subscription error:', err);
    });

    // 2. Subscribe to student's notifications in real-time
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('studentId', '==', user._id)
    );

    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    }, (err) => {
      console.error('Real-time notifications subscription error:', err);
    });

    return () => {
      unsubRequests();
      unsubNotifications();
    };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch student attendance history from Firestore
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('student._id', '==', user._id)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const records = attendanceSnap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side to avoid index creation overhead
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(records.slice(0, 5));

      // 2. Fetch active sessions from Firestore
      const sessionsQuery = query(
        collection(db, 'attendanceSessions'),
        where('active', '==', true)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const now = new Date();
      const activeList = [];

      for (const sessionDoc of sessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const endTime = new Date(sessionData.endTime);
        if (endTime > now) {
          activeList.push({
            _id: sessionDoc.id,
            ...sessionData
          });
        }
      }
      setActiveSessions(activeList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const attendancePercent = user?.attendancePercentage || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Device Warning Block */}
      {!user?.deviceApproved && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 glow-red-border"
        >
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FF3B3B]" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">New or Unapproved Device Detected</h4>
            <p className="text-xs font-medium mt-0.5">
              Your trusted device verification token does not match our records. Attendance marking will remain locked.
            </p>
            <Link to="/device-status" className="inline-block mt-2 text-xs font-bold text-[#FF6B00] hover:underline">
              Request Device Linking / Change Approval →
            </Link>
          </div>
        </motion.div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Score Circular Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6 flex items-center justify-between relative overflow-hidden group"
        >
          <div className="space-y-2 z-10">
            <span className="text-sm font-bold text-slate-500 block">Attendance Score</span>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{attendancePercent}%</h3>
            <p className="text-xs font-bold text-slate-450 mt-1">
              {attendancePercent >= 75 ? "Good standing (above 75%)" : "Warning: Below minimum requirement"}
            </p>
          </div>
          
          {/* Circular progress SVG */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-orange-50"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className={attendancePercent >= 75 ? "stroke-[#FF6B00]" : "stroke-[#FF3B3B]"}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - attendancePercent / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="absolute font-black text-[10px] text-slate-700">
              {attendancePercent}%
            </div>
          </div>
          
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-all duration-500"></div>
        </motion.div>

        {/* Classes Attended Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card p-6 flex items-center justify-between relative overflow-hidden group"
        >
          <div className="space-y-2 z-10">
            <span className="text-sm font-bold text-slate-500 block">Classes Attended</span>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{history.length}</h3>
            <p className="text-xs font-bold text-slate-450 mt-1">Recent registered classes</p>
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF8B3D] flex items-center justify-center text-white shadow-md shadow-orange-500/15 group-hover:scale-110 transition-transform duration-300 z-10">
            <FiCheckCircle className="w-6 h-6" />
          </div>

          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-all duration-500"></div>
        </motion.div>

        {/* Device Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card p-6 flex items-center justify-between relative overflow-hidden group"
        >
          <div className="space-y-2 z-10">
            <span className="text-sm font-bold text-slate-500 block">Device Status</span>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{user?.deviceApproved ? "Approved" : "Blocked"}</h3>
            <p className="text-xs font-bold text-slate-450 mt-1">
              {user?.deviceApproved ? "Secure device bound" : "Action required"}
            </p>
          </div>
          
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${user?.deviceApproved ? 'from-emerald-550 to-teal-500 shadow-emerald-500/15' : 'from-[#FF3B3B] to-[#FF6B6B] shadow-red-500/15'} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300 z-10`}>
            <FiSmartphone className="w-6 h-6" />
          </div>

          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-all duration-500"></div>
        </motion.div>
      </div>      {/* Today's Status Banner */}
      {attendanceRequests.length > 0 && (
        <div className="glass-card p-5 border border-orange-150/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Attendance Status</h3>
            <p className="text-xs text-slate-550 font-semibold mt-0.5">Summary of attendance requests submitted today</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {attendanceRequests.map((req) => (
              <div key={req._id} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-200/50">
                <span className="text-xs font-bold text-slate-700">{req.subject?.code}:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                  req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                  req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Classes Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border border-orange-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <FiBookOpen className="text-[#FF6B00]" />
              <span>Today's Active Classes</span>
            </h3>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-10">
                <FiClock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No active attendance sessions right now</p>
                <p className="text-xs text-slate-400 mt-1">Teachers open sessions during class hours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <motion.div
                    key={session._id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-orange-50/50"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800">{session.subject?.name}</h4>
                      <p className="text-xs font-semibold text-slate-500">{session.subject?.code}</p>
                      <p className="text-[10px] text-[#FF3B3B] font-bold mt-1.5 flex items-center space-x-1">
                        <FiClock className="animate-pulse" />
                        <span>Expires at {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 10px rgba(255, 107, 0, 0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/scan')}
                      disabled={!user?.deviceApproved}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-orange-500/10 transition-all"
                    >
                      <FiCamera />
                      <span>Scan QR Code</span>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Approval Queue */}
          <div className="glass-card p-6 border border-orange-100/50">
            <h3 className="text-lg font-bold text-slate-805 mb-4 flex items-center space-x-2">
              <FiClock className="text-[#FF6B00]" />
              <span>Pending Approval Queue</span>
            </h3>
            {attendanceRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <p className="text-xs font-semibold text-slate-405 py-4 text-center">No pending attendance requests right now.</p>
            ) : (
              <div className="space-y-3">
                {attendanceRequests.filter(r => r.status === 'Pending').map((req) => (
                  <div key={req._id} className="p-3 bg-yellow-50/20 border border-yellow-105/30 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-805 text-sm">{req.subject?.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-500">{req.subject?.code} • Requested at {req.time}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-100 text-yellow-800 uppercase tracking-wide animate-pulse">Awaiting Approval</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History Column */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <div className="glass-card p-6 border border-orange-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <FiAlertTriangle className="text-[#FF6B00]" />
              <span>Real-Time Notifications ({notifications.filter(n => n.status === 'unread').length})</span>
            </h3>
            {notifications.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-6">No notifications yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif._id} className={`p-2.5 rounded-xl border text-xs ${notif.status === 'unread' ? 'bg-orange-50/20 border-orange-100/40 font-bold' : 'bg-slate-50/40 border-slate-100 text-slate-550'}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800">{notif.title}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 border border-orange-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <FiCheckCircle className="text-[#FF6B00]" />
              <span>Recent Activity</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-6">No recent attendance records found.</p>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {history.map((record, index) => (
                    <motion.li 
                      key={record._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="relative pb-8">
                        {index !== history.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-orange-100" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3 items-start group">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors">{record.subject?.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-slate-450">{new Date(record.date).toLocaleDateString()}</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{record.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
