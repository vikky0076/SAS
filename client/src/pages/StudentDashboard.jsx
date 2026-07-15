import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiCheckCircle, FiClock, FiCamera, FiAlertTriangle, FiSmartphone, FiAward, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { CardSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import StatsCard from '../components/StatsCard';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
    }
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
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start space-x-3">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">New or Unapproved Device Detected</h4>
            <p className="text-xs font-medium mt-0.5">
              Your trusted device verification token does not match our records. Attendance marking will remain locked.
            </p>
            <Link to="/device-status" className="inline-block mt-2 text-xs font-bold text-primary-500 hover:underline">
              Request Device Linking / Change Approval →
            </Link>
          </div>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Attendance Score"
          value={`${attendancePercent}%`}
          icon={FiAward}
          colorClass={attendancePercent >= 75 ? "from-emerald-500 to-teal-600" : "from-red-500 to-amber-600"}
          description={attendancePercent >= 75 ? "Good standing (above 75%)" : "Warning: Below minimum requirement"}
        />
        <StatsCard
          title="Classes Attended"
          value={history.length > 0 ? history.length : "0"}
          icon={FiCheckCircle}
          colorClass="from-blue-500 to-indigo-600"
          description="Recent registered classes"
        />
        <StatsCard
          title="Device Status"
          value={user?.deviceApproved ? "Approved" : "Blocked"}
          icon={FiSmartphone}
          colorClass={user?.deviceApproved ? "from-emerald-500 to-teal-600" : "from-red-500 to-amber-600"}
          description={user?.deviceApproved ? "Secure device bound" : "Action required"}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Classes Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2">
              <FiBookOpen className="text-primary-500" />
              <span>Today's Active Classes</span>
            </h3>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-10">
                <FiClock className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No active attendance sessions right now</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Teachers open sessions during class hours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session._id}
                    className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200">{session.subject?.name}</h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{session.subject?.code}</p>
                      <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center space-x-1">
                        <FiClock className="animate-pulse" />
                        <span>Expires at {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/scan')}
                      disabled={!user?.deviceApproved}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-primary-500/10 transition-all"
                    >
                      <FiCamera />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History Column */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2">
              <FiCheckCircle className="text-primary-500" />
              <span>Recent Activity</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center py-6">No recent attendance records found.</p>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {history.map((record, index) => (
                    <li key={record._id}>
                      <div className="relative pb-8">
                        {index !== history.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 flex items-center justify-center">
                              <FiCheckCircle className="w-5 h-5" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.subject?.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-slate-450 dark:text-slate-500">{new Date(record.date).toLocaleDateString()}</span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{record.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
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
