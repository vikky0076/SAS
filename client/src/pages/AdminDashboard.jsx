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
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <FiShield className="text-[#FF6B00]" />
          <span>Admin Control Board</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500">Global system settings and attendance database statistics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || "0"}
          icon={FiUsers}
          colorClass="from-[#FF6B00] to-[#FF8B3D] shadow-orange-500/15"
          description="Enrolled student accounts"
        />
        <StatsCard
          title="Total Teachers"
          value={stats?.totalTeachers || "0"}
          icon={FiUsers}
          colorClass="from-[#FF6B00] to-[#FF6B6B] shadow-orange-500/15"
          description="Registered instructors"
        />
        <StatsCard
          title="Total Subjects"
          value={stats?.totalSubjects || "0"}
          icon={FiBookOpen}
          colorClass="from-[#FF3B3B] to-[#FF8B3D] shadow-red-500/15"
          description="Active courses in database"
        />
        <StatsCard
          title="Device Requests"
          value={stats?.totalRequests || "0"}
          icon={FiSmartphone}
          colorClass={stats?.pendingRequests > 0 ? "from-[#FF3B3B] to-[#FF6B6B] animate-pulse shadow-red-500/15" : "from-slate-400 to-slate-500"}
          description={`${stats?.pendingRequests || 0} requests pending`}
        />
      </div>

      {/* Custom Analytics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 border border-orange-100/50">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <FiTrendingUp className="text-[#FF6B00]" />
            <span>Attendance Load Distribution</span>
          </h3>

          <div className="space-y-6 py-4">
            {/* Subject Distribution Progress Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Computer Science & Engineering</span>
                <span>84% Attendance</span>
              </div>
              <div className="w-full bg-orange-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] h-full rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Electronics & Communication</span>
                <span>78% Attendance</span>
              </div>
              <div className="w-full bg-orange-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] h-full rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Mechanical Engineering</span>
                <span>65% Attendance</span>
              </div>
              <div className="w-full bg-orange-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF3B3B] to-[#FF8B3D] h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between border border-orange-100/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Device Security Metrics</h3>
            <p className="text-xs text-slate-450 mb-6">Device linking helps block proxy checkins by tying attendance to one hardware token.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50/20 border border-orange-100/30 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Total Check-ins Audited:</span>
              <span className="text-sm font-black text-slate-850">{stats?.totalAttendance || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50/20 border border-orange-100/30 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Device Requests Filed:</span>
              <span className="text-sm font-black text-slate-850">{stats?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 border border-red-150 rounded-xl">
              <span className="text-xs font-bold text-red-700">Locked Device Requests:</span>
              <span className="text-sm font-black text-red-700">{stats?.pendingRequests || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
