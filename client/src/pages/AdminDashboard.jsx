import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiUsers, FiBookOpen, FiSmartphone, FiShield, FiTrendingUp } from 'react-icons/fi';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import StatsCard from '../components/StatsCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const studentsColl = collection(db, 'students');
      const teachersQuery = query(collection(db, 'teachers'), where('role', '==', 'teacher'));
      const subjectsColl = collection(db, 'subjects');
      const attendanceColl = collection(db, 'attendance');
      const requestsColl = collection(db, 'deviceRequests');
      const pendingRequestsQuery = query(collection(db, 'deviceRequests'), where('status', '==', 'Pending'));

      const [
        studentsSnap,
        teachersSnap,
        subjectsSnap,
        attendanceSnap,
        requestsSnap,
        pendingRequestsSnap
      ] = await Promise.all([
        getCountFromServer(studentsColl),
        getCountFromServer(teachersQuery),
        getCountFromServer(subjectsColl),
        getCountFromServer(attendanceColl),
        getCountFromServer(requestsColl),
        getCountFromServer(pendingRequestsQuery)
      ]);

      setStats({
        totalStudents: studentsSnap.data().count,
        totalTeachers: teachersSnap.data().count,
        totalSubjects: subjectsSnap.data().count,
        totalAttendance: attendanceSnap.data().count,
        totalRequests: requestsSnap.data().count,
        pendingRequests: pendingRequestsSnap.data().count
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <StatsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiShield className="text-primary-500" />
          <span>Admin Control Board</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Global system settings and attendance database statistics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || "0"}
          icon={FiUsers}
          colorClass="from-blue-500 to-indigo-650"
          description="Enrolled student accounts"
        />
        <StatsCard
          title="Total Teachers"
          value={stats?.totalTeachers || "0"}
          icon={FiUsers}
          colorClass="from-emerald-500 to-teal-600"
          description="Registered instructors"
        />
        <StatsCard
          title="Total Subjects"
          value={stats?.totalSubjects || "0"}
          icon={FiBookOpen}
          colorClass="from-purple-500 to-pink-650"
          description="Active courses in database"
        />
        <StatsCard
          title="Device Requests"
          value={stats?.totalRequests || "0"}
          icon={FiSmartphone}
          colorClass={stats?.pendingRequests > 0 ? "from-red-500 to-amber-600 animate-pulse" : "from-slate-500 to-slate-650"}
          description={`${stats?.pendingRequests || 0} requests pending`}
        />
      </div>

      {/* Custom Analytics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6 flex items-center space-x-2">
            <FiTrendingUp className="text-primary-500" />
            <span>Attendance Load Distribution</span>
          </h3>

          <div className="space-y-6 py-4">
            {/* Subject Distribution Progress Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span>Computer Science & Engineering</span>
                <span>84% Attendance</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span>Electronics & Communication</span>
                <span>78% Attendance</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span>Mechanical Engineering</span>
                <span>65% Attendance</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-amber-605 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-2">Device Security Metrics</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mb-6">Device linking helps block proxy checkins by tying attendance to one hardware token.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Check-ins Audited:</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{stats?.totalAttendance || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Device Requests Filed:</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{stats?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-xs font-bold text-red-700 dark:text-red-400">Locked Device Requests:</span>
              <span className="text-sm font-black text-red-700 dark:text-red-400">{stats?.pendingRequests || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
