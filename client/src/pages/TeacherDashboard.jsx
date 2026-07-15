import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiPlay, FiBook, FiSmartphone, FiUsers, FiCheck, FiX, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { StatsSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import StatsCard from '../components/StatsCard';
import { motion } from 'framer-motion';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch subjects taught by the teacher
      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('teacher._id', '==', user._id)
      );
      const subjectsSnap = await getDocs(subjectsQuery);
      const subjectsList = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const subjectIds = subjectsList.map(s => s.id);

      let totalSessions = 0;
      let totalAttendanceRecords = 0;
      let subjectWiseStats = [];

      if (subjectIds.length > 0) {
        // Query sessions for teacher's subjects
        const sessionsQuery = query(
          collection(db, 'attendanceSessions'),
          where('subject._id', 'in', subjectIds)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionsList = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        totalSessions = sessionsList.length;

        // Query attendance records for teacher's subjects
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('subject._id', 'in', subjectIds)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        const attendanceList = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        totalAttendanceRecords = attendanceList.length;

        // Compile subject analytics
        subjectWiseStats = subjectsList.map(subj => {
          const subjSessions = sessionsList.filter(s => s.subject?._id === subj.id).length;
          const subjAttendance = attendanceList.filter(a => a.subject?._id === subj.id).length;
          return {
            id: subj.id,
            name: subj.name,
            code: subj.code,
            sessions: subjSessions,
            attendance: subjAttendance
          };
        });
      }

      setStats({
        totalSessions,
        totalAttendanceRecords,
        subjectWiseStats
      });

      // 2. Fetch pending device requests from Firestore
      const requestsQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'Pending')
      );
      const requestsSnap = await getDocs(requestsQuery);
      const reqs = requestsSnap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      reqs.sort((a, b) => new Date(b.requestedTime) - new Date(a.requestedTime));
      setDeviceRequests(reqs.slice(0, 5));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceAction = async (requestId, status) => {
    setActionLoading(true);
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        await updateDoc(requestRef, { status });
        
        if (status === 'Approved') {
          const studentRef = doc(db, 'students', requestData.student._id);
          await updateDoc(studentRef, {
            trustedDeviceToken: requestData.newToken,
            deviceApproved: true
          });
        }
        
        toast.success(`Device request ${status.toLowerCase()} successfully!`);
        setDeviceRequests(deviceRequests.filter(r => r._id !== requestId));
        fetchDashboardData(); // Refresh stats and list
      }
    } catch (error) {
      console.error('Device action failed:', error);
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <StatsSkeleton />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Welcome */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 capitalize">Welcome back, Prof. {user?.name}</h2>
        <p className="text-xs font-semibold text-slate-500">Department of {user?.department || 'N/A'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Active Sessions"
          value={stats?.totalSessions || "0"}
          icon={FiPlay}
          colorClass="from-[#FF6B00] to-[#FF8B3D] shadow-orange-500/15"
          description="Total sessions created"
        />
        <StatsCard
          title="Attendance Log Count"
          value={stats?.totalAttendanceRecords || "0"}
          icon={FiUsers}
          colorClass="from-[#FF3B3B] to-[#FF6B6B] shadow-red-500/15"
          description="Total student check-ins"
        />
        <StatsCard
          title="Pending Device Requests"
          value={deviceRequests.length}
          icon={FiSmartphone}
          colorClass={deviceRequests.length > 0 ? "from-[#FF3B3B] to-[#FF8B3D] animate-pulse" : "from-slate-400 to-slate-500"}
          description="Awaiting your approval"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Stats Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border border-orange-100/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-805 flex items-center space-x-2">
                <FiBook className="text-[#FF6B00]" />
                <span>Subject Analytics</span>
              </h3>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 12px rgba(255, 107, 0, 0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/start-session')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/10 transition-all"
              >
                <FiPlay className="w-3.5 h-3.5" />
                <span>Start Class Session</span>
              </motion.button>
            </div>

            {(!stats?.subjectWiseStats || stats.subjectWiseStats.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-sm font-semibold text-slate-500">No subjects registered yet.</p>
                <Link to="/subjects" className="text-xs text-[#FF6B00] font-bold hover:underline mt-2 inline-block">Create one now →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/50 border-b border-orange-100/50">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Code</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Sessions</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Checkins</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100/30">
                    {stats.subjectWiseStats.map((subj) => (
                      <tr key={subj.id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{subj.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-500">{subj.code}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-slate-800">{subj.sessions}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-slate-600">{subj.attendance}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link to={`/reports?subjectId=${subj.id}`} className="inline-flex items-center text-[#FF6B00] hover:text-[#FF3B3B] font-bold space-x-1 transition-colors">
                            <FiFileText />
                            <span>Export</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pending Device Requests Column */}
        <div>
          <div className="glass-card p-6 border border-orange-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <FiSmartphone className="text-[#FF6B00]" />
              <span>Pending Device Resets</span>
            </h3>

            {deviceRequests.length === 0 ? (
              <div className="text-center py-10">
                <FiCheckCircle className="w-12 h-12 text-emerald-500/10 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-550">All devices in sync!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No students are currently locked out.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deviceRequests.map((req) => (
                  <div key={req._id} className="p-3 bg-orange-50/20 border border-orange-100/35 rounded-xl space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{req.student?.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-500">{req.student?.registerNumber} • Dept: {req.student?.department} • Year: {req.student?.year}</p>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeviceAction(req._id, 'Approved')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <FiCheck />
                        <span>Approve</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeviceAction(req._id, 'Rejected')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-[#FF3B3B] hover:bg-red-650 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <FiX />
                        <span>Reject</span>
                      </motion.button>
                    </div>
                  </div>
                ))}
                {deviceRequests.length >= 5 && (
                  <Link to="/device-requests" className="text-xs font-bold text-[#FF6B00] hover:underline block text-center mt-2">View all requests →</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
