import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiPlay, FiBook, FiSmartphone, FiUsers, FiCheck, FiX, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { StatsSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import StatsCard from '../components/StatsCard';

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
        <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">Welcome back, Prof. {user?.name}</h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department of {user?.department || 'N/A'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Active Sessions"
          value={stats?.totalSessions || "0"}
          icon={FiPlay}
          colorClass="from-blue-500 to-indigo-650"
          description="Total sessions created"
        />
        <StatsCard
          title="Attendance Log Count"
          value={stats?.totalAttendanceRecords || "0"}
          icon={FiUsers}
          colorClass="from-emerald-500 to-teal-600"
          description="Total student check-ins"
        />
        <StatsCard
          title="Pending Device Requests"
          value={deviceRequests.length}
          icon={FiSmartphone}
          colorClass={deviceRequests.length > 0 ? "from-red-500 to-amber-600 animate-pulse" : "from-slate-500 to-slate-650"}
          description="Awaiting your approval"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Stats Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center space-x-2">
                <FiBook className="text-primary-500" />
                <span>Subject Analytics</span>
              </h3>
              <Link to="/start-session" className="px-3.5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-primary-500/10 transition-all">
                <FiPlay className="w-3.5 h-3.5" />
                <span>Start Class Session</span>
              </Link>
            </div>

            {(!stats?.subjectWiseStats || stats.subjectWiseStats.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No subjects registered yet.</p>
                <Link to="/subjects" className="text-xs text-primary-500 font-bold hover:underline mt-2 inline-block">Create one now →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Subject</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Code</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-center">Sessions</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-center">Checkins</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-right">Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {stats.subjectWiseStats.map((subj) => (
                      <tr key={subj.id} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/10">
                        <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{subj.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{subj.code}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-slate-800 dark:text-slate-200">{subj.sessions}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-slate-650 dark:text-slate-400">{subj.attendance}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link to={`/reports?subjectId=${subj.id}`} className="inline-flex items-center text-primary-500 hover:text-primary-650 font-bold space-x-1">
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
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-4 flex items-center space-x-2">
              <FiSmartphone className="text-primary-550" />
              <span>Pending Device Resets</span>
            </h3>

            {deviceRequests.length === 0 ? (
              <div className="text-center py-10">
                <FiCheckCircle className="w-12 h-12 text-emerald-500/10 dark:text-emerald-500/20 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">All devices in sync!</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">No students are currently locked out.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deviceRequests.map((req) => (
                  <div key={req._id} className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-250">{req.student?.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-500">{req.student?.registerNumber} • Dept: {req.student?.department} • Year: {req.student?.year}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeviceAction(req._id, 'Approved')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <FiCheck />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleDeviceAction(req._id, 'Rejected')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-650 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <FiX />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
                {deviceRequests.length >= 5 && (
                  <Link to="/device-requests" className="text-xs font-bold text-primary-500 hover:underline block text-center mt-2">View all requests →</Link>
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
